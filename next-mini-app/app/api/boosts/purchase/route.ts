import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/src/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, quantity, tx_hash } = await request.json()

    // Validar parámetros
    if (!userId || !quantity || !tx_hash) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Verificar que quantity sea un número válido
    if (typeof quantity !== "number" || quantity < 1 || quantity > 7) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 })
    }

    // Verificar si el usuario existe y obtener su información
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, user_id, username, level, boosts_purchased")
      .eq("user_id", userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verificar si ya existe una transacción con este hash
    const { data: existingBoost } = await supabase
      .from("boosts")
      .select("id")
      .eq("tx_hash", tx_hash)
      .single()

    if (existingBoost) {
      return NextResponse.json({ error: "Transaction already processed" }, { status: 400 })
    }

    // Verificar que el usuario no exceda el límite de 7 boosts
    const currentBoosts = user.boosts_purchased || 0
    if (currentBoosts + quantity > 7) {
      return NextResponse.json({ error: "Exceeds maximum boost limit" }, { status: 400 })
    }

    // Calcular el precio según el nivel del usuario
    const getBoostPrice = (level: number): number => {
      if (level === 0) return 0.023
      if (level === 1) return 0.23
      if (level === 2) return 1.23
      if (level === 3) return 5
      return 0.023 // Precio por defecto
    }

    const pricePerBoost = getBoostPrice(user.level || 0)
    const totalPrice = pricePerBoost * quantity

    // Registrar la compra de boost
    const { data: boost, error: boostError } = await supabase
      .from("boosts")
      .insert({
        user_id: userId,
        username: user.username || "",
        wallet_address: userId, // userId es la wallet address
        level_at_purchase: user.level || 0,
        quantity_remaining: quantity,
        is_active: true,
        tx_hash: tx_hash,
        price_paid: totalPrice,
        purchased_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (boostError) {
      console.error("Error creating boost:", boostError)
      return NextResponse.json({ error: "Failed to create boost" }, { status: 500 })
    }

    // Actualizar el contador de boosts comprados del usuario
    const newBoostsPurchased = currentBoosts + quantity
    await supabase
      .from("users")
      .update({ boosts_purchased: newBoostsPurchased })
      .eq("user_id", userId)

    return NextResponse.json({
      success: true,
      boost: boost,
      message: `Successfully purchased ${quantity} boost(s)`,
    })
  } catch (error) {
    console.error("Error in boost purchase:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}