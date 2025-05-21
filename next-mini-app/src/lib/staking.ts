import { supabase, type StakingInfo } from "./supabase"
import { getCDTBalance, sendRewards } from "./blockchain"
import { getDailyRateForAmount } from "./levels"
import type { TranslationKey } from "../types/translations"

// Función de utilidad para reintentos
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Intento ${attempt} para ${url}`);
      const response = await fetch(url, options);
      if (response.ok) return response;
      lastError = new Error(`HTTP error ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.warn(`Intento ${attempt} falló:`, error);
      lastError = error;
      
      // Esperar antes de reintentar (backoff exponencial)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

// Función para normalizar valores decimales extremadamente pequeños
function normalizeAmount(amount: number): number {
  // Si el valor es extremadamente pequeño (menor que 1e-15), lo redondeamos a 0
  if (amount < 1e-15) {
    console.log(`Valor extremadamente pequeño detectado: ${amount}, normalizando a 0`);
    return 0;
  }
  
  // Para otros valores pequeños pero manejables, redondeamos a 15 decimales máximo
  // Esto evita problemas con notación científica en ethers.js
  if (amount < 0.1) {
    const rounded = parseFloat(amount.toFixed(15));
    console.log(`Valor pequeño normalizado: ${amount} -> ${rounded}`);
    return rounded;
  }
  
  return amount;
}

// Función para obtener la información de staking de un usuario
export async function getStakingInfo(userId: string, walletAddress?: string): Promise<StakingInfo | null> {
  try {
    const { data, error } = await supabase.from("staking_info").select("*").eq("user_id", userId).single()

    if (error) {
      // Si no existe información de staking, devolvemos null
      return null
    }

    // Si se proporciona la dirección de wallet, verificar el balance actual
    if (walletAddress) {
      const currentBalance = await getCDTBalance(walletAddress)

      // Si el balance ha cambiado significativamente, actualizarlo en la base de datos
      if (Math.abs(data.staked_amount - currentBalance) > 0.000001) {
        console.log(`Balance ha cambiado para ${userId}. DB: ${data.staked_amount}, Blockchain: ${currentBalance}`)

        // Actualizar en la base de datos
        const { error: updateError } = await supabase
          .from("staking_info")
          .update({
            staked_amount: currentBalance,
          })
          .eq("user_id", userId)

        if (updateError) {
          console.error("Error updating staked amount:", updateError)
        } else {
          // Actualizar el objeto data con el nuevo balance
          data.staked_amount = currentBalance
        }
      }
    }

    // Calculamos las recompensas pendientes
    const pendingRewards = calculatePendingRewards(data)

    // Calculamos el tiempo hasta el próximo claim
    const nextClaimTime = calculateNextClaimTime(data.last_claim_timestamp)

    // Añadimos esta información al objeto que devolvemos
    return {
      ...data,
      pending_rewards: pendingRewards,
      next_claim_time: nextClaimTime,
      can_claim: true, // MODIFICADO: Siempre permitir claim
    }
  } catch (error) {
    console.error("Error al obtener información de staking:", error)
    return null
  }
}

// Función para calcular las recompensas pendientes
export function calculatePendingRewards(stakingInfo: StakingInfo): number {
  // Si no hay información de staking, no hay recompensas
  if (!stakingInfo) return 0

  const lastClaimDate = new Date(stakingInfo.last_claim_timestamp)
  const currentDate = new Date()

  // Calcular horas desde el último claim
  const hoursSinceLastClaim = (currentDate.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60)

  // Si ha pasado menos de 24 horas, no hay recompensas
  if (hoursSinceLastClaim < 24) return 0

  // Convertir la función t para que acepte string en lugar de TranslationKey
  const tString = (key: string) => key as TranslationKey

  // Obtener la tasa diaria según el nivel del usuario
  const dailyRate = getDailyRateForAmount(stakingInfo.staked_amount, tString) / 100

  // Calcular recompensas según la tasa del nivel
  return stakingInfo.staked_amount * dailyRate
}

// Función para calcular el tiempo del próximo claim
export function calculateNextClaimTime(lastClaimTimestamp: string): Date {
  const lastClaimDate = new Date(lastClaimTimestamp)
  const nextClaimDate = new Date(lastClaimDate)

  // El próximo claim es 24 horas después del último
  nextClaimDate.setHours(nextClaimDate.getHours() + 24)

  return nextClaimDate
}

