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

    // Buscar al referente por su código de referido (username) - AHORA CASE-INSENSITIVE
    const { data: referrer, error: referrerError } = await supabase
      .from("users")
      .select("id, referral_count")
      .ilike("username", referral_code) // Cambiado de .eq a .ilike para búsqueda case-insensitive
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

// El resto del código GET se mantiene igual...
