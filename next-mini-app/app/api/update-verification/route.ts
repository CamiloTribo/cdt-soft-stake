import { NextResponse } from "next/server"
import { getUserByAddress, supabase } from "@/src/lib/supabase"

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

    // Actualizar el nivel de verificación
    const { error } = await supabase.from("users").update({ verification_level }).eq("id", user.id)

    if (error) {
      console.error("Error updating verification level:", error)
      return NextResponse.json({ error: "Failed to update verification level" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update-verification API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