// Función para reclamar recompensas
export async function claimRewards(
  userId: string,
  userAddress: string,
): Promise<{ success: boolean; amount: number; txHash: string | null }> {
  try {
    // Obtener información de staking
    const stakingInfo = await getStakingInfo(userId, userAddress)
    if (!stakingInfo) return { success: false, amount: 0, txHash: null }

    // Obtener el balance actual para calcular la recompensa exacta
    const currentBalance = await getCDTBalance(userAddress)

    // Convertir la función t para que acepte string en lugar de TranslationKey
    const tString = (key: string) => key as TranslationKey

    // Obtener la tasa diaria según el nivel del usuario
    const dailyRate = getDailyRateForAmount(currentBalance, tString) / 100

    // Calcular recompensas según la tasa del nivel
    let rewardAmount = currentBalance * dailyRate

    // NUEVO: Normalizar el valor de recompensa para evitar errores con valores extremadamente pequeños
    rewardAmount = normalizeAmount(rewardAmount)

    if (rewardAmount <= 0) return { success: false, amount: 0, txHash: null }

    console.log(`Enviando ${rewardAmount} CDT a ${userAddress} (tasa: ${dailyRate * 100}%)`)

    // Enviar recompensas a través de la blockchain
    const sendResult = await sendRewards(userAddress, rewardAmount)

    // Verificar si la transacción fue exitosa
    if (!sendResult.success || !sendResult.txHash) {
      console.error("Error en sendRewards:", sendResult.error || "Transacción fallida")
      return { success: false, amount: 0, txHash: null }
    }

    // Actualizar la fecha del último claim (sin total_claimed)
    const now = new Date()
    const { error } = await supabase
      .from("staking_info")
      .update({
        last_claim_timestamp: now.toISOString(),
        staked_amount: currentBalance, // Actualizamos también el balance actual
      })
      .eq("user_id", userId)

    if (error) {
      console.error("Error updating staking info after claim:", error)
      return { success: false, amount: rewardAmount, txHash: sendResult.txHash }
    }

    // Sincronizar el nivel del usuario
    try {
      // Construir URL absoluta - CAMBIO AQUÍ
      const baseUrl = 'https://tribo-vault.vercel.app'; // URL fija sin variable de entorno
      const updateLevelUrl = `${baseUrl}/api/update-level`;
      
      // Usar fetchWithRetry para manejar fallos temporales
      await fetchWithRetry(updateLevelUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: userAddress,
          staked_amount: currentBalance,
        }),
      }, 3); // 3 intentos máximo
    } catch (error) {
      console.error("Error syncing user level:", error)
      // No interrumpimos el flujo si falla la sincronización del nivel
    }

    return { success: true, amount: rewardAmount, txHash: sendResult.txHash }
  } catch (error) {
    console.error("Error al reclamar recompensas:", error)
    return { success: false, amount: 0, txHash: null }
  }
}

// Función para actualizar el monto stakeado
export async function updateStakedAmount(userId: string, address: string): Promise<boolean> {
  try {
    // Obtener el balance actual de CDT
    const balance = await getCDTBalance(address)

    // Verificar si ya existe información de staking
    const { data, error } = await supabase.from("staking_info").select("*").eq("user_id", userId)

    if (error) {
      console.error("Error checking existing staking info:", error)
    }

    if (data && data.length > 0) {
      // Actualizar la información existente
      const { error: updateError } = await supabase
        .from("staking_info")
        .update({
          staked_amount: balance,
        })
        .eq("user_id", userId)

      if (updateError) {
        console.error("Error updating staked amount:", updateError)
        return false
      }
    } else {
      // CAMBIO AQUÍ: Para usuarios nuevos, establecer last_claim_timestamp a hace 25 horas
      const yesterday = new Date()
      yesterday.setHours(yesterday.getHours() - 25) // 25 horas atrás

      // Crear nueva información de staking con fecha de último claim en el pasado
      const { error: insertError } = await supabase.from("staking_info").insert([
        {
          user_id: userId,
          staked_amount: balance,
          last_claim_timestamp: yesterday.toISOString(), // Fecha en el pasado
        },
      ])

      if (insertError) {
        console.error("Error inserting staking info:", insertError)
        return false
      }
    }

    // Sincronizar el nivel del usuario
    try {
      // Construir URL absoluta - CAMBIO AQUÍ
      const baseUrl = 'https://tribo-vault.vercel.app'; // URL fija sin variable de entorno
      const updateLevelUrl = `${baseUrl}/api/update-level`;
      
      // Usar fetchWithRetry para manejar fallos temporales
      await fetchWithRetry(updateLevelUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: address,
          staked_amount: balance,
        }),
      }, 3); // 3 intentos máximo
    } catch (error) {
      console.error("Error syncing user level:", error)
      // No interrumpimos el flujo si falla la sincronización del nivel
    }

    return true
  } catch (error) {
    console.error("Error al actualizar monto stakeado:", error)
    return false
  }
}