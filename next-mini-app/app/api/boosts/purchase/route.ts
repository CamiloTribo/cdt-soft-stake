import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/src/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("🛒 PURCHASE: Endpoint llamado")
    const { userId, quantity, level } = await request.json()

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
      .select("id, address, username")
      .eq("address", userId)
      .single()

    if (userError || !user) {
      console.error("❌ PURCHASE: Usuario no encontrado:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("✅ PURCHASE: Usuario encontrado:", user)

    // Verificar que el usuario no exceda el límite de 7 boosts
    const { count: currentBoosts, error: countError } = await supabase
      .from("boosts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (countError) {
      console.error("❌ PURCHASE: Error al contar boosts:", countError)
      return NextResponse.json({ error: "Failed to count boosts" }, { status: 500 })
    }

    const boostCount = currentBoosts || 0

    // ✅ VERIFICACIÓN: Si ya tienes 7, no puedes comprar más
    if (boostCount >= 7) {
      console.error("❌ PURCHASE: Ya tienes el máximo de boosts (7/7)")
      return NextResponse.json(
        {
          error: "You already have the maximum number of boosts (7/7)",
        },
        { status: 400 },
      )
    }

    // ✅ LÓGICA CORREGIDA: Verificar que después de la compra no exceda 7 total
    if (boostCount + quantity > 7) {
      const maxCanBuy = 7 - boostCount
      console.error(`❌ PURCHASE: Excede límite de boosts. Tienes ${boostCount}/7, máximo puedes comprar ${maxCanBuy}`)
      return NextResponse.json(
        {
          error: `Exceeds maximum boost limit. You have ${boostCount}/7 boosts, you can buy maximum ${maxCanBuy} more.`,
        },
        { status: 400 },
      )
    }

    // Calcular el precio según el nivel del usuario
    const getBoostPrice = (userLevel: number): number => {
      if (userLevel === 0) return 0.045
      if (userLevel === 1) return 0.2
      if (userLevel === 2) return 2
      if (userLevel === 3) return 7
      return 0.045
    }

    const pricePerBoost = getBoostPrice(level || 0)
    const totalPrice = pricePerBoost * quantity

    // Registrar la compra de boost
    console.log("🛒 PURCHASE: Registrando compra de boost")
    const { data: boost, error: boostError } = await supabase
      .from("boosts")
      .insert({
        user_id: userId,
        username: user.username || "",
        level_at_purchase: level || 0,
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

    console.log("✅ PURCHASE: Compra completada exitosamente")
    return NextResponse.json({
      success: true,
      boost: boost,
      message: `Successfully purchased ${quantity} boost(s). You now have ${boostCount + quantity}/7 boosts.`,
    })
  } catch (error) {
    console.error("❌ PURCHASE: Error general:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}