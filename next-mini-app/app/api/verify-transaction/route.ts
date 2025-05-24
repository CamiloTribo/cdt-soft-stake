import { NextResponse } from "next/server"
import axios from "axios"

// Configuración de Alchemy - La misma que usa el sistema de CDT
const ALCHEMY_API_KEY = "w-hTDCI5WQMGz4u1G0FU0XOMGJlmPSDp"
const ALCHEMY_API_URL = `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`

// Interfaces para tipar las respuestas
interface TransactionReceipt {
  status: string
  transactionHash: string
  blockNumber: string
  gasUsed: string
}

export async function POST(request: Request) {
  try {
    const { txHash } = await request.json()

    if (!txHash) {
      console.error("Error: No se proporcionó hash de transacción")
      return NextResponse.json({ success: false, error: "Transaction hash is required" }, { status: 400 })
    }

    console.log("Verificando transacción:", txHash)

    // MÉTODO PRINCIPAL: Verificar con Alchemy (como el sistema de CDT)
    try {
      console.log("Verificando con Alchemy...")
      const response = await axios.post(ALCHEMY_API_URL, {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionReceipt",
        params: [txHash],
      })

      // Si tenemos respuesta de Alchemy
      if (response.data && response.data.result) {
        const receipt: TransactionReceipt = response.data.result
        const isSuccessful = receipt.status === "0x1" // 0x1 = success, 0x0 = failed

        console.log(`Alchemy - Transacción ${isSuccessful ? "exitosa" : "fallida"}:`, receipt)

        return NextResponse.json({
          success: true,
          isValid: isSuccessful,
          data: receipt,
          method: "alchemy",
        })
      } else {
        console.log("Alchemy - No se encontró recibo de transacción. La transacción podría estar pendiente.")

        // Si no hay recibo, la transacción podría estar pendiente
        return NextResponse.json({
          success: true,
          isValid: false,
          isPending: true,
          error: "Transaction receipt not found. The transaction might be pending.",
          method: "alchemy",
        })
      }
    } catch (alchemyError) {
      console.error("Error con Alchemy:", alchemyError)

      // Si hay un error con Alchemy, intentamos con WorldScan como respaldo
      try {
        console.log("Verificando con WorldScan como respaldo...")
        const worldscanUrl = `https://worldscan.org/api/v1/tx/${txHash}`

        const response = await fetch(worldscanUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log("WorldScan - Respuesta:", data)

          const isValid = data && (data.status === "success" || data.status === "Success")

          return NextResponse.json({
            success: true,
            isValid,
            data,
            method: "worldscan",
          })
        }
      } catch (worldscanError) {
        console.error("Error con WorldScan:", worldscanError)
      }
    }

    // Si llegamos aquí, no pudimos verificar la transacción
    return NextResponse.json({
      success: false,
      isValid: false,
      error: "Could not verify transaction with any method",
    })
  } catch (error) {
    console.error("Error general:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
