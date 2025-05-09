import { NextResponse } from "next/server"
import { getUserByAddress, updateVerificationLevel } from "@/src/lib/supabase"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { wallet_address, verification_level } = body

    if (!wallet_address || !verification_level) {
      return NextResponse.json({ error: "Wallet address and verification level are required" }, { status: 400 })
    }

    // Validar el nivel de verificación
    if (verification_level !== "human" && verification_level !== "orb" && verification_level !== "wallet") {
      return NextResponse.json({ error: "Invalid verification level" }, { status: 400 })
    }

    // Buscar al usuario por su dirección de wallet
    const user = await getUserByAddress(wallet_address)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Actualizar el nivel de verificación usando la función de supabase
    const success = await updateVerificationLevel(user.id, verification_level)

    if (!success) {
      return NextResponse.json({ error: "Failed to update verification level" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Nivel de verificación actualizado a: ${verification_level}`,
    })
  } catch (error) {
    console.error("Error in update-verification API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
