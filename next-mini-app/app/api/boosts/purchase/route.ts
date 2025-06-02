// app/api/boosts/purchase/route.ts
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

    if (typeof quantity !== "number" || quantity < 1 || quantity > 7) {
      console.error("❌ PURCHASE: Cantidad inválida:", quantity)
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 })
    }

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

    console.log("🔍 PURCHASE: Contando boosts ACTIVOS...")
    const { count: activeBoosts, error: countError } = await supabase
      .from("boosts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true)
      .gt("quantity_remaining", 0)

    if (countError) {
      console.error("❌ PURCHASE: Error al contar boosts:", countError)
      return NextResponse.json({ error: "Failed to count boosts" }, { status: 500 })
    }

    const boostCount = activeBoosts || 0
    console.log(`📊 PURCHASE: Usuario tiene ${boostCount} boosts ACTIVOS`)

    if (boostCount >= 7) {
      console.error("❌ PURCHASE: Ya tienes el máximo de boosts ACTIVOS (7/7)")
      return NextResponse.json(
        {
          error: "You already have the maximum number of active boosts (7/7)",
        },
        { status: 400 },
      )
    }

    if (boostCount + quantity > 7) {
      const maxCanBuy = 7 - boostCount
      console.error(`❌ PURCHASE: Excede límite de boosts ACTIVOS. Tienes ${boostCount}/7, máximo puedes comprar ${maxCanBuy}`)
      return NextResponse.json(
        {
          error: `Exceeds maximum active boost limit. You have ${boostCount}/7 active boosts, you can buy maximum ${maxCanBuy} more.`,
        },
        { status: 400 },
      )
    }

    // Calcular el precio según el nivel del usuario (MODIFICADA)
    const getBoostPrice = (userLevel: number): number => {
      if (userLevel === 0) return 0.045
      if (userLevel === 1) return 0.123 // <--- NUEVO PRECIO NIVEL 1
      if (userLevel === 2) return 1.23  // <--- NUEVO PRECIO NIVEL 2
      if (userLevel === 3) return 7
      return 0.045 // Precio por defecto
    }

    const pricePerBoost = getBoostPrice(level || 0)
    // Redondear totalPrice a un número razonable de decimales para el almacenamiento (ej. 5)
    // Esto es especialmente importante si pricePerBoost tiene muchos decimales y quantity también.
    const totalPrice = parseFloat((pricePerBoost * quantity).toFixed(5));


    console.log("🛒 PURCHASE: Registrando compra de boost")
    const { data: boost, error: boostError } = await supabase
      .from("boosts")
      .insert({
        user_id: userId,
        username: user.username || "",
        level_at_purchase: level || 0,
        quantity_remaining: quantity,
        is_active: true,
        price_paid: totalPrice, // Se guarda el precio total calculado con los nuevos valores
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
      message: `Successfully purchased ${quantity} boost(s). You now have ${boostCount + quantity}/7 active boosts.`,
    })
  } catch (error) {
    console.error("❌ PURCHASE: Error general:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}