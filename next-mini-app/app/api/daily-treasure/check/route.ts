import { NextResponse } from "next/server"
import { getUserByAddress } from "@/src/lib/supabase"
import { canClaimDailyTreasure } from "@/src/lib/dailyTreasure"

export async function GET(request: Request) {
  try {
    console.log("🔍 [API] Verificando disponibilidad de tesoro diario...")

    // Obtener wallet address de los query params (como en tus otras APIs)
    const { searchParams } = new URL(request.url)
    const wallet = searchParams.get("wallet")

    console.log("📝 [API] Datos recibidos:", { wallet })

    if (!wallet) {
      console.error("❌ [API] Falta wallet address")
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Verificar que el usuario existe
    console.log("👤 [API] Verificando usuario en base de datos...")
    const user = await getUserByAddress(wallet)
    if (!user) {
      console.error("❌ [API] Usuario no encontrado:", wallet)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("✅ [API] Usuario verificado:", user.username || user.address)

    // Verificar si puede reclamar el tesoro diario
    console.log("🏆 [API] Verificando disponibilidad de tesoro...")
    const available = await canClaimDailyTreasure(wallet)

    console.log(`📊 [API] Resultado: tesoro ${available ? "disponible" : "no disponible"}`)

    return NextResponse.json({
      available,
      user: {
        username: user.username,
        address: user.address,
      },
    })
  } catch (error) {
    console.error("💥 [API] Error inesperado verificando tesoro diario:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
