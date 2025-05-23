import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { txHash } = await request.json()

    if (!txHash) {
      return NextResponse.json({ success: false, error: "Transaction hash is required" }, { status: 400 })
    }

    console.log("Verifying transaction:", txHash)

    // Verificar la transacción en WorldScan con múltiples intentos
    let attempts = 0
    const maxAttempts = 3 // Intentar 3 veces (aproximadamente 5 segundos en total)

    while (attempts < maxAttempts) {
      try {
        console.log(`Attempt ${attempts + 1} to verify transaction`)

        const response = await fetch(`https://worldscan.org/api/v1/tx/${txHash}`, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
          },
        })

        console.log("WorldScan API response status:", response.status)

        if (response.ok) {
          const data = await response.json()
          console.log("WorldScan response data:", JSON.stringify(data, null, 2))

          // Verificaciones más robustas
          let isValid = false

          if (data) {
            // Verificar diferentes posibles estructuras de respuesta
            if (data.status === "success" || data.status === "1" || data.result?.status === "1") {
              isValid = true
            } else if (data.transaction && (data.transaction.status === "success" || data.transaction.status === "1")) {
              isValid = true
            } else if (data.success === true) {
              isValid = true
            }
          }

          // Si encontramos la transacción y es válida, retornar inmediatamente
          if (isValid) {
            return NextResponse.json({
              success: true,
              isValid: true,
              data: data,
              attempts: attempts + 1,
            })
          } else {
            // Si encontramos la transacción pero NO es válida, retornar inmediatamente como inválida
            return NextResponse.json({
              success: true,
              isValid: false,
              data: data,
              attempts: attempts + 1,
              reason: "Transaction found but not successful",
            })
          }
        } else {
          console.error(`WorldScan API error: ${response.status} - ${response.statusText}`)

          // Si es 404, la transacción no existe aún, esperar y reintentar
          if (response.status === 404) {
            attempts++
            if (attempts < maxAttempts) {
              console.log("Transaction not found, waiting 2 seconds before retry...")
              await new Promise((resolve) => setTimeout(resolve, 2000))
              continue
            } else {
              // Si agotamos los intentos y no encontramos la transacción, es inválida
              return NextResponse.json({
                success: true,
                isValid: false,
                reason: "Transaction not found after multiple attempts",
                attempts: maxAttempts,
              })
            }
          } else {
            // Para otros errores, considerar inválida
            return NextResponse.json({
              success: true,
              isValid: false,
              reason: `API error: ${response.status}`,
              attempts: attempts + 1,
            })
          }
        }
      } catch (fetchError) {
        console.error(`Fetch error on attempt ${attempts + 1}:`, fetchError)
        attempts++

        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
        } else {
          // Si agotamos los intentos con errores, considerar inválida
          return NextResponse.json({
            success: true,
            isValid: false,
            reason: "Error connecting to verification service",
            attempts: maxAttempts,
          })
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    return NextResponse.json({
      success: true,
      isValid: false,
      reason: "Could not verify transaction after multiple attempts",
      attempts: maxAttempts,
    })
  } catch (error) {
    console.error("Error in verify-transaction:", error)
    return NextResponse.json(
      {
        success: false,
        isValid: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
