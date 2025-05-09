import { NextResponse } from "next/server"
import { getUserByAddress } from "@/src/lib/supabase"
import { claimRewards } from "@/src/lib/staking"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: Request) {
  try {
    // Obtener la dirección de wallet del body
    const body = await request.json()
    const { wallet_address } = body

    if (!wallet_address) {
      return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 })
    }

    // Buscar al usuario por su dirección de wallet
    const user = await getUserByAddress(wallet_address)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Reclamar recompensas
    const claimResult = await claimRewards(user.id, wallet_address)

    // Verificación mejorada del resultado
    if (!claimResult || !claimResult.success || !claimResult.txHash) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to claim rewards",
          details: claimResult ? `Amount: ${claimResult.amount}, TxHash: ${claimResult.txHash}` : "No result",
        },
        { status: 400 },
      )
    }

    // Registrar la transacción
    const { error: txError } = await supabase.from("transactions").insert([
      {
        user_id: user.id,
        type: "claim",
        amount: claimResult.amount,
        token_type: "CDT",
        tx_hash: claimResult.txHash,
        status: "success",
        description: "Reclamación de recompensas diarias",
      },
    ])

    if (txError) {
      console.error("Error registering transaction:", txError)
      // Continuamos aunque falle el registro de la transacción
    }

    // Actualizar el total_claimed del usuario
    const { error: updateError } = await supabase
      .from("users")
      .update({
        total_claimed: supabase.rpc("increment_total_claimed", {
          user_id: user.id,
          amount: claimResult.amount,
        }),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating total_claimed:", updateError)
      // Continuamos aunque falle la actualización
    }

    return NextResponse.json({
      success: true,
      message: "¡Recompensas reclamadas correctamente!",
    })
  } catch (error) {
    console.error("Error in claim API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
