import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: Request) {
  try {
    const { amount, from_address, to_address, description } = await request.json()

    // Validar los parámetros
    if (!amount || !from_address || !to_address) {
      return NextResponse.json({ success: false, error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    // Generar un hash de transacción simulado
    const txHash = "0x" + Math.random().toString(16).substring(2, 42)

    // Registrar la transacción en la base de datos
    const { error } = await supabase.from("transactions").insert([
      {
        user_id: from_address,
        type: "send_cdt_to_central",
        amount: amount,
        token_type: "CDT",
        tx_hash: txHash,
        status: "success",
        description: description || "Envío de CDT a wallet central",
      },
    ])

    if (error) {
      console.error("Error al registrar la transacción:", error)
      return NextResponse.json({ success: false, error: "Error al registrar la transacción" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Transacción completada correctamente",
      txHash: txHash,
    })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
