import { NextResponse } from "next/server"
import { getUserByAddress } from "@/src/lib/supabase"
import { claimDailyTreasure, generateTreasurePrize } from "@/src/lib/dailyTreasure"

export async function POST(request: Request) {
  try {
    console.log("🚀 [API] Procesando reclamo de tesoro diario...")

    // Obtener datos del cuerpo de la solicitud
    const body = await request.json()
    const { userId, username } = body

    console.log("📝 [API] Datos recibidos:", { userId, username })

    if (!userId) {
      console.error("❌ [API] Falta userId")
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Verificar que el usuario existe
    console.log("👤 [API] Verificando usuario en base de datos...")
    const user = await getUserByAddress(userId)
    if (!user) {
      console.error("❌ [API] Usuario no encontrado:", userId)
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    console.log("✅ [API] Usuario verificado:", user.username || user.address)

    // Generar premio aleatorio
    console.log("🎲 [API] Generando premio aleatorio...")
    const prizeAmount = generateTreasurePrize()
    console.log(`💰 [API] Premio generado: ${prizeAmount} CDT`)

    // Procesar el reclamo
    console.log("🏆 [API] Procesando reclamo...")
    const { success, txHash, error } = await claimDailyTreasure(userId, username || user.username, prizeAmount)

    if (!success) {
      console.error("❌ [API] Error reclamando tesoro:", error)
      return NextResponse.json({ success: false, error }, { status: 400 })
    }

    console.log("🎉 [API] Tesoro reclamado exitosamente")
    return NextResponse.json({
      success: true,
      amount: prizeAmount,
      txHash,
    })
  } catch (error) {
    console.error("💥 [API] Error inesperado reclamando tesoro diario:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
