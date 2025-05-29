import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/src/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("🛒 PURCHASE: Endpoint llamado")
    const { userId, quantity, level } = await request.json() // ✅ Añadir level

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
      .select("id, address, username") // ✅ Quitar level y boosts_purchased
      .eq("address", userId)
      .single()

    if (userError || !user) {
      console.error("❌ PURCHASE: Usuario no encontrado:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("✅ PURCHASE: Usuario encontrado:", user)

    // Verificar que el usuario no exceda el límite de 7 boosts
    // Obtener el número actual de boosts desde la tabla boosts
    const { count: currentBoosts, error: countError } = await supabase
      .from("boosts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (countError) {
      console.error("❌ PURCHASE: Error al contar boosts:", countError)
      return NextResponse.json({ error: "Failed to count boosts" }, { status: 500 })
    }

    const boostCount = currentBoosts || 0
    if (boostCount + quantity > 7) {
      console.error("❌ PURCHASE: Excede límite de boosts:", boostCount + quantity)
      return NextResponse.json({ error: "Exceeds maximum boost limit" }, { status: 400 })
    }

    // Calcular el precio según el nivel del usuario - ✅ PRECIOS CORREGIDOS
    const getBoostPrice = (userLevel: number): number => {
      if (userLevel === 0) return 0.045  // ✅ CORREGIDO: era 0.0123, ahora 0.045
      if (userLevel === 1) return 0.20   // ✅ CORREGIDO: era 0.123, ahora 0.20
      if (userLevel === 2) return 2      // ✅ CORREGIDO: era 1.23, ahora 2
      if (userLevel === 3) return 7      // ✅ CORREGIDO: era 5, ahora 7
      return 0.045 // ✅ CORREGIDO: Precio por defecto
    }

    const pricePerBoost = getBoostPrice(level || 0) // ✅ Usar el nivel del request
    const totalPrice = pricePerBoost * quantity

    // Registrar la compra de boost (sin tx_hash)
    console.log("🛒 PURCHASE: Registrando compra de boost")
    const { data: boost, error: boostError } = await supabase
      .from("boosts")
      .insert({
        user_id: userId,
        username: user.username || "",
        // wallet_address: userId, // ✅ Eliminar campo redundante
        level_at_purchase: level || 0, // ✅ Usar el nivel del request
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

    // Ya no necesitamos actualizar boosts_purchased en users porque no existe esa columna
    // Podemos eliminar esta parte o mantener un contador en otra tabla si es necesario

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