import { NextResponse } from "next/server"

// Corregido para eliminar el parámetro no utilizado
export async function GET() {
  // Redirigir a la página principal
  return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL || "https://tribovault.com")
}
