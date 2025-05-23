import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { txHash } = await request.json()

    if (!txHash) {
      return NextResponse.json({ success: false, error: "Transaction hash is required" }, { status: 400 })
    }

    // Verificar la transacción en WorldScan
    try {
      const response = await fetch(`https://worldscan.org/api/v1/tx/${txHash}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })

      if (!response.ok) {
        console.error("WorldScan API error:", response.status)
        return NextResponse.json({ success: true, isValid: false })
      }

      const data = await response.json()
      console.log("WorldScan response:", data)

      // Verificar que la transacción existe y fue exitosa
      const isValid = data && data.status === "success"

      return NextResponse.json({
        success: true,
        isValid,
        data: data,
      })
    } catch (error) {
      console.error("Error verifying transaction:", error)
      return NextResponse.json({ success: true, isValid: false })
    }
  } catch (error) {
    console.error("Error in verify-transaction:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
