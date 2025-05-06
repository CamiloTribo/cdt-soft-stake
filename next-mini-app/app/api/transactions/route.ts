import { NextResponse } from "next/server"
import { getUserByAddress, supabase } from "@/src/lib/supabase"

// Función para registrar transacciones (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { wallet_address, type, amount, token_type, tx_hash, status, description } = body

    if (!wallet_address || !type || !amount || !token_type) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
        },
        { status: 400 },
      )
    }

    // Buscar al usuario por su dirección de wallet
    const user = await getUserByAddress(wallet_address)

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      )
    }

    console.log("Registrando transacción con status:", status || "success (default)")

    // Registrar la transacción con status "success" por defecto si no se proporciona
    const { error } = await supabase.from("transactions").insert([
      {
        user_id: user.id,
        type,
        amount,
        token_type,
        tx_hash,
        status: status || "success", // Usar "success" por defecto
        description,
        created_at: new Date().toISOString(), // Asegurarnos de que la fecha sea la actual
      },
    ])

    if (error) {
      console.error("Error registering transaction:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to register transaction",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Transaction registered successfully",
    })
  } catch (error) {
    console.error("Error in register transaction API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const walletAddress = url.searchParams.get("wallet_address")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const offset = Number.parseInt(url.searchParams.get("offset") || "0")

    if (!walletAddress) {
      return NextResponse.json({ error: "Se requiere dirección de wallet" }, { status: 400 })
    }

    // Buscar al usuario por su dirección de wallet
    const user = await getUserByAddress(walletAddress)

    if (!user) {
      return NextResponse.json({ transactions: [], pagination: { total: 0 } })
    }

    // Obtener el total de transacciones para la paginación
    const { count, error: countError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    if (countError) {
      console.error("Error al contar transacciones:", countError)
      return NextResponse.json({ error: "Error al obtener transacciones" }, { status: 500 })
    }

    // Obtener las transacciones con paginación
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error al obtener transacciones:", error)
      return NextResponse.json({ error: "Error al obtener transacciones" }, { status: 500 })
    }

    return NextResponse.json({
      transactions: data,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error("Error in transactions API:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
