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

    const userId = user.id
    console.log(`👤 [LIB] ID de usuario encontrado: ${userId}`)

    // ✅ CORREGIDO: Verificar últimas 24 horas, no día calendario
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    console.log("📅 [LIB] Verificando reclamos desde:", twentyFourHoursAgo.toISOString())

    // Usar import directo como en el resto de tu código
    const { createClient } = await import("@supabase/supabase-js")
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // ✅ CORREGIDO: Buscar reclamos en las últimas 24 horas
    const { data, error } = await supabase
      .from("daily_treasures")
      .select("id, claimed_at")
      .eq("user_id", userId)
      .gte("claimed_at", twentyFourHoursAgo.toISOString())
      .order("claimed_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("❌ [LIB] Error verificando tesoro diario:", error)
      return false
    }

    // Si no hay datos, puede reclamar (primera vez o han pasado más de 24h)
    const canClaim = !data || data.length === 0

    if (data && data.length > 0) {
      const lastClaim = new Date(data[0].claimed_at)
      const hoursRemaining = 24 - Math.floor((Date.now() - lastClaim.getTime()) / (1000 * 60 * 60))
      console.log(`⏰ [LIB] Último reclamo: ${lastClaim.toISOString()}, faltan ${hoursRemaining}h para el próximo`)
    } else {
      console.log(`🎁 [LIB] Usuario nunca ha reclamado o han pasado más de 24h`)
    }

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

    // Verificar que el usuario existe
    const user = await getUserByAddress(wallet_address)
    if (!user) {
      console.error("❌ [LIB] Usuario no encontrado")
      return { success: false, error: "user_not_found" }
    }

    const userId = user.id
    console.log(`👤 [LIB] ID de usuario encontrado: ${userId}`)

    // Verificar si puede reclamar (doble verificación por seguridad)
    const canClaim = await canClaimDailyTreasure(wallet_address)
    if (!canClaim) {
      console.log("❌ [LIB] Usuario no puede reclamar aún (menos de 24h desde último reclamo)")
      return { success: false, error: "too_early" }
    }

    // Enviar los CDT al usuario
    console.log("🔗 [LIB] Enviando CDT a través de blockchain...")
    const { success, txHash, error } = await sendRewards(wallet_address, prizeAmount)

    if (!success || !txHash) {
      console.error("❌ [LIB] Error enviando CDT:", error)
      return { success: false, error: error || "transaction_failed" }
    }

    // Registrar en base de datos
    try {
      const { createClient } = await import("@supabase/supabase-js")
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      // Registrar en daily_treasures
      const { error: treasureError } = await supabase.from("daily_treasures").insert({
        user_id: userId,
        username: username,
        reward_amount: prizeAmount,
        reward_type: "cdt",
        claimed_at: new Date().toISOString(),
      })

      if (treasureError) {
        console.error("❌ [LIB] Error registrando tesoro diario:", treasureError)
      } else {
        console.log("✅ [LIB] Tesoro diario registrado correctamente")
      }

      // ✅ CORREGIDO: Registrar en transactions con los campos correctos
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: userId,
        username: username,
        type: "daily_treasure", // ✅ CAMBIO: usar 'type' en lugar de 'tx_type'
        amount: prizeAmount,
        token_type: "CDT",
        tx_hash: txHash,
        status: "success",
        description: "Premio del tesoro diario",
      })

      if (txError) {
        console.error("❌ [LIB] Error registrando transacción:", txError)
      } else {
        console.log("✅ [LIB] Transacción registrada correctamente")
      }

      // Actualizar total_claimed del usuario
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("total_claimed")
        .eq("id", userId)
        .single()

      if (!userError && userData) {
        const currentTotal = userData.total_claimed || 0
        const newTotal = currentTotal + prizeAmount

        const { error: updateUserError } = await supabase
          .from("users")
          .update({ total_claimed: newTotal })
          .eq("id", userId)

        if (!updateUserError) {
          console.log(`✅ [LIB] Total claimed actualizado: ${currentTotal} -> ${newTotal}`)
        }
      }
    } catch (dbError) {
      console.error("❌ [LIB] Error de base de datos:", dbError)
      // No fallamos la transacción si esto falla, ya que los CDT ya se enviaron
    }

    console.log(`✅ [LIB] CDT enviados exitosamente. Hash: ${txHash}`)
    console.log("🎉 [LIB] Tesoro diario reclamado exitosamente")
    return { success: true, txHash }
  } catch (error) {
    console.error("❌ [LIB] Error inesperado reclamando tesoro diario:", error)
    return { success: false, error: "unexpected_error" }
  }
}
