import { NextResponse } from "next/server"
import { supabase } from "@/src/lib/supabase"
import type { Boost } from "@/src/types/boost"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet_address = searchParams.get("wallet_address")

    if (!wallet_address) {
      return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 })
    }

    // Obtener boosts disponibles del usuario
    const { data: boosts, error } = await supabase
      .from("boosts")
      .select("*")
      .eq("user_id", wallet_address)
      .eq("is_active", true)
      .gt("quantity_remaining", 0)
      .order("purchased_at", { ascending: true })

    if (error) {
      console.error("Error fetching available boosts:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch boosts" }, { status: 500 })
    }

    // Calcular total de boosts disponibles
    const totalBoosts = boosts?.reduce((total: number, boost: Boost) => total + boost.quantity_remaining, 0) || 0

    // Verificar si hay boost activo para el próximo claim
    const hasActiveBoost = totalBoosts > 0

    return NextResponse.json({
      success: true,
      total_boosts: totalBoosts,
      available_boosts: totalBoosts,
      has_active_boost: hasActiveBoost,
      boosts: boosts || [],
    })
  } catch (error) {
    console.error("Error in available boosts:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
