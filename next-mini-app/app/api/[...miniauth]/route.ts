import { type NextRequest, NextResponse } from "next/server"

// Implementación personalizada para reemplazar WorldAuth
export async function GET(request: NextRequest) {
  // Imprimir todas las variables de entorno relevantes para depuración
  console.log("Variables de entorno:", {
    WLD_CLIENT_ID: process.env.WLD_CLIENT_ID,
    NEXT_PUBLIC_WLD_CLIENT_ID: process.env.NEXT_PUBLIC_WLD_CLIENT_ID,
    NEXT_PUBLIC_WORLDCOIN_APP_ID: process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID,
    NEXT_PUBLIC_WLD_REDIRECT_URI: process.env.NEXT_PUBLIC_WLD_REDIRECT_URI,
    NEXT_PUBLIC_CALLBACK_URL: process.env.NEXT_PUBLIC_CALLBACK_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  })

  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")

  // Si tenemos un código de autorización, significa que es una redirección de World ID
  if (code) {
    console.log("Código de autorización recibido:", code)
    console.log("Estado recibido:", state)

    // Redirigir a la página principal con un parámetro de éxito
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!baseUrl) {
      console.error("Error: NEXT_PUBLIC_APP_URL no está configurado")
      return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 })
    }

    return NextResponse.redirect(`${baseUrl}?auth=success&code=${code}`)
  }

  // Si no hay código, redirigir al inicio de sesión de World ID
  // Usar NEXT_PUBLIC_WORLDCOIN_APP_ID como primera opción
  const clientId =
    process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID || process.env.WLD_CLIENT_ID || process.env.NEXT_PUBLIC_WLD_CLIENT_ID

  if (!clientId) {
    console.error("Error: No se encontró un ID de cliente válido")
    return NextResponse.json(
      { error: "Configuración incompleta: No se encontró un ID de cliente válido" },
      { status: 500 },
    )
  }

  // Usar la URL de callback correcta
  const redirectUri = process.env.NEXT_PUBLIC_WLD_REDIRECT_URI || process.env.NEXT_PUBLIC_CALLBACK_URL

  if (!redirectUri) {
    console.error("Error: No se encontró una URL de redirección válida")
    return NextResponse.json(
      { error: "Configuración incompleta: No se encontró una URL de redirección válida" },
      { status: 500 },
    )
  }

  console.log("Redirigiendo a World ID con:", {
    clientId,
    redirectUri,
  })

  // Construir la URL de autorización de World ID con todos los parámetros necesarios
  const worldIdAuthUrl = `https://id.worldcoin.org/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=exampleState`

  console.log("URL de autorización completa:", worldIdAuthUrl)

  return NextResponse.redirect(worldIdAuthUrl)
}

// También manejar solicitudes POST si es necesario
export async function POST() {
  return NextResponse.json({ message: "Método POST no implementado" }, { status: 501 })
}
