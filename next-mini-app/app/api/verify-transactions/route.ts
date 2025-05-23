import { NextResponse } from "next/server"

// Función para verificar transacción en WorldScan
async function verifyTransactionOnWorldScan(txHash: string): Promise<boolean> {
  try {
    // Esperar un poco para que la transacción se propague
    await new Promise((resolve) => setTimeout(resolve, 5000))

    // Hacer la petición desde el servidor (sin problemas CORS)
    const response = await fetch(`https://worldscan.org/api/v1/tx/${txHash}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      console.error("WorldScan API error:", response.status)
      return false
    }

    const data = await response.json()
    console.log("WorldScan API response:", data)

    // Verificar que la transacción existe y fue exitosa
    return data && data.status === "success" && data.hash === txHash
  } catch (error) {
    console.error("Error verifying transaction:", error)
    return false
  }
}

export async function POST(request: Request) {
  try {
    const { txHash } = await request.json()

    if (!txHash) {
      return NextResponse.json({ success: false, error: "Transaction hash is required" }, { status: 400 })
    }

    // Verificar la transacción en WorldScan
    const isValid = await verifyTransactionOnWorldScan(txHash)

    return NextResponse.json({
      success: true,
      isValid,
    })
  } catch (error) {
    console.error("Error in verify-transaction:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
