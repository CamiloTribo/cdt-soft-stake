import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/src/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("🛒 PURCHASE: Endpoint llamado")
    const { userId, quantity } = await request.json()

    // Validar parámetros
    if (!userId || !quantity) {
      console.error("❌ PURCHASE: Parámetros faltantes:", { userId, quantity })
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Verificar que quantity sea un número válido
    if (typeof quantity !== "number" || quantity < 1 || quantity > 7) {
      console.error("❌ PURCHASE: Cantidad inválida:", quantity)
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 })
    }

    // Verificar si el usuario existe y obtener su información
    console.log("🔍 PURCHASE: Buscando usuario con address:", userId)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, address, username, level, boosts_purchased")
      .eq("address", userId)  // Cambiado de user_id a address
      .single()

    if (userError || !user) {
      console.error("❌ PURCHASE: Usuario no encontrado:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("✅ PURCHASE: Usuario encontrado:", user)

    // Verificar que el usuario no exceda el límite de 7 boosts
    const currentBoosts = user.boosts_purchased || 0
    if (currentBoosts + quantity > 7) {
      console.error("❌ PURCHASE: Excede límite de boosts:", currentBoosts + quantity)
      return NextResponse.json({ error: "Exceeds maximum boost limit" }, { status: 400 })
    }

    // Calcular el precio según el nivel del usuario
    const getBoostPrice = (level: number): number => {
      if (level === 0) return 0.0123
      if (level === 1) return 0.123
      if (level === 2) return 1.23
      if (level === 3) return 5
      return 0.0123 // Precio por defecto
    }

    const pricePerBoost = getBoostPrice(user.level || 0)
    const totalPrice = pricePerBoost * quantity

    // Registrar la compra de boost (sin tx_hash)
    console.log("🛒 PURCHASE: Registrando compra de boost")
    const { data: boost, error: boostError } = await supabase
      .from("boosts")
      .insert({
        user_id: userId,
        username: user.username || "",
        wallet_address: userId, // userId es la wallet address
        level_at_purchase: user.level || 0,
        quantity_remaining: quantity,
        is_active: true,
        price_paid: totalPrice,
        purchased_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (boostError) {
      console.error("❌ PURCHASE: Error al crear boost:", boostError)
      return NextResponse.json({ error: "Failed to create boost" }, { status: 500 })
    }

    console.log("✅ PURCHASE: Boost creado exitosamente:", boost)

    // Actualizar el contador de boosts comprados del usuario
    const newBoostsPurchased = currentBoosts + quantity
    const { error: updateError } = await supabase
      .from("users")
      .update({ boosts_purchased: newBoostsPurchased })
      .eq("address", userId)  // Cambiado de user_id a address

    if (updateError) {
      console.error("⚠️ PURCHASE: Error al actualizar contador de boosts:", updateError)
      // No devolvemos error aquí porque el boost ya se creó
    }

    console.log("✅ PURCHASE: Compra completada exitosamente")
    return NextResponse.json({
      success: true,
      boost: boost,
      message: `Successfully purchased ${quantity} boost(s)`,
    })
  } catch (error) {
    console.error("❌ PURCHASE: Error general:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}