import { NextResponse } from "next/server"

// Endpoint para registrar logs del cliente en el servidor
export async function POST(request: Request) {
  try {
    const { message, data } = await request.json()

    // Registrar el mensaje en los logs del servidor
    console.log(`📝 CLIENT LOG: ${message}`, data ? JSON.stringify(data) : "")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging client message:", error)
    return NextResponse.json({ success: false, error: "Failed to log message" }, { status: 500 })
  }
}
