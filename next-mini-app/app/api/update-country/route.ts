import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Inicializar el cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const { wallet_address, country } = await request.json()

    if (!wallet_address) {
      return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 })
    }

    if (!country) {
      return NextResponse.json({ success: false, error: "Country is required" }, { status: 400 })
    }

    // Buscar el usuario por wallet_address
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("address", wallet_address)
      .single()

    if (userError || !userData) {
      console.error("Error finding user:", userError)
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Actualizar el país del usuario
    const { error: updateError } = await supabase.from("users").update({ country }).eq("id", userData.id)

    if (updateError) {
      console.error("Error updating country:", updateError)
      return NextResponse.json({ success: false, error: "Error updating country" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update-country API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
