import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para nuestras tablas
export type User = {
  id: string
  address: string
  username: string | null
  verification_level?: "wallet" | "human" | "orb"
  country?: string | null
  created_at: string
}

export type StakingInfo = {
  id: string
  user_id: string
  staked_amount: number
  last_claim_timestamp: string
  pending_rewards?: number
  next_claim_time?: Date
  can_claim?: boolean
  has_boost?: boolean
  created_at: string
}

// Tipo para la tabla de boosts
export type Boost = {
  id: string
  user_id: string
  username?: string | null
  level_at_purchase: number
  quantity_remaining: number
  is_active: boolean
  price_paid: number
  purchased_at: string
  created_at: string
}

// ✅ CORREGIDO: Tipo para compras de CDT (sin delivery_tx_hash)
export type CdtPurchase = {
  id: string
  user_id: string
  username?: string | null
  wld_amount: number
  cdt_amount: number
  tx_hash?: string | null
  is_claimed: boolean
  purchased_at: string
  claimed_at?: string | null
  created_at: string
}

// Tipo para la tabla daily_treasures
export type DailyTreasure = {
  id: string
  user_id: string
  username?: string | null
  reward_amount: number
  reward_type: string
  claimed_at: string
  created_at: string
}

// Función para obtener un usuario por su dirección de wallet
export async function getUserByAddress(address: string): Promise<User | null> {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("address", address).maybeSingle()

    if (error) {
      console.error("Error fetching user:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserByAddress:", error)
    return null
  }
}

// Función para crear un usuario
export async function createUser(address: string, username = "", verification_level = "wallet"): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          address: address,
          username: username || null,
          verification_level: verification_level,
        },
      ])
      .select()
      .maybeSingle()

    if (error) {
      // Si el error es porque el usuario ya existe, intentamos obtenerlo
      if (error.code === "23505") {
        return getUserByAddress(address)
      }
      console.error("Error creating user:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in createUser:", error)
    return null
  }
}

// Función para actualizar el username
export async function updateUsername(userId: string, username: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("users").update({ username }).eq("id", userId)

    if (error) {
      console.error("Error updating username:", error)
      return false
    }
    return true
  } catch (error) {
    console.error("Error in updateUsername:", error)
    return false
  }
}

// Función para actualizar el nivel de verificación
export async function updateVerificationLevel(userId: string, verificationLevel: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("users").update({ verification_level: verificationLevel }).eq("id", userId)

    if (error) {
      console.error("Error updating verification level:", error)
      return false
    }
    return true
  } catch (error) {
    console.error("Error in updateVerificationLevel:", error)
    return false
  }
}

// ==================== FUNCIONES PARA BOOSTS ====================

// Función para obtener los boosts disponibles de un usuario
export async function getUserAvailableBoosts(userId: string): Promise<number> {
  try {
    console.log(`🔍 getUserAvailableBoosts: Buscando boosts para userId: ${userId}`)

    const { data, error } = await supabase
      .from("boosts")
      .select("quantity_remaining")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gt("quantity_remaining", 0)

    if (error) {
      console.error("❌ getUserAvailableBoosts: Error fetching available boosts:", error)
      return 0
    }

    const total = data.reduce(
      (total: number, boost: { quantity_remaining: number }) => total + boost.quantity_remaining,
      0,
    )
    console.log(`✅ getUserAvailableBoosts: Total boosts disponibles: ${total}`)

    return total
  } catch (error) {
    console.error("💥 getUserAvailableBoosts: Error general:", error)
    return 0
  }
}

// Función para registrar la compra de boosts
export async function purchaseBoosts(
  userId: string,
  username: string | null,
  level: number,
  quantity: number,
  pricePaid: number,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("boosts").insert({
      user_id: userId,
      username: username,
      level_at_purchase: level,
      quantity_remaining: quantity,
      is_active: true,
      price_paid: pricePaid,
      purchased_at: new Date().toISOString(),
    })

    if (error) {
      console.error("Error purchasing boosts:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in purchaseBoosts:", error)
    return false
  }
}

// Función para usar un boost
export async function applyBoost(
  userId: string,
  username: string | null,
  claimAmount: number,
): Promise<{ success: boolean; boostedAmount: number; boostId?: string }> {
  try {
    console.log(`🚀 BOOST APPLY: ===== INICIANDO APLICACIÓN DE BOOST =====`)
    console.log(`🚀 BOOST APPLY: userId: ${userId}`)
    console.log(`🚀 BOOST APPLY: username: ${username}`)
    console.log(`🚀 BOOST APPLY: claimAmount: ${claimAmount}`)
    console.log(`🚀 BOOST APPLY: timestamp: ${new Date().toISOString()}`)

    // 1. Obtener el boost más antiguo disponible
    console.log(`🔍 BOOST APPLY: Paso 1 - Buscando boosts disponibles...`)
    const { data: boostData, error: boostError } = await supabase
      .from("boosts")
      .select("id, quantity_remaining, username, level_at_purchase, purchased_at")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gt("quantity_remaining", 0)
      .order("purchased_at", { ascending: true })
      .limit(1)

    if (boostError || !boostData || boostData.length === 0) {
      console.log(`❌ BOOST APPLY: No se encontraron boosts disponibles`)
      return { success: false, boostedAmount: claimAmount }
    }

    const boost = boostData[0]
    const boostId = boost.id
    const currentQuantity = boost.quantity_remaining

    console.log(`✅ BOOST APPLY: Boost encontrado - ID: ${boostId}, Cantidad: ${currentQuantity}`)

    // 2. ✅ SOLO RETORNAMOS LA INFORMACIÓN, NO MODIFICAMOS NADA AÚN
    const finalAmount = claimAmount * 2
    console.log(`🎯 BOOST APPLY: Boost preparado - Cantidad con boost: ${finalAmount}`)

    return {
      success: true,
      boostedAmount: finalAmount,
      boostId: boostId, // ✅ Devolvemos el ID para confirmar después
    }
  } catch (error) {
    console.error(`💥 BOOST APPLY: Error general:`, error)
    return { success: false, boostedAmount: claimAmount }
  }
}

// ✅ NUEVA FUNCIÓN: Confirmar el uso del boost SOLO si la transacción fue exitosa
export async function confirmBoostUsage(
  boostId: string,
  userId: string,
  username: string | null,
  claimAmount: number,
): Promise<boolean> {
  try {
    console.log(`✅ CONFIRM BOOST: Confirmando uso del boost ${boostId}`)

    // 1. Obtener datos actuales del boost
    const { data: boostData, error: fetchError } = await supabase
      .from("boosts")
      .select("quantity_remaining")
      .eq("id", boostId)
      .single()

    if (fetchError || !boostData) {
      console.error(`❌ CONFIRM BOOST: Error obteniendo boost:`, fetchError)
      return false
    }

    const currentQuantity = boostData.quantity_remaining
    const newQuantity = currentQuantity - 1

    // 2. Registrar el uso del boost
    const { error: usageError } = await supabase.from("boost_usage").insert({
      boost_id: boostId,
      user_id: userId,
      username: username,
      claim_amount_base: claimAmount,
      claim_amount_boosted: claimAmount * 2,
    })

    if (usageError) {
      console.error(`❌ CONFIRM BOOST: Error registrando uso:`, usageError)
      return false
    }

    // 3. Actualizar la cantidad de boosts restantes
    const { error: updateError } = await supabase
      .from("boosts")
      .update({
        quantity_remaining: newQuantity,
        is_active: newQuantity > 0,
      })
      .eq("id", boostId)

    if (updateError) {
      console.error(`❌ CONFIRM BOOST: Error actualizando boost:`, updateError)
      return false
    }

    console.log(`🎉 CONFIRM BOOST: Boost confirmado exitosamente - Restantes: ${newQuantity}`)
    return true
  } catch (error) {
    console.error(`💥 CONFIRM BOOST: Error general:`, error)
    return false
  }
}

// Función para invalidar boosts cuando un usuario sube de nivel
export async function invalidateBoostsOnLevelUp(userId: string, newLevel: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("boosts")
      .update({ is_active: false })
      .eq("user_id", userId)
      .lt("level_at_purchase", newLevel)
      .gt("quantity_remaining", 0)

    if (error) {
      console.error("Error invalidating boosts:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in invalidateBoostsOnLevelUp:", error)
    return false
  }
}

// Función para verificar si un usuario tiene boosts disponibles
export async function hasAvailableBoosts(userId: string): Promise<boolean> {
  try {
    console.log(`🔍 hasAvailableBoosts: Verificando boosts para userId: ${userId}`)

    const { count, error } = await supabase
      .from("boosts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true)
      .gt("quantity_remaining", 0)

    if (error) {
      console.error("❌ hasAvailableBoosts: Error checking available boosts:", error)
      return false
    }

    const hasBoosts = count !== null && count > 0
    console.log(`✅ hasAvailableBoosts: Usuario ${userId} tiene boosts: ${hasBoosts} (count: ${count})`)

    return hasBoosts
  } catch (error) {
    console.error("💥 hasAvailableBoosts: Error general:", error)
    return false
  }
}

// ==================== FUNCIONES PARA COMPRAS CDT ✅ NUEVO ====================

// Función para obtener compras pendientes de claim
export async function getPendingCdtPurchases(userId: string): Promise<CdtPurchase[]> {
  try {
    console.log(`🔍 getPendingCdtPurchases: Buscando compras pendientes para userId: ${userId}`)

    const { data, error } = await supabase
      .from("cdt_purchases")
      .select("*")
      .eq("user_id", userId)
      .eq("is_claimed", false)
      .order("purchased_at", { ascending: false })

    if (error) {
      console.error("❌ getPendingCdtPurchases: Error fetching pending CDT purchases:", error)
      return []
    }

    console.log(`✅ getPendingCdtPurchases: Encontradas ${data?.length || 0} compras pendientes`)
    return data || []
  } catch (error) {
    console.error("💥 getPendingCdtPurchases: Error general:", error)
    return []
  }
}

// Función para obtener historial de compras CDT
export async function getCdtPurchaseHistory(userId: string): Promise<CdtPurchase[]> {
  try {
    console.log(`🔍 getCdtPurchaseHistory: Obteniendo historial para userId: ${userId}`)

    const { data, error } = await supabase
      .from("cdt_purchases")
      .select("*")
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false })

    if (error) {
      console.error("❌ getCdtPurchaseHistory: Error fetching CDT purchase history:", error)
      return []
    }

    console.log(`✅ getCdtPurchaseHistory: Encontradas ${data?.length || 0} compras en total`)
    return data || []
  } catch (error) {
    console.error("💥 getCdtPurchaseHistory: Error general:", error)
    return []
  }
}

// Función para obtener estadísticas de compras CDT del usuario
export async function getCdtPurchaseStats(userId: string): Promise<{
  totalPurchases: number
  totalWldSpent: number
  totalCdtPurchased: number
  pendingClaims: number
}> {
  try {
    console.log(`📊 getCdtPurchaseStats: Obteniendo estadísticas para userId: ${userId}`)

    const { data, error } = await supabase
      .from("cdt_purchases")
      .select("wld_amount, cdt_amount, is_claimed")
      .eq("user_id", userId)

    if (error) {
      console.error("❌ getCdtPurchaseStats: Error fetching CDT purchase stats:", error)
      return { totalPurchases: 0, totalWldSpent: 0, totalCdtPurchased: 0, pendingClaims: 0 }
    }

    const stats = data.reduce(
      (acc, purchase) => {
        acc.totalPurchases += 1
        acc.totalWldSpent += purchase.wld_amount
        acc.totalCdtPurchased += purchase.cdt_amount
        if (!purchase.is_claimed) {
          acc.pendingClaims += 1
        }
        return acc
      },
      { totalPurchases: 0, totalWldSpent: 0, totalCdtPurchased: 0, pendingClaims: 0 },
    )

    console.log(`✅ getCdtPurchaseStats: Estadísticas calculadas:`, stats)
    return stats
  } catch (error) {
    console.error("💥 getCdtPurchaseStats: Error general:", error)
    return { totalPurchases: 0, totalWldSpent: 0, totalCdtPurchased: 0, pendingClaims: 0 }
  }
}

// ==================== FUNCIONES PARA TESORO DIARIO ====================

// Función para verificar si el usuario puede reclamar tesoro hoy
export async function canClaimDailyTreasure(userId: string): Promise<boolean> {
  try {
    console.log(`🔍 canClaimDailyTreasure: Verificando para userId: ${userId}`)

    const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD

    const { data, error } = await supabase
      .from("daily_treasures")
      .select("id")
      .eq("user_id", userId)
      .gte("claimed_at", `${today}T00:00:00.000Z`)
      .lt("claimed_at", `${today}T23:59:59.999Z`)
      .limit(1)

    if (error) {
      console.error("❌ canClaimDailyTreasure: Error checking daily treasure:", error)
      return false
    }

    const canClaim = !data || data.length === 0
    console.log(`✅ canClaimDailyTreasure: Usuario ${userId} puede reclamar: ${canClaim}`)

    return canClaim
  } catch (error) {
    console.error("💥 canClaimDailyTreasure: Error general:", error)
    return false
  }
}

// Función para registrar tesoro diario reclamado
export async function recordDailyTreasure(
  userId: string,
  username: string | null,
  rewardAmount: number,
  rewardType = "cdt",
): Promise<boolean> {
  try {
    console.log(`💰 recordDailyTreasure: Registrando tesoro para userId: ${userId}, cantidad: ${rewardAmount}`)

    const { error } = await supabase.from("daily_treasures").insert({
      user_id: userId,
      username: username,
      reward_amount: rewardAmount,
      reward_type: rewardType,
      claimed_at: new Date().toISOString(),
    })

    if (error) {
      console.error("❌ recordDailyTreasure: Error recording daily treasure:", error)
      return false
    }

    console.log(`✅ recordDailyTreasure: Tesoro registrado exitosamente`)
    return true
  } catch (error) {
    console.error("💥 recordDailyTreasure: Error general:", error)
    return false
  }
}

// Función para obtener historial de tesoros diarios
export async function getDailyTreasureHistory(userId: string): Promise<DailyTreasure[]> {
  try {
    console.log(`📊 getDailyTreasureHistory: Obteniendo historial para userId: ${userId}`)

    const { data, error } = await supabase
      .from("daily_treasures")
      .select("*")
      .eq("user_id", userId)
      .order("claimed_at", { ascending: false })
      .limit(30) // Últimos 30 tesoros

    if (error) {
      console.error("❌ getDailyTreasureHistory: Error fetching treasure history:", error)
      return []
    }

    console.log(`✅ getDailyTreasureHistory: Encontrados ${data?.length || 0} tesoros`)
    return data || []
  } catch (error) {
    console.error("💥 getDailyTreasureHistory: Error general:", error)
    return []
  }
}

export { createClient }
