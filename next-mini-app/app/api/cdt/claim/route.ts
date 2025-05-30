import { NextResponse } from "next/server"

export async function POST() {
  console.log("🎁 CDT CLAIM: Endpoint llamado") // ✅ LOG BÁSICO

  return NextResponse.json({
    success: false,
    message: "¡EN MANTENIMIENTO!",
  })
}