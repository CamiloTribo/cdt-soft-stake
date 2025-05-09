import { NextResponse } from "next/server"
import { getUserByAddress, supabase } from "@/src/lib/supabase"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { wallet_address, referral_code } = body

    if (!wallet_address || !referral_code) {
      return NextResponse.json(
        { success: false, error: "Se requiere dirección de wallet y código de referido" },
        { status: 400 },
      )
    }

    // Buscar al usuario que se está registrando
    const user = await getUserByAddress(wallet_address)

    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }

    // Buscar al referente por su código de referido (username)
    const { data: referrer, error: referrerError } = await supabase
      .from("users")
      .select("id, referral_count")
      .eq("username", referral_code)
      .single()

    if (referrerError || !referrer) {
      return NextResponse.json({ success: false, error: "Código de referido inválido" }, { status: 400 })
    }

    // Verificar que el usuario no se esté refiriendo a sí mismo
    if (user.id === referrer.id) {
      return NextResponse.json({ success: false, error: "No puedes referirte a ti mismo" }, { status: 400 })
    }

    // Verificar si ya existe esta relación de referido
    const { data: existingReferral } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", referrer.id)
      .eq("referred_id", user.id)
      .maybeSingle()

    if (existingReferral) {
      return NextResponse.json({ success: false, error: "Esta relación de referido ya existe" }, { status: 400 })
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
      return NextResponse.json({ success: false, error: "Error al registrar referido" }, { status: 500 })
    }

    // Actualizar el contador de referidos del referente
    // En lugar de usar RPC, incrementamos directamente el valor
    const currentCount = referrer.referral_count || 0
    const newCount = currentCount + 1

    const { error: updateError } = await supabase
      .from("users")
      .update({ referral_count: newCount })
      .eq("id", referrer.id)

    if (updateError) {
      console.error("Error updating referral count:", updateError)
      // No devolvemos error aquí porque el referido ya se registró correctamente
    }

    return NextResponse.json({
      success: true,
      message: "Referido registrado con éxito",
    })
  } catch (error) {
    console.error("Error in referral API:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const walletAddress = url.searchParams.get("wallet_address")

    if (!walletAddress) {
      return NextResponse.json({ success: false, error: "Se requiere dirección de wallet" }, { status: 400 })
    }

    // Buscar al usuario por su dirección de wallet
    const user = await getUserByAddress(walletAddress)

    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 })
    }

    // Obtener los referidos del usuario
    const { data: referrals, error } = await supabase
      .from("referrals")
      .select(`
        id,
        created_at,
        referred:referred_id(
          id,
          username,
          address,
          created_at
        )
      `)
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching referrals:", error)
      return NextResponse.json({ success: false, error: "Error al obtener referidos" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      referrals,
      count: referrals.length,
    })
  } catch (error) {
    console.error("Error in referrals API:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
