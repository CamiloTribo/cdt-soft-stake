import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  console.log("Callback recibido con código:", code)
  console.log("Estado recibido:", state)

  // Intercambiar el código por un token (en una implementación real)
  // Aquí simplemente redirigimos a la página principal
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tribovault.com"
  return NextResponse.redirect(`${baseUrl}?auth=complete&code=${code}`)
}
