import { NextResponse } from "next/server"
import { getUserByAddress } from "@/src/lib/supabase"
import { claimDailyTreasure, generateTreasurePrize } from "@/src/lib/dailyTreasure"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase (siguiendo tu patrón exacto del CDT claim)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: Request) {
  try {
    console.log("🚀 [API] Iniciando reclamo de tesoro diario...")

    const body = await request.json()
    const { wallet_address } = body

    console.log("📝 [API] Datos recibidos:", { wallet_address })

    if (!wallet_address) {
      console.error("❌ [API] Falta wallet_address")
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    // Verificar que el usuario existe
    console.log("👤 [API] Verificando usuario en base de datos...")
    const user = await getUserByAddress(wallet_address)
    if (!user) {
      console.error("❌ [API] Usuario no encontrado:", wallet_address)
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    console.log("✅ [API] Usuario verificado:", user.username || user.address)

    // ✅ CAMBIADO: Verificar en daily_treasures en lugar de transactions
    console.log("🔍 [API] Verificando si ya reclamó hoy...")
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const { data: existingClaim, error: claimError } = await supabase
      .from("daily_treasures")
      .select("*")
      .eq("user_id", wallet_address)
      .gte("claimed_at", today.toISOString())
      .single()

    if (claimError && claimError.code !== "PGRST116") {
      console.error("❌ [API] Error verificando reclamo existente:", claimError)
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 })
    }

    if (existingClaim) {
      console.log("❌ [API] Usuario ya reclamó hoy")
      return NextResponse.json(
        {
          success: false,
          error: "Already claimed today",
        },
        { status: 400 },
      )
    }

    // Generar premio aleatorio
    console.log("🎲 [API] Generando premio aleatorio...")
    const prizeAmount = generateTreasurePrize()
    console.log(`🎁 [API] Premio generado: ${prizeAmount} CDT`)

    // Procesar el reclamo
    console.log("💰 [API] Procesando reclamo del tesoro...")
    const result = await claimDailyTreasure(wallet_address, user.username, prizeAmount)

    if (!result.success || !result.txHash) {
      console.error("❌ [API] Error en el reclamo:", result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to claim treasure",
        },
        { status: 400 },
      )
    }

    // ✅ NUEVO: Registrar en daily_treasures Y en transactions
    console.log("📝 [API] Registrando en daily_treasures...")
    const { error: treasureError } = await supabase.from("daily_treasures").insert({
      user_id: wallet_address,
      username: user.username,
      reward_amount: prizeAmount,
      reward_type: "cdt",
      claimed_at: new Date().toISOString(),
    })

    if (treasureError) {
      console.error("❌ [API] Error registrando en daily_treasures:", treasureError)
    }

    // También registrar en transactions para historial
    console.log("📝 [API] Registrando transacción...")
    const { error: updateError } = await supabase.from("transactions").insert({
      user_id: wallet_address,
      type: "daily_treasure",
      amount: prizeAmount,
      token_type: "CDT",
      tx_hash: result.txHash,
      status: "success",
      description: "Premio del tesoro diario",
    })

    if (updateError) {
      console.error("❌ [API] Error registrando transacción:", updateError)
    }

    // Actualizar total_claimed del usuario
    console.log("📊 [API] Actualizando total_claimed del usuario")
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("total_claimed")
        .eq("id", user.id)
        .single()

      if (!userError && userData) {
        const currentTotal = userData.total_claimed || 0
        const newTotal = currentTotal + prizeAmount

        const { error: updateUserError } = await supabase
          .from("users")
          .update({ total_claimed: newTotal })
          .eq("id", user.id)

        if (updateUserError) {
          console.error("⚠️ [API] Error updating total_claimed:", updateUserError)
        } else {
          console.log(`✅ [API] Total claimed updated: ${currentTotal} -> ${newTotal}`)
        }
      }
    } catch (error) {
      console.error("⚠️ [API] Error updating user stats (no crítico):", error)
    }

    console.log("🎉 [API] Tesoro diario reclamado exitosamente!")
    return NextResponse.json({
      success: true,
      message: "¡Tesoro diario reclamado correctamente!",
      cdtAmount: prizeAmount,
      txHash: result.txHash,
    })
  } catch (error: unknown) {
    console.error("💥 [API] Error inesperado:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
