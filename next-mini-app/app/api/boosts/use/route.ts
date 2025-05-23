import { NextResponse } from "next/server"
import { supabase } from "@/src/lib/supabase"
import type { Boost } from "@/src/types/boost"

export async function POST(request: Request) {
  try {
    const { wallet_address, username, claim_amount } = await request.json()

    if (!wallet_address || !username || !claim_amount) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Buscar el boost más antiguo disponible
    const { data: availableBoosts, error: fetchError } = await supabase
      .from("boosts")
      .select("*")
      .eq("user_id", wallet_address)
      .eq("is_active", true)
      .gt("quantity_remaining", 0)
      .order("purchased_at", { ascending: true })
      .limit(1)

    if (fetchError) {
      console.error("Error fetching available boost:", fetchError)
      return NextResponse.json({ success: false, error: "Failed to fetch boost" }, { status: 500 })
    }

    if (!availableBoosts || availableBoosts.length === 0) {
      return NextResponse.json({ success: false, error: "No boosts available" }, { status: 400 })
    }

    const boost = availableBoosts[0] as Boost
    const boostedAmount = claim_amount * 2 // x2 boost

    // Registrar el uso del boost
    const { error: usageError } = await supabase.from("boost_usage").insert({
      boost_id: boost.id,
      user_id: wallet_address,
      username: username,
      claim_amount_base: claim_amount,
      claim_amount_boosted: boostedAmount,
    })

    if (usageError) {
      console.error("Error recording boost usage:", usageError)
      return NextResponse.json({ success: false, error: "Failed to record boost usage" }, { status: 500 })
    }

    // Reducir la cantidad de boosts disponibles
    const { error: updateError } = await supabase
      .from("boosts")
      .update({ quantity_remaining: boost.quantity_remaining - 1 })
      .eq("id", boost.id)

    if (updateError) {
      console.error("Error updating boost quantity:", updateError)
      return NextResponse.json({ success: false, error: "Failed to update boost" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      original_amount: claim_amount,
      boosted_amount: boostedAmount,
      boosts_remaining: boost.quantity_remaining - 1,
    })
  } catch (error) {
    console.error("Error using boost:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
