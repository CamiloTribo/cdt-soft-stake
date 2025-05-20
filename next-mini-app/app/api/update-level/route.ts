import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Inicializar el cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// Función para determinar el nivel basado en la cantidad
function getLevelId(stakedAmount: number): string {
  if (stakedAmount >= 10000000) return "legendarytribers"
  if (stakedAmount >= 1000000) return "millotribers"
  if (stakedAmount >= 100000) return "cryptotribers"
  return "tribers"
}

export async function POST(request: Request) {
  try {
    const { address, staked_amount } = await request.json()

    if (!address) {
      return NextResponse.json({ success: false, error: "Address is required" }, { status: 400 })
    }

    const levelId = getLevelId(staked_amount)

    // Verificar si ya existe un registro para este usuario
    const { data: existingLevel, error: fetchError } = await supabase
      .from("user_levels")
      .select("*")
      .eq("address", address)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 significa que no se encontró ningún registro, lo cual es esperado
      console.error("Error fetching user level:", fetchError)
      return NextResponse.json({ success: false, error: "Error fetching user level" }, { status: 500 })
    }

    // Si existe, actualizar; si no, insertar
    const operation = existingLevel
      ? supabase
          .from("user_levels")
          .update({
            level_id: levelId,
            staked_amount,
            updated_at: new Date().toISOString(),
          })
          .eq("address", address)
      : supabase.from("user_levels").insert([
          {
            address,
            level_id: levelId,
            staked_amount,
          },
        ])

    const { error: operationError } = await operation

    if (operationError) {
      console.error("Error updating user level:", operationError)
      return NextResponse.json({ success: false, error: "Error updating user level" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      level_id: levelId,
      staked_amount,
    })
  } catch (error) {
    console.error("Error in update-level API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
