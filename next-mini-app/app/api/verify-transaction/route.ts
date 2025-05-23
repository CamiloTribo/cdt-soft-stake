import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { txHash } = await request.json()

    if (!txHash) {
      return NextResponse.json({ success: false, error: "Transaction hash is required" }, { status: 400 })
    }

    console.log("Iniciando verificación de transacción:", txHash)

    // Sistema de reintentos con delays
    const maxAttempts = 5 // 5 intentos
    const delayBetweenAttempts = 3000 // 3 segundos entre intentos

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Intento ${attempt}/${maxAttempts} para verificar transacción`)

      try {
        // Usar la API de WorldScan
        const worldscanUrl = `https://worldscan.org/api/v1/tx/${txHash}`
        console.log("Consultando:", worldscanUrl)

        const response = await fetch(worldscanUrl, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        })

        console.log(`Intento ${attempt} - Status:`, response.status)

        if (response.ok) {
          // Intentar parsear la respuesta
          let data
          try {
            const text = await response.text()
            console.log(`Intento ${attempt} - Respuesta:`, text)
            data = JSON.parse(text)
          } catch (parseError) {
            console.error(`Intento ${attempt} - Error parseando JSON:`, parseError)

            // Si no es el último intento, continuar
            if (attempt < maxAttempts) {
              console.log(`Esperando ${delayBetweenAttempts}ms antes del siguiente intento...`)
              await new Promise((resolve) => setTimeout(resolve, delayBetweenAttempts))
              continue
            } else {
              return NextResponse.json({
                success: true,
                isValid: false,
                error: "Invalid JSON response after all attempts",
                attempts: attempt,
              })
            }
          }

          // Verificar si la transacción es válida
          let isValid = false

          if (data) {
            // Verificar múltiples patrones de respuesta
            if (
              data.status === "success" ||
              data.status === "Success" ||
              data.status === "1" ||
              data.result?.status === "1" ||
              data.result?.status === "success" ||
              data.transaction?.status === "success" ||
              data.transaction?.status === "Success" ||
              data.transaction?.status === "1" ||
              data.mined === true ||
              data.status === "mined" ||
              data.state === "mined"
            ) {
              isValid = true
            }
          }

          // Si encontramos la transacción y es válida, retornar inmediatamente
          if (isValid) {
            console.log(`¡Transacción verificada exitosamente en intento ${attempt}!`)
            return NextResponse.json({
              success: true,
              isValid: true,
              data,
              attempts: attempt,
              message: `Transaction verified on attempt ${attempt}`,
            })
          } else if (data) {
            // Si encontramos la transacción pero no es válida, retornar inmediatamente
            console.log(`Transacción encontrada pero no válida en intento ${attempt}`)
            return NextResponse.json({
              success: true,
              isValid: false,
              data,
              attempts: attempt,
              reason: "Transaction found but not successful",
            })
          }
        } else if (response.status === 404) {
          // 404 significa que la transacción no existe aún
          console.log(`Intento ${attempt} - Transacción no encontrada (404)`)

          if (attempt < maxAttempts) {
            console.log(`Esperando ${delayBetweenAttempts}ms antes del siguiente intento...`)
            await new Promise((resolve) => setTimeout(resolve, delayBetweenAttempts))
            continue
          }
        } else {
          // Otros errores HTTP
          console.error(`Intento ${attempt} - Error HTTP:`, response.status, response.statusText)

          if (attempt < maxAttempts) {
            console.log(`Esperando ${delayBetweenAttempts}ms antes del siguiente intento...`)
            await new Promise((resolve) => setTimeout(resolve, delayBetweenAttempts))
            continue
          }
        }
      } catch (fetchError) {
        console.error(`Intento ${attempt} - Error de fetch:`, fetchError)

        if (attempt < maxAttempts) {
          console.log(`Esperando ${delayBetweenAttempts}ms antes del siguiente intento...`)
          await new Promise((resolve) => setTimeout(resolve, delayBetweenAttempts))
          continue
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    console.log("Todos los intentos de verificación fallaron")

    // Como último recurso, intentar verificar si la página existe
    try {
      console.log("Intentando verificación alternativa...")
      const checkUrl = `https://worldscan.org/tx/${txHash}`

      const checkResponse = await fetch(checkUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })

      if (checkResponse.ok) {
        console.log("¡Transacción encontrada mediante verificación alternativa!")
        return NextResponse.json({
          success: true,
          isValid: true,
          method: "alternative_check",
          attempts: maxAttempts,
          message: "Transaction found via alternative method",
        })
      }
    } catch (altError) {
      console.error("Error en verificación alternativa:", altError)
    }

    // Si todo falla, considerar inválida
    return NextResponse.json({
      success: true,
      isValid: false,
      reason: "Transaction not found after all attempts",
      attempts: maxAttempts,
    })
  } catch (error) {
    console.error("Error general en verify-transaction:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
