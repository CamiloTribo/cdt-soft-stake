import { NextResponse } from "next/server"
import { getUserByAddress } from "@/src/lib/supabase"
import { claimRewards } from "@/src/lib/staking"
import { sendRewards } from "@/src/lib/blockchain" // ✅ Añadir para referidos
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Interfaz para errores con mensaje
interface ErrorWithMessage {
  message: string;
}

// Función para verificar si un error tiene propiedad message
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Función para obtener el mensaje de error
function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}

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

export async function POST(request: Request) {
  try {
    // Obtener la dirección de wallet del body
    const body = await request.json()
    const { wallet_address } = body

    if (!wallet_address) {
      return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 })
    }

    // Buscar al usuario por su dirección de wallet
    const user = await getUserByAddress(wallet_address)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Reclamar recompensas
    let claimResult;
    try {
      claimResult = await claimRewards(user.id, wallet_address)
    } catch (error: unknown) {
      console.error("Error en claimRewards:", error)
      
      // Si el error es por un valor decimal inválido, proporcionamos un mensaje más claro
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes("invalid decimal value")) {
        console.log("Detectado error de valor decimal inválido")
        
        return NextResponse.json({
          success: false,
          error: "Error al procesar recompensas. Por favor, intenta nuevamente más tarde.",
          details: "Se ha detectado un valor decimal inválido que será corregido automáticamente."
        }, { status: 400 })
      }
      
      // Si es otro tipo de error, lo propagamos
      throw error
    }

    // Verificación mejorada del resultado
    if (!claimResult || !claimResult.success || !claimResult.txHash) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to claim rewards",
          details: claimResult ? `Amount: ${claimResult.amount}, TxHash: ${claimResult.txHash}` : "No result",
        },
        { status: 400 },
      )
    }

    // Registrar la transacción
    const { error: txError } = await supabase.from("transactions").insert([
      {
        user_id: user.id,
        type: "claim",
        amount: claimResult.amount,
        token_type: "CDT",
        tx_hash: claimResult.txHash,
        status: "success",
        description: "Reclamación de recompensas diarias",
      },
    ])

    if (txError) {
      console.error("Error registering transaction:", txError)
      // Continuamos aunque falle el registro de la transacción
    }

    // MEJORA: Actualizar el total_claimed del usuario de manera más eficiente
    // Obtenemos el total_claimed actual para asegurarnos de tener el valor más reciente
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("total_claimed")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("Error getting current total_claimed:", userError)
    } else {
      // Calculamos el nuevo total_claimed
      const currentTotal = userData.total_claimed || 0
      const newTotal = currentTotal + claimResult.amount

      // Actualizamos directamente con el nuevo valor
      const { error: updateError } = await supabase.from("users").update({ total_claimed: newTotal }).eq("id", user.id)

      if (updateError) {
        console.error("Error updating total_claimed:", updateError)
      } else {
        console.log(`Total claimed updated for user ${user.id}: ${currentTotal} -> ${newTotal}`)
      }
    }

    // ===== INICIO: CÓDIGO PARA RECOMPENSAS DE REFERIDOS =====
    try {
      // 1. Verificar si el usuario tiene un referente
      console.log("🔍 REFERRAL: Verificando si el usuario tiene referente...");
      const { data: referralData, error: referralError } = await supabase
        .from("referrals")
        .select("referrer_id, referrer_username")
        .eq("referred_id", user.id)
        .maybeSingle();

      if (referralError) {
        console.error("❌ REFERRAL: Error al buscar referente:", referralError);
      } 
      else if (referralData && referralData.referrer_id) {
        // 2. Calcular 1% de la recompensa
        const referralReward = claimResult.amount * 0.01;
        console.log(`💰 REFERRAL: Calculando 1% de ${claimResult.amount} = ${referralReward} CDT`);

        // 2.5. ✅ NUEVO: Obtener dirección de wallet del referente
        console.log(`🔍 REFERRAL: Obteniendo dirección de wallet del referente ${referralData.referrer_username}...`);
        const { data: referrerUser, error: referrerError } = await supabase
          .from("users")
          .select("address")
          .eq("id", referralData.referrer_id)
          .single();

        if (referrerError || !referrerUser) {
          console.error("❌ REFERRAL: No se pudo obtener dirección del referente:", referrerError);
        } else {
          // 3. Enviar recompensa al referente
          console.log(`💸 REFERRAL: Enviando ${referralReward} CDT al referente ${referralData.referrer_username} (${referrerUser.address})`);
          const referralSendResult = await sendRewards(referrerUser.address, referralReward); // ✅ CORREGIDO: Usar address en lugar de UUID

          if (referralSendResult.success) {
            console.log(`✅ REFERRAL: Recompensa enviada exitosamente. Hash: ${referralSendResult.txHash}`);
            
            // 4. Registrar en la tabla referral_rewards
            const { error: rewardError } = await supabase.from("referral_rewards").insert({
              referrer_id: referralData.referrer_id,
              referred_id: user.id,
              claim_amount: claimResult.amount,
              reward_amount: referralReward,
              tx_hash: referralSendResult.txHash,
              created_at: new Date().toISOString()
            });

            if (rewardError) {
              console.error("❌ REFERRAL: Error al registrar recompensa:", rewardError);
            } else {
              console.log("✅ REFERRAL: Recompensa registrada correctamente");
            }

            // 5. OPCIONAL: Registrar también en transactions para el referente
            try {
              const referrerUserFull = await getUserByAddress(referrerUser.address);
              if (referrerUserFull) {
                const { error: txError } = await supabase.from("transactions").insert({
                  user_id: referrerUserFull.id,
                  type: "referral_reward",
                  amount: referralReward,
                  token_type: "CDT",
                  tx_hash: referralSendResult.txHash,
                  status: "success",
                  description: `Recompensa por referido: ${user.username || user.address}`,
                });

                if (txError) {
                  console.error("⚠️ REFERRAL: Error al registrar transacción (no crítico):", txError);
                } else {
                  console.log("✅ REFERRAL: Transacción registrada para el referente");
                }
              }
            } catch (txError) {
              console.error("⚠️ REFERRAL: Error al registrar transacción (no crítico):", txError);
            }

          } else {
            console.error("❌ REFERRAL: Error al enviar recompensa:", referralSendResult.error);
          }
        }
      } else {
        console.log("ℹ️ REFERRAL: El usuario no tiene referente");
      }
    } catch (referralError) {
      console.error("❌ REFERRAL: Error general en proceso de recompensa:", referralError);
      // No interrumpimos el flujo principal si falla la recompensa
    }
    // ===== FIN: CÓDIGO PARA RECOMPENSAS DE REFERIDOS =====

    // Sincronizar el nivel del usuario después del claim
    try {
      // Construir URL absoluta
      const baseUrl = "https://tribo-vault.vercel.app";
      const updateLevelUrl = `${baseUrl}/api/update-level`;
      
      // Obtener el balance actual
      const { data: stakingData } = await supabase
        .from("staking_info")
        .select("staked_amount")
        .eq("user_id", user.id)
        .single();
        
      if (stakingData) {
        // Usar fetchWithRetry para manejar fallos temporales
        await fetchWithRetry(updateLevelUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: wallet_address,
            staked_amount: stakingData.staked_amount,
          }),
        }, 3); // 3 intentos máximo
      }
    } catch (error) {
      console.error("Error syncing user level after claim:", error);
      // No interrumpimos el flujo principal si falla la sincronización
    }

    return NextResponse.json({
      success: true,
      message: "¡Recompensas reclamadas correctamente!",
      amount: claimResult.amount, // Añadimos la cantidad reclamada en la respuesta
    })
  } catch (error: unknown) {
    console.error("Error in claim API:", error)
    return NextResponse.json(
      {
        success: false,
        error: isErrorWithMessage(error) ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}