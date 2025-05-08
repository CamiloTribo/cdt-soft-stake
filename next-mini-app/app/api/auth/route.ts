import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Imprimir todas las variables de entorno relevantes para depuración
  console.log("Variables de entorno en callback:", {
    WLD_CLIENT_ID: process.env.WLD_CLIENT_ID,
    WLD_CLIENT_SECRET: process.env.WLD_CLIENT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  })

  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  console.log("Callback recibido con código:", code)
  console.log("Estado recibido:", state)

  // Aquí deberíamos intercambiar el código por un token
  // Pero por ahora, simplemente redirigimos a la página principal

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!baseUrl) {
    console.error("Error: NEXT_PUBLIC_APP_URL no está configurado")
    return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 })
  }

  return NextResponse.redirect(`${baseUrl}?auth=complete&code=${code}`)
}
