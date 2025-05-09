import { NextResponse } from "next/server"
import { getUserByAddress, supabase } from "@/src/lib/supabase"

// Registrar un nuevo referido
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { wallet_address, referral_code } = body

    if (!wallet_address || !referral_code) {
      return NextResponse.json(
        { success: false, error: "Wallet address and referral code are required" },
        { status: 400 },
      )
    }

    // Buscar al usuario que se está registrando
    const user = await getUserByAddress(wallet_address)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Buscar al referente por su código de referido (username)
    const { data: referrer, error: referrerError } = await supabase
      .from("users")
      .select("id")
      .eq("username", referral_code)
      .single()

    if (referrerError || !referrer) {
      return NextResponse.json({ success: false, error: "Invalid referral code" }, { status: 400 })
    }

    // Verificar que el usuario no se esté refiriendo a sí mismo
    if (user.id === referrer.id) {
      return NextResponse.json({ success: false, error: "You cannot refer yourself" }, { status: 400 })
    }

    // Verificar si ya existe esta relación de referido
    // Corregimos la línea para eliminar la variable no utilizada
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", referrer.id)
      .eq("referred_id", user.id)
      .maybeSingle()

    if (existingReferral) {
      return NextResponse.json({ success: false, error: "This referral relationship already exists" }, { status: 400 })
    }

    // Registrar el referido
    const { error: insertError } = await supabase.from("referrals").insert([
      {
        referrer_id: referrer.id,
        referred_id: user.id,
        created_at: new Date().toISOString(),
      },
    ])

    if (insertError) {
      console.error("Error registering referral:", insertError)
      return NextResponse.json({ success: false, error: "Failed to register referral" }, { status: 500 })
    }

    // Actualizar el contador de referidos del referente
    const { error: updateError } = await supabase
      .from("users")
      .update({ referral_count: supabase.rpc("increment", { row_id: referrer.id, column_name: "referral_count" }) })
      .eq("id", referrer.id)

    if (updateError) {
      console.error("Error updating referral count:", updateError)
      // No devolvemos error aquí porque el referido ya se registró correctamente
    }

    return NextResponse.json({
      success: true,
      message: "Referral registered successfully",
    })
  } catch (error) {
    console.error("Error in referral API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
