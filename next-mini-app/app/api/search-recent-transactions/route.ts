import { NextResponse } from "next/server"
import axios from "axios"

// Configuración de Alchemy - La misma que usa el sistema de CDT
const ALCHEMY_API_KEY = "w-hTDCI5WQMGz4u1G0FU0XOMGJlmPSDp"
const ALCHEMY_API_URL = `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`

// Interfaces para tipar las respuestas
interface AlchemyTransfer {
  hash: string
  value: string
  to: string
  from: string
  metadata?: {
    blockTimestamp: string
  }
}

interface AlchemyResponse {
  result: {
    transfers: AlchemyTransfer[]
  }
}

export async function POST(request: Request) {
  try {
    const { wallet_address, amount, recipient } = await request.json()

    if (!wallet_address || !amount || !recipient) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      )
    }

    console.log(`Buscando transacciones de ${wallet_address} a ${recipient} por ${amount} WLD`)

    // Obtener el último bloque
    const blockNumberResponse = await axios.post(ALCHEMY_API_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_blockNumber",
      params: [],
    })

    const latestBlock = parseInt(blockNumberResponse.data.result, 16)
    const fromBlock = latestBlock - 150 // Últimos ~5 minutos

    console.log(`Buscando en bloques desde ${fromBlock} hasta ${latestBlock}`)

    // Buscar transacciones de WLD
    const WLD_CONTRACT = "0x163f8C2467924be0ae7B5347228CDED1E9C041A8" // Contrato de WLD en WorldChain

    // Buscar transferencias de WLD
    const response = await axios.post<AlchemyResponse>(ALCHEMY_API_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getAssetTransfers",
      params: [
        {
          fromBlock: "0x" + fromBlock.toString(16),
          toBlock: "latest",
          fromAddress: wallet_address,
          toAddress: recipient,
          contractAddresses: [WLD_CONTRACT],
          category: ["erc20"],
          withMetadata: true,
          excludeZeroValue: true,
        },
      ],
    })

    console.log("Respuesta de Alchemy:", JSON.stringify(response.data, null, 2))

    // Buscar transacciones que coincidan con el monto
    if (
      response.data &&
      response.data.result &&
      response.data.result.transfers &&
      response.data.result.transfers.length > 0
    ) {
      const transfers = response.data.result.transfers

      // Buscar una transferencia que coincida con el monto (con una pequeña tolerancia)
      const matchingTransfer = transfers.find((transfer: AlchemyTransfer) => {
        const transferAmount = parseFloat(transfer.value)
        const targetAmount = parseFloat(amount.toString())
        
        // Tolerancia del 1%
        const tolerance = targetAmount * 0.01
        
        return (
          Math.abs(transferAmount - targetAmount) <= tolerance &&
          transfer.to.toLowerCase() === recipient.toLowerCase()
        )
      })

      if (matchingTransfer) {
        console.log("Transferencia encontrada:", matchingTransfer)
        return NextResponse.json({
          success: true,
          txHash: matchingTransfer.hash,
          data: matchingTransfer,
        })
      }
    }

    return NextResponse.json({
      success: false,
      error: "No matching transaction found",
    })
  } catch (error) {
    console.error("Error searching transactions:", error)
    return NextResponse.json(
      { success: false, error: "Error searching transactions" },
      { status: 500 }
    )
  }
}