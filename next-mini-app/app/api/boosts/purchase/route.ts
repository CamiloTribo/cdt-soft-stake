import { NextResponse } from "next/server"
import { supabase } from "@/src/lib/supabase"
import type { Boost } from "@/src/types/boost"

export async function POST(request: Request) {
  try {
    const { wallet_address, username, level, quantity, price_paid, transaction_hash } = await request.json()

    // Validar datos requeridos
    if (!wallet_address || !username || level === undefined || !quantity || !price_paid || !transaction_hash) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Verificar que el usuario no exceda el límite de 7 boosts
    const { data: existingBoosts, error: checkError } = await supabase
      .from("boosts")
      .select("quantity_remaining")
      .eq("user_id", wallet_address)
      .eq("is_active", true)

    if (checkError) {
      console.error("Error checking existing boosts:", checkError)
      return NextResponse.json({ success: false, error: "Failed to check existing boosts" }, { status: 500 })
    }

    // Calcular boosts actuales
    const currentBoosts =
      existingBoosts?.reduce(
        (total: number, boost: Pick<Boost, "quantity_remaining">) => total + boost.quantity_remaining,
        0,
      ) || 0

    if (currentBoosts + quantity > 7) {
      return NextResponse.json({ success: false, error: "Cannot exceed 7 boosts limit" }, { status: 400 })
    }

    // Insertar el nuevo boost
    const { data, error } = await supabase
      .from("boosts")
      .insert({
        user_id: wallet_address,
        username: username,
        level_at_purchase: level,
        quantity_remaining: quantity,
        is_active: true,
        price_paid: price_paid,
        transaction_hash: transaction_hash,
      })
      .select()

    if (error) {
      console.error("Error inserting boost:", error)
      return NextResponse.json({ success: false, error: "Failed to create boost" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      total_boosts: currentBoosts + quantity,
    })
  } catch (error) {
    console.error("Error in boost purchase:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
