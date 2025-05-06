// app/api/username/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase directamente en este archivo
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// GET: Verifica si el usuario tiene username y lo devuelve
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const walletAddress = url.searchParams.get("wallet_address")

    if (!walletAddress) {
      return NextResponse.json({ error: "Se requiere dirección de wallet" }, { status: 400 })
    }

    // Buscar directamente en la tabla users
    const { data, error } = await supabase
      .from("users")
      .select("username")
      .eq("address", walletAddress)
      .maybeSingle()

    // Si hay un error o no hay datos, simplemente devolvemos hasUsername: false
    // Esto permite que los nuevos usuarios continúen sin bloqueo
    if (error || !data || !data.username) {
      return NextResponse.json({ hasUsername: false, username: null })
    }

    return NextResponse.json({ 
      hasUsername: true, 
      username: data.username,
      referralLink: `https://tribovault.com/ref/${data.username}` 
    })
  } catch (error) {
    console.error("Error checking username:", error)
    // En caso de error, también devolvemos hasUsername: false para evitar bloqueos
    return NextResponse.json({ hasUsername: false, username: null })
  }
}

// POST: Registra un nuevo username
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { wallet_address, username } = body

    if (!wallet_address || !username) {
      return NextResponse.json(
        { success: false, error: "Se requiere dirección de wallet y nombre de usuario" },
        { status: 400 }
      )
    }

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from("users")
      .select("username")
      .eq("address", wallet_address)
      .maybeSingle()

    // Si el usuario ya existe y tiene username, no permitimos cambiarlo
    if (existingUser && existingUser.username) {
      return NextResponse.json(
        { success: false, error: "Ya tienes un nombre de usuario registrado" },
        { status: 400 }
      )
    }

    // Intentar insertar el usuario con el username
    const { error: insertError } = await supabase
      .from("users")
      .upsert([{ 
        address: wallet_address, 
        username: username 
      }], { 
        onConflict: 'address',  // Si hay conflicto en address, actualizar
        ignoreDuplicates: false // No ignorar duplicados
      })

    if (insertError) {
      console.error("Error al registrar username:", insertError)
      return NextResponse.json(
        { success: false, error: "Error al registrar nombre de usuario" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Nombre de usuario registrado correctamente",
      referralLink: `https://tribovault.com/ref/${username}`
    })
  } catch (error) {
    console.error("Error in username API:", error)
    return NextResponse.json(
      { success: false, error: "Error al registrar nombre de usuario" },
      { status: 500 }
    )
  }
}