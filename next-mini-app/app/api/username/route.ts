import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet_address = searchParams.get("wallet_address")

    if (!wallet_address) {
      return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 })
    }

    // Obtener datos del usuario
    const { data: userData, error } = await supabase
      .from("users")
      .select("id, username, total_claimed, referral_count, country") // Asegurarse de que country está incluido
      .eq("address", wallet_address)
      .single()

    if (error) {
      console.error("Error fetching user data:", error)
      return NextResponse.json({ success: false, error: "Error fetching user data" }, { status: 500 })
    }

    // Si no hay datos, devolver un error
    if (!userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Devolver los datos del usuario
    return NextResponse.json({
      success: true,
      username: userData.username,
      total_claimed: userData.total_claimed || 0,
      referral_count: userData.referral_count || 0,
      country: userData.country || null, // Asegurarse de devolver el país
    })
  } catch (error) {
    console.error("Error in username API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { wallet_address, username } = body

    if (!wallet_address || !username) {
      return NextResponse.json({ success: false, error: "Wallet address and username are required" }, { status: 400 })
    }

    // Verificar si el username ya está en uso
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .neq("address", wallet_address)
      .maybeSingle()

    if (checkError) {
      console.error("Error checking existing username:", checkError)
      return NextResponse.json({ success: false, error: "Error checking username" }, { status: 500 })
    }

    if (existingUser) {
      return NextResponse.json({ success: false, error: "Username already taken" }, { status: 400 })
    }

    // Actualizar el username del usuario
    const { error: updateError } = await supabase.from("users").update({ username }).eq("address", wallet_address)

    if (updateError) {
      console.error("Error updating username:", updateError)
      return NextResponse.json({ success: false, error: "Error updating username" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Username updated successfully",
    })
  } catch (error) {
    console.error("Error in username API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
