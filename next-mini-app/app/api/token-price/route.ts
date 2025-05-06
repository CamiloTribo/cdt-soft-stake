import { NextResponse } from "next/server"

// Implementación usando la API de GeckoTerminal
export async function GET() {
  try {
    // URL de la API de GeckoTerminal para el pool de CDT en World Chain
    const apiUrl =
      "https://api.geckoterminal.com/api/v2/networks/world-chain/pools/0x49c956d5ae4b375d8dc412e98b633aaa343f6f84"

    // Realizar la petición a la API
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
      // Importante: Usar caché para no exceder el límite de 30 llamadas por minuto
      next: { revalidate: 60 }, // Revalidar cada 60 segundos
    })

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status}`)
    }

    const data = await response.json()

    // Extraer la información relevante
    const tokenPrice = data.data.attributes.base_token_price_usd

    return NextResponse.json({
      success: true,
      price: Number.parseFloat(tokenPrice),
    })
  } catch (error) {
    console.error("Error fetching token price:", error)

    // En caso de error, devolver un error claro
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error interno del servidor",
    }, { status: 500 })
  }
}
