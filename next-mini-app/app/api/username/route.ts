// app/api/username/route.ts
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase directamente en este archivo
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Función para validar username
function validateUsername(username: string): { valid: boolean; error?: string } {
  // Eliminar espacios al inicio y final
  const trimmedUsername = username.trim()

  // Verificar longitud mínima (3 caracteres)
  if (trimmedUsername.length < 3) {
    return { valid: false, error: "El nombre de usuario debe tener al menos 3 caracteres" }
  }

  // Verificar longitud máxima (20 caracteres)
  if (trimmedUsername.length > 20) {
    return { valid: false, error: "El nombre de usuario no puede exceder los 20 caracteres" }
  }

  // Verificar que no contenga espacios
  if (trimmedUsername.includes(" ")) {
    return { valid: false, error: "El nombre de usuario no puede contener espacios" }
  }

  // Verificar que solo contenga caracteres alfanuméricos y algunos símbolos permitidos
  const validCharsRegex = /^[a-zA-Z0-9_.-]+$/
  if (!validCharsRegex.test(trimmedUsername)) {
    return {
      valid: false,
      error: "El nombre de usuario solo puede contener letras, números, guiones, puntos y guiones bajos",
    }
  }

  return { valid: true }
}

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
      .select("username, total_claimed, referral_count")
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
      referralLink: `https://tribovault.com/ref/${data.username}`,
      total_claimed: data.total_claimed || 0,
      referral_count: data.referral_count || 0,
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
        { status: 400 },
      )
    }

    // Validar el username
    const validation = validateUsername(username)
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from("users")
      .select("username")
      .eq("address", wallet_address)
      .maybeSingle()

    // Si el usuario ya existe y tiene username, no permitimos cambiarlo
    if (existingUser && existingUser.username) {
      return NextResponse.json({ success: false, error: "Ya tienes un nombre de usuario registrado" }, { status: 400 })
    }

    // Verificar si el username ya está en uso (búsqueda case-insensitive)
    const { data: existingUsername, error: usernameError } = await supabase
      .from("users")
      .select("username")
      .ilike("username", username)
      .maybeSingle()

    if (usernameError) {
      console.error("Error checking existing username:", usernameError)
    }

    if (existingUsername) {
      return NextResponse.json({ success: false, error: "Este nombre de usuario ya está en uso" }, { status: 400 })
    }

    // Intentar insertar el usuario con el username
    const { error: insertError } = await supabase.from("users").upsert(
      [
        {
          address: wallet_address,
          username: username,
        },
      ],
      {
        onConflict: "address", // Si hay conflicto en address, actualizar
        ignoreDuplicates: false, // No ignorar duplicados
      },
    )

    if (insertError) {
      console.error("Error al registrar username:", insertError)
      return NextResponse.json({ success: false, error: "Error al registrar nombre de usuario" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Nombre de usuario registrado correctamente",
      referralLink: `https://tribovault.com/ref/${username}`,
    })
  } catch (error) {
    console.error("Error in username API:", error)
    return NextResponse.json({ success: false, error: "Error al registrar nombre de usuario" }, { status: 500 })
  }
}
