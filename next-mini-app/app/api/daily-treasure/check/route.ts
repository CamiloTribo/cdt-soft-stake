import { NextResponse } from "next/server"
import { getUserByAddress } from "@/src/lib/supabase"
import { canClaimDailyTreasure } from "@/src/lib/dailyTreasure"

export async function GET(request: Request) {
  try {
    console.log("🔍 [API] Verificando disponibilidad de tesoro diario...")

    // IGUAL que tu API de boosts
    const { searchParams } = new URL(request.url)
    const wallet_address = searchParams.get("wallet_address")

    console.log("📝 [API] Datos recibidos:", { wallet_address })

    if (!wallet_address) {
      console.error("❌ [API] Falta wallet address")
      return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 })
    }

    // Verificar que el usuario existe (busca por campo "address")
    console.log("👤 [API] Verificando usuario en base de datos...")
    const user = await getUserByAddress(wallet_address)
    if (!user) {
      console.error("❌ [API] Usuario no encontrado:", wallet_address)
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    console.log("✅ [API] Usuario verificado:", user.username || user.address)

    // Verificar si puede reclamar el tesoro diario (user_id = wallet_address)
    console.log("🏆 [API] Verificando disponibilidad de tesoro...")
    const available = await canClaimDailyTreasure(wallet_address)

    console.log(`📊 [API] Resultado: tesoro ${available ? "disponible" : "no disponible"}`)

    return NextResponse.json({
      success: true,
      available,
      user: {
        username: user.username,
        address: user.address,
      },
    })
  } catch (error) {
    console.error("💥 [API] Error inesperado verificando tesoro diario:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
