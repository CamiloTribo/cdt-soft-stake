import { NextResponse } from "next/server"

export async function POST() {
  console.log("🎁 CDT CLAIM: ¡¡¡¡¡ESTOY AQUÍ!!!!!") // ✅ LOG BÁSICO

  return NextResponse.json({
    success: false,
    message: "¡EN MANTENIMIENTO!",
  })
}