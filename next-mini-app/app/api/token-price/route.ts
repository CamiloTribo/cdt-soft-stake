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
      // Importante: No usar caché para obtener siempre datos frescos
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status}`)
    }

    const data = await response.json()

    // Extraer la información relevante
    const tokenPrice = data.data.attributes.base_token_price_usd

    // Intentar obtener el cambio de precio en 24h si está disponible
    let priceChange = 2.34 // Valor por defecto positivo
    let isPositive = true

    // Si la API proporciona datos de cambio de precio, usarlos
    if (data.data.attributes.price_change_percentage) {
      priceChange = Math.abs(Number.parseFloat(data.data.attributes.price_change_percentage))
      isPositive = Number.parseFloat(data.data.attributes.price_change_percentage) >= 0
    }

    return NextResponse.json({
      success: true,
      price: Number.parseFloat(tokenPrice),
      priceChange: priceChange,
      isPositive: isPositive,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching token price:", error)

    // En caso de error, devolver un error claro
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
        // Incluir valores por defecto para que la UI no se rompa
        price: 0.00000123,
        priceChange: 2.34,
        isPositive: true,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
