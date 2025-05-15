import { NextResponse } from "next/server"
import { createClient } from "@/src/lib/supabase"
import { sendRewards } from "@/src/lib/blockchain"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const wallet_address = searchParams.get("wallet_address")

    if (!wallet_address) {
      return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 })
    }

    // Crear cliente de Supabase con los parámetros necesarios
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    )

    // Verificar si el usuario ya ha reclamado su regalo
    const { data: existingClaim } = await supabase
      .from("welcome_gift_claims")
      .select("*")
      .eq("wallet_address", wallet_address)
      .single()

    return NextResponse.json({
      success: true,
      claimed: !!existingClaim,
    })
  } catch (error) {
    console.error("Error checking welcome gift:", error)
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
    const { wallet_address } = body

    if (!wallet_address) {
      return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 })
    }

    // Crear cliente de Supabase con los parámetros necesarios
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    )

    // Verificar si el usuario ya ha reclamado su regalo
    const { data: existingClaim } = await supabase
      .from("welcome_gift_claims")
      .select("*")
      .eq("wallet_address", wallet_address)
      .single()

    if (existingClaim) {
      return NextResponse.json(
        {
          success: false,
          error: "Welcome gift already claimed",
        },
        { status: 400 },
      )
    }

    // Obtener el username del usuario
    const { data: userData } = await supabase
      .from("users")
      .select("username")
      .eq("wallet_address", wallet_address)
      .single()

    // Enviar 1 CDT como regalo de bienvenida
    const result = await sendRewards(wallet_address, 1)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send welcome gift",
          details: result.error,
        },
        { status: 400 },
      )
    }

    // Registrar el claim en la base de datos
    await supabase.from("welcome_gift_claims").insert({
      wallet_address,
      username: userData?.username || null,
    })

    return NextResponse.json({
      success: true,
      message: "Welcome gift claimed successfully!",
      txHash: result.txHash,
    })
  } catch (error) {
    console.error("Error in welcome gift API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
