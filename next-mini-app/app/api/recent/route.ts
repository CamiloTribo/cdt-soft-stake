// app/api/boosts/recent/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Usar las variables de entorno directamente como en el resto de tu proyecto
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const wallet = url.searchParams.get("wallet")
    const minutes = parseInt(url.searchParams.get("minutes") || "5")

    if (!wallet) {
      return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 })
    }

    // Crear cliente Supabase con los argumentos requeridos
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Calcular el tiempo hace X minutos
    const timeAgo = new Date()
    timeAgo.setMinutes(timeAgo.getMinutes() - minutes)

    // Buscar boosts recientes para esta wallet
    const { data, error } = await supabase
      .from("boosts")
      .select("*")
      .eq("wallet_address", wallet)
      .gte("created_at", timeAgo.toISOString())
      .limit(1)

    if (error) {
      console.error("Error checking recent boosts:", error)
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      hasRecentBoost: data.length > 0,
      recentBoost: data[0] || null,
    })
  } catch (error) {
    console.error("Error in recent boosts endpoint:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}