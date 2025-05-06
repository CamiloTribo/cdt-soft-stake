import { supabase, type StakingInfo } from "./supabase";
import { getCDTBalance, sendRewards } from "./blockchain";

// Función para obtener la información de staking de un usuario
export async function getStakingInfo(userId: string): Promise<StakingInfo | null> {
  try {
    const { data, error } = await supabase.from("staking_info").select("*").eq("user_id", userId).single();

    if (error) {
      // Si no existe información de staking, devolvemos null
      return null;
    }

    // Calculamos las recompensas pendientes
    const pendingRewards = calculatePendingRewards(data);
    
    // Calculamos el tiempo hasta el próximo claim
    const nextClaimTime = calculateNextClaimTime(data.last_claim_timestamp);

    // Añadimos esta información al objeto que devolvemos
    return {
      ...data,
      pending_rewards: pendingRewards,
      next_claim_time: nextClaimTime,
      can_claim: true // MODIFICADO: Siempre permitir claim
    };
  } catch (error) {
    console.error("Error al obtener información de staking:", error);
    return null;
  }
}

// Función para calcular las recompensas pendientes
export function calculatePendingRewards(stakingInfo: StakingInfo): number {
  // Si no hay información de staking, no hay recompensas
  if (!stakingInfo) return 0;

  const lastClaimDate = new Date(stakingInfo.last_claim_timestamp);
  const currentDate = new Date();

  // Calcular horas desde el último claim
  const hoursSinceLastClaim = (currentDate.getTime() - lastClaimDate.getTime()) / (1000 * 60 * 60);

  // Si ha pasado menos de 24 horas, no hay recompensas
  if (hoursSinceLastClaim < 24) return 0;

  // Si ha pasado más de 24 horas, la recompensa es el 0.1% del balance actual
  return stakingInfo.staked_amount * 0.001; // 0.1%
}

// Función para calcular el tiempo del próximo claim
export function calculateNextClaimTime(lastClaimTimestamp: string): Date {
  const lastClaimDate = new Date(lastClaimTimestamp);
  const nextClaimDate = new Date(lastClaimDate);
  
  // El próximo claim es 24 horas después del último
  nextClaimDate.setHours(nextClaimDate.getHours() + 24);
  
  return nextClaimDate;
}

// Función para reclamar recompensas
export async function claimRewards(userId: string, userAddress: string): Promise<{ success: boolean; amount: number; txHash: string | null }> {
  try {
    // Obtener información de staking
    const stakingInfo = await getStakingInfo(userId);
    if (!stakingInfo) return { success: false, amount: 0, txHash: null };

    // Obtener el balance actual para calcular la recompensa exacta
    const currentBalance = await getCDTBalance(userAddress);
    
    // Calcular recompensas (0.1% del balance actual)
    const rewardAmount = currentBalance * 0.001;
    
    if (rewardAmount <= 0) return { success: false, amount: 0, txHash: null };
    
    console.log(`Enviando ${rewardAmount} CDT a ${userAddress}`);
    
    // Enviar recompensas a través de la blockchain
    const txHash = await sendRewards(userAddress, rewardAmount);

    if (!txHash) return { success: false, amount: 0, txHash: null };

    // Actualizar la fecha del último claim (sin total_claimed)
    const now = new Date(); // Añadido aquí ya que se comentó arriba
    const { error } = await supabase
      .from("staking_info")
      .update({
        last_claim_timestamp: now.toISOString(),
        staked_amount: currentBalance // Actualizamos también el balance actual
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating staking info after claim:", error);
      return { success: false, amount: rewardAmount, txHash: txHash };
    }

    return { success: true, amount: rewardAmount, txHash: txHash };
  } catch (error) {
    console.error("Error al reclamar recompensas:", error);
    return { success: false, amount: 0, txHash: null };
  }
}

// Función para actualizar el monto stakeado
export async function updateStakedAmount(userId: string, address: string): Promise<boolean> {
  try {
    // Obtener el balance actual de CDT
    const balance = await getCDTBalance(address);

    // Verificar si ya existe información de staking
    const { data, error } = await supabase.from("staking_info").select("*").eq("user_id", userId);

    if (error) {
      console.error("Error checking existing staking info:", error);
    }

    if (data && data.length > 0) {
      // Actualizar la información existente
      const { error: updateError } = await supabase
        .from("staking_info")
        .update({
          staked_amount: balance,
        })
        .eq("user_id", userId);

      if (updateError) {
        console.error("Error updating staked amount:", updateError);
        return false;
      }
    } else {
      // CAMBIO AQUÍ: Para usuarios nuevos, establecer last_claim_timestamp a hace 25 horas
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 25); // 25 horas atrás
      
      // Crear nueva información de staking con fecha de último claim en el pasado
      const { error: insertError } = await supabase.from("staking_info").insert([
        {
          user_id: userId,
          staked_amount: balance,
          last_claim_timestamp: yesterday.toISOString() // Fecha en el pasado
        },
      ]);

      if (insertError) {
        console.error("Error inserting staking info:", insertError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error al actualizar monto stakeado:", error);
    return false;
  }
}