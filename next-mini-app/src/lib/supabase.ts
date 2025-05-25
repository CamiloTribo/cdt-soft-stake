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
    const { data, error } = await supabase
      .from("boosts")
      .select("quantity_remaining")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gt("quantity_remaining", 0)

    if (error) {
      console.error("Error fetching available boosts:", error)
      return 0
    }

    // Sumar todos los boosts disponibles
    return data.reduce((total: number, boost: { quantity_remaining: number }) => total + boost.quantity_remaining, 0)
  } catch (error) {
    console.error("Error in getUserAvailableBoosts:", error)
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
  tx_hash: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("boosts").insert({
      user_id: userId,
      username: username,
      wallet_address: userId, // userId es la wallet address
      level_at_purchase: level,
      quantity_remaining: quantity,
      is_active: true,
      price_paid: pricePaid,
      tx_hash: tx_hash,
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
): Promise<{ success: boolean; boostedAmount: number }> {
  try {
    // 1. Obtener el boost más antiguo disponible
    const { data: boostData, error: boostError } = await supabase
      .from("boosts")
      .select("id, quantity_remaining")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gt("quantity_remaining", 0)
      .order("purchased_at", { ascending: true })
      .limit(1)

    if (boostError || !boostData || boostData.length === 0) {
      return { success: false, boostedAmount: claimAmount }
    }

    const boostId = boostData[0].id
    const currentQuantity = boostData[0].quantity_remaining

    // 2. Registrar el uso del boost
    const { error: usageError } = await supabase.from("boost_usage").insert({
      boost_id: boostId,
      user_id: userId,
      username: username,
      claim_amount_base: claimAmount,
      claim_amount_boosted: claimAmount * 2, // x2 boost
      timestamp: new Date().toISOString(),
    })

    if (usageError) {
      console.error("Error registering boost usage:", usageError)
      return { success: false, boostedAmount: claimAmount }
    }

    // 3. Actualizar la cantidad de boosts restantes
    const newQuantity = currentQuantity - 1
    const { error: updateError } = await supabase
      .from("boosts")
      .update({ 
        quantity_remaining: newQuantity,
        is_active: newQuantity > 0 // Desactivar si ya no quedan boosts
      })
      .eq("id", boostId)

    if (updateError) {
      console.error("Error updating boost quantity:", updateError)
      return { success: false, boostedAmount: claimAmount }
    }

    return { success: true, boostedAmount: claimAmount * 2 }
  } catch (error) {
    console.error("Error in applyBoost:", error)
    return { success: false, boostedAmount: claimAmount }
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
    const { count, error } = await supabase
      .from("boosts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true)
      .gt("quantity_remaining", 0)

    if (error) {
      console.error("Error checking available boosts:", error)
      return false
    }

    return count !== null && count > 0
  } catch (error) {
    console.error("Error in hasAvailableBoosts:", error)
    return false
  }
}

export { createClient }