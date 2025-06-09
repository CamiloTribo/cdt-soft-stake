import { NextResponse } from "next/server"
import { getUserByAddress } from "@/src/lib/supabase"
import { canClaimDailyTreasure } from "@/src/lib/dailyTreasure"

export async function POST(request: Request) {
  try {
    console.log("🔍 [API] Verificando disponibilidad de tesoro diario...")

    const body = await request.json()
    const { userId } = body // Siguiendo tu patrón de CDT claim

    console.log("📝 [API] Datos recibidos:", { userId })

    if (!userId) {
      console.error("❌ [API] Falta userId")
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Verificar que el usuario existe
    console.log("👤 [API] Verificando usuario en base de datos...")
    const user = await getUserByAddress(userId)
    if (!user) {
      console.error("❌ [API] Usuario no encontrado:", userId)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("✅ [API] Usuario verificado:", user.username || user.address)

    // Verificar si puede reclamar el tesoro diario
    console.log("🏆 [API] Verificando disponibilidad de tesoro...")
    const available = await canClaimDailyTreasure(userId)

    console.log(`📊 [API] Resultado: tesoro ${available ? "disponible" : "no disponible"}`)

    return NextResponse.json({
      available,
      user: {
        username: user.username,
        address: user.address, // ✅ Usar 'address' como en tu User type
      },
    })
  } catch (error) {
    console.error("💥 [API] Error inesperado verificando tesoro diario:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
