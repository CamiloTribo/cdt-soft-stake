import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/src/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { userId, quantity, tx_hash } = await request.json()

    console.log("Purchase boost request:", { userId, quantity, tx_hash })

    // Validar parámetros
    if (!userId || !quantity || !tx_hash) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Verificar que quantity sea un número válido
    if (typeof quantity !== "number" || quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 })
    }

    // Verificar si el usuario existe
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, boosts_purchased")
      .eq("user_id", userId)
      .single()

    if (userError || !user) {
      console.error("User not found:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Verificar si ya existe una transacción con este hash
    const { data: existingBoost } = await supabase.from("boosts").select("id").eq("tx_hash", tx_hash).single()

    if (existingBoost) {
      console.log("Transaction already processed:", tx_hash)
      return NextResponse.json({ error: "Transaction already processed" }, { status: 400 })
    }

    // Registrar la compra de boost
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
      console.error("Error creating boost:", boostError)
      return NextResponse.json({ error: "Failed to create boost" }, { status: 500 })
    }

    // Actualizar el contador de boosts comprados del usuario
    const newBoostsPurchased = (user.boosts_purchased || 0) + quantity
    const { error: updateError } = await supabase
      .from("users")
      .update({ boosts_purchased: newBoostsPurchased })
      .eq("user_id", userId)

    if (updateError) {
      console.error("Error updating user boosts count:", updateError)
      // No devolvemos error aquí porque el boost ya se creó
    }

    console.log("Boost purchase successful:", boost)

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
