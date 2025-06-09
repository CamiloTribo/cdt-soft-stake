import { getUserByAddress } from "./supabase"
import { sendRewards } from "./blockchain"

// Probabilidades de premios
const TREASURE_PRIZES = [
  { amount: 0.1, probability: 70 }, // Común
  { amount: 0.5, probability: 20 }, // Poco común
  { amount: 1.0, probability: 7 }, // Raro
  { amount: 5.0, probability: 2.5 }, // Épico
  { amount: 10.0, probability: 0.5 }, // Legendario
]

// Total de probabilidades para normalización
const TOTAL_PROBABILITY = TREASURE_PRIZES.reduce((sum, prize) => sum + prize.probability, 0)

/**
 * Verifica si un usuario puede reclamar el tesoro diario
 * @param wallet_address Dirección de wallet del usuario
 * @returns {Promise<boolean>} True si puede reclamar, false si no
 */
export async function canClaimDailyTreasure(wallet_address: string): Promise<boolean> {
  try {
    console.log("🔍 [LIB] Verificando disponibilidad de tesoro diario para:", wallet_address)

    // Verificar que el usuario existe
    const user = await getUserByAddress(wallet_address)
    if (!user) {
      console.error("❌ [LIB] Usuario no encontrado")
      return false
    }

    // Obtener la fecha actual en UTC y resetear a las 00:00:00
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    console.log("📅 [LIB] Verificando reclamos desde:", today.toISOString())

    // Usar import directo como en el resto de tu código
    const { createClient } = await import("@supabase/supabase-js")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // ✅ CAMBIADO: Usar tabla daily_treasures en lugar de transactions
    const { data, error } = await supabase
      .from("daily_treasures")
      .select("id")
      .eq("user_id", wallet_address)
      .gte("claimed_at", today.toISOString())
      .limit(1)

    if (error) {
      console.error("❌ [LIB] Error verificando tesoro diario:", error)
      return false
    }

    // Si no hay datos, puede reclamar
    const canClaim = !data || data.length === 0
    console.log(`✅ [LIB] Tesoro diario disponible para ${wallet_address}: ${canClaim}`)
    return canClaim
  } catch (error) {
    console.error("❌ [LIB] Error inesperado verificando tesoro diario:", error)
    return false
  }
}

/**
 * Genera un premio aleatorio basado en las probabilidades definidas
 * @returns {number} Cantidad de CDT ganada
 */
export function generateTreasurePrize(): number {
  try {
    console.log("🎲 [LIB] Generando premio aleatorio del tesoro diario...")

    // Generar un número aleatorio entre 0 y el total de probabilidades
    const random = Math.random() * TOTAL_PROBABILITY
    console.log(`🎯 [LIB] Número aleatorio generado: ${random.toFixed(4)}`)

    // Encontrar el premio correspondiente
    let cumulativeProbability = 0
    for (const prize of TREASURE_PRIZES) {
      cumulativeProbability += prize.probability
      if (random <= cumulativeProbability) {
        console.log(`🎁 [LIB] Premio generado: ${prize.amount} CDT (probabilidad: ${prize.probability}%)`)
        return prize.amount
      }
    }

    // Si por alguna razón no se encuentra un premio, devolver el mínimo
    console.log("⚠️ [LIB] No se encontró premio, devolviendo el mínimo")
    return TREASURE_PRIZES[0].amount
  } catch (error) {
    console.error("❌ [LIB] Error generando premio:", error)
    return TREASURE_PRIZES[0].amount
  }
}

/**
 * Procesa el reclamo del tesoro diario
 * @param wallet_address Dirección de wallet del usuario
 * @param username Nombre de usuario
 * @param prizeAmount Cantidad de CDT ganada
 * @returns {Promise<{success: boolean, txHash?: string, error?: string}>}
 */
export async function claimDailyTreasure(
  wallet_address: string,
  username: string | null,
  prizeAmount: number,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log(`🚀 [LIB] Procesando reclamo de tesoro diario para ${wallet_address}`)
    console.log(`💰 [LIB] Premio a enviar: ${prizeAmount} CDT`)

    // Verificar si puede reclamar
    const canClaim = await canClaimDailyTreasure(wallet_address)
    if (!canClaim) {
      console.log("❌ [LIB] Usuario ya ha reclamado hoy")
      return { success: false, error: "already_claimed" }
    }

    // Enviar los CDT al usuario (usando la misma función que el claim normal)
    console.log("🔗 [LIB] Enviando CDT a través de blockchain...")
    const { success, txHash, error } = await sendRewards(wallet_address, prizeAmount)

    if (!success || !txHash) {
      console.error("❌ [LIB] Error enviando CDT:", error)
      return { success: false, error: error || "transaction_failed" }
    }

    console.log(`✅ [LIB] CDT enviados exitosamente. Hash: ${txHash}`)
    console.log("🎉 [LIB] Tesoro diario reclamado exitosamente")
    return { success: true, txHash }
  } catch (error) {
    console.error("❌ [LIB] Error inesperado reclamando tesoro diario:", error)
    return { success: false, error: "unexpected_error" }
  }
}
