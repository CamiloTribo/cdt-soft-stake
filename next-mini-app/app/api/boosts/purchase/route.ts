import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/src/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log("🛒 PURCHASE: Iniciando registro de compra de boost")
    const { userId, quantity, tx_hash } = await request.json()

    console.log("🛒 PURCHASE: Request recibido:", { userId, quantity, tx_hash })

    // Validar parámetros
    if (!userId || !quantity || !tx_hash) {
      console.error("❌ PURCHASE: Parámetros faltantes:", { userId, quantity, tx_hash })
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Verificar que quantity sea un número válido
    if (typeof quantity !== "number" || quantity < 1) {
      console.error("❌ PURCHASE: Cantidad inválida:", quantity)
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 })
    }

    // Verificar si el usuario existe
    console.log("🛒 PURCHASE: Verificando si existe el usuario:", userId)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, boosts_purchased")
      .eq("user_id", userId)
      .single()

    if (userError || !user) {
      console.error("❌ PURCHASE: Usuario no encontrado:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("✅ PURCHASE: Usuario encontrado:", user)

    // Verificar si ya existe una transacción con este hash
    console.log("🛒 PURCHASE: Verificando si el tx_hash ya fue procesado:", tx_hash)
    const { data: existingBoost } = await supabase.from("boosts").select("id").eq("tx_hash", tx_hash).single()

    if (existingBoost) {
      console.log("⚠️ PURCHASE: Transacción ya procesada:", tx_hash)
      return NextResponse.json({ error: "Transaction already processed" }, { status: 400 })
    }

    // Registrar la compra de boost
    console.log("🛒 PURCHASE: Insertando boost en la base de datos")
    const { data: boost, error: boostError } = await supabase
      .from("boosts")
      .insert({
        user_id: userId,
        quantity_remaining: quantity,
        tx_hash: tx_hash,
        price_paid: 0.23 * quantity, // Precio por boost
        status: "success",
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
    const newBoostsPurchased = (user.boosts_purchased || 0) + quantity
    console.log("🛒 PURCHASE: Actualizando contador de boosts del usuario:", {
      anterior: user.boosts_purchased || 0,
      nuevo: newBoostsPurchased,
    })

    const { error: updateError } = await supabase
      .from("users")
      .update({ boosts_purchased: newBoostsPurchased })
      .eq("user_id", userId)

    if (updateError) {
      console.error("⚠️ PURCHASE: Error al actualizar contador de boosts (no crítico):", updateError)
      // No devolvemos error aquí porque el boost ya se creó
    }

    console.log("✅ PURCHASE: Compra de boost completada exitosamente:", boost)

    return NextResponse.json({
      success: true,
      boost: boost,
      message: `Successfully purchased ${quantity} boost(s)`,
    })
  } catch (error) {
    console.error("❌ PURCHASE: Error general en la compra:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
