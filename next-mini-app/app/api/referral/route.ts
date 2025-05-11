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

// Implementar la función GET para obtener referidos
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const walletAddress = url.searchParams.get("wallet_address")

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Buscar al usuario por su dirección de wallet
    const user = await getUserByAddress(walletAddress)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Primero, obtener los IDs de los usuarios referidos
    const { data: referralsData, error: referralsError } = await supabase
      .from("referrals")
      .select("id, created_at, referred_id")
      .eq("referrer_id", user.id)

    if (referralsError) {
      console.error("Error fetching referrals:", referralsError)
      return NextResponse.json({ success: false, error: "Error loading referrals" }, { status: 500 })
    }

    // Procesar cada referido por separado para evitar problemas con los tipos
    const processedReferrals = await Promise.all(
      referralsData.map(async (referral) => {
        try {
          // Obtener datos del usuario referido
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("id, username, address, created_at")
            .eq("id", referral.referred_id)
            .single()

          if (userError || !userData) {
            console.error(`Error fetching user data for referral ${referral.id}:`, userError)
            return {
              ...referral,
              referred: {
                id: referral.referred_id,
                username: "Unknown",
                address: "",
                created_at: referral.created_at,
                staked_amount: 0,
              },
            }
          }

          // Obtener información de staking del referido
          const { data: stakingData, error: stakingError } = await supabase
            .from("staking_info")
            .select("staked_amount")
            .eq("user_id", userData.id)
            .maybeSingle()

          if (stakingError) {
            console.error(`Error fetching staking data for user ${userData.id}:`, stakingError)
          }

          // Construir el objeto de respuesta
          return {
            id: referral.id,
            created_at: referral.created_at,
            referred: {
              id: userData.id,
              username: userData.username || "Unknown",
              address: userData.address || "",
              created_at: userData.created_at,
              staked_amount: stakingData?.staked_amount || 0,
            },
          }
        } catch (err) {
          console.error(`Error processing referral ${referral.id}:`, err)
          return {
            ...referral,
            referred: {
              id: referral.referred_id,
              username: "Error",
              address: "",
              created_at: referral.created_at,
              staked_amount: 0,
            },
          }
        }
      }),
    )

    return NextResponse.json({
      success: true,
      referrals: processedReferrals,
    })
  } catch (error) {
    console.error("Error in referrals API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
