import { NextResponse } from "next/server"
import axios from "axios"

// Configuración de Alchemy - La misma que usa el sistema de CDT
const ALCHEMY_API_KEY = "w-hTDCI5WQMGz4u1G0FU0XOMGJlmPSDp"
const ALCHEMY_API_URL = `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`

export async function POST(request: Request) {
  try {
    const { txHash } = await request.json()

    if (!txHash) {
      console.error("❌ VERIFICACIÓN: No se proporcionó hash de transacción")
      return NextResponse.json({ success: false, error: "Transaction hash is required" }, { status: 400 })
    }

    console.log("🔍 VERIFICACIÓN: Iniciando verificación de transacción:", txHash)

    // MÉTODO PRINCIPAL: Verificar con Alchemy usando eth_getTransaction
    try {
      console.log("🔍 VERIFICACIÓN: Usando Alchemy con eth_getTransaction...")
      const response = await axios.post(ALCHEMY_API_URL, {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransaction", // Cambiado de eth_getTransactionReceipt
        params: [txHash],
      })

      // Log completo de la respuesta para depuración
      console.log("🔍 VERIFICACIÓN: Respuesta completa de Alchemy:", JSON.stringify(response.data))

      // Si tenemos respuesta de Alchemy
      if (response.data && response.data.result) {
        // Si la transacción existe, es válida
        console.log("✅ VERIFICACIÓN: Transacción encontrada en Alchemy:", response.data.result)

        return NextResponse.json({
          success: true,
          isValid: true,
          data: response.data.result,
          method: "alchemy",
        })
      } else {
        console.log("❌ VERIFICACIÓN: No se encontró la transacción en Alchemy.")

        // Si no hay transacción, no es válida
        return NextResponse.json({
          success: true,
          isValid: false,
          error: "Transaction not found.",
          method: "alchemy",
        })
      }
    } catch (alchemyError) {
      console.error("❌ VERIFICACIÓN: Error con Alchemy:", alchemyError)

      // Si hay un error con Alchemy, intentamos con WorldScan como respaldo
      try {
        console.log("🔍 VERIFICACIÓN: Usando WorldScan como respaldo...")
        const worldscanUrl = `https://worldscan.org/api/v1/tx/${txHash}`

        const response = await fetch(worldscanUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          console.log("🔍 VERIFICACIÓN: Respuesta completa de WorldScan:", JSON.stringify(data))

          const isValid = data && (data.status === "success" || data.status === "Success")

          if (isValid) {
            console.log("✅ VERIFICACIÓN: Transacción verificada con WorldScan")
          } else {
            console.log("❌ VERIFICACIÓN: Transacción inválida según WorldScan")
          }

          return NextResponse.json({
            success: true,
            isValid,
            data,
            method: "worldscan",
          })
        } else {
          console.log("❌ VERIFICACIÓN: WorldScan respondió con error:", response.status)
        }
      } catch (worldscanError) {
        console.error("❌ VERIFICACIÓN: Error con WorldScan:", worldscanError)
      }
    }

    // Si llegamos aquí, no pudimos verificar la transacción
    console.log("❌ VERIFICACIÓN: No se pudo verificar la transacción con ningún método")
    return NextResponse.json({
      success: false,
      isValid: false,
      error: "Could not verify transaction with any method",
    })
  } catch (error) {
    console.error("❌ VERIFICACIÓN: Error general:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
