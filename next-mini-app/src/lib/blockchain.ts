import axios from "axios"
import { ethers } from "ethers"

// Configuración de Alchemy - Usamos la variable de entorno para la URL completa
const ALCHEMY_API_KEY = "w-hTDCI5WQMGz4u1G0FU0XOMGJlmPSDp"
const ALCHEMY_API_URL = `https://worldchain-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
const CDT_CONTRACT_ADDRESS = "0x3Cb880f7ac84950c369e700deE2778d023b0C52d"

// ABI simplificado para el token CDT
const CDT_ABI = ["function transfer(address to, uint256 amount) returns (bool)"]

// Variable global para almacenar el último nonce utilizado
let lastUsedNonce = -1
let nonceUpdateTime = 0

// Función para convertir valores en notación científica a formato decimal completo
function formatDecimal(num: number): string {
  // Convertir a string con 18 decimales fijos (precisión de Ethereum)
  const str = num.toFixed(18);
  // Eliminar ceros finales y punto decimal si no hay decimales
  return str.replace(/\.?0+$/, "");
}

// Función para normalizar valores decimales extremadamente pequeños
function normalizeAmount(amount: number): number {
  // Si el valor es extremadamente pequeño (menor que 1e-18), lo redondeamos a 0
  if (amount < 1e-18) {
    console.log(`Valor extremadamente pequeño detectado: ${amount}, normalizando a 0`);
    return 0;
  }
  
  // Para valores pequeños pero significativos, mantenemos el valor original
  // pero nos aseguramos de que se pueda representar correctamente
  return amount;
}

// Función para obtener el balance de CDT de una dirección
export async function getCDTBalance(address: string): Promise<number> {
  console.log("Obteniendo balance real para:", address)

  if (!address || address === "0x0000000000000000000000000000000000000000") {
    return 0
  }

  try {
    // Llamar a la API de Alchemy directamente con cache-busting
    const timestamp = Date.now()
    const response = await axios.post(
      `${ALCHEMY_API_URL}?_t=${timestamp}`,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "alchemy_getTokenBalances",
        params: [address, [CDT_CONTRACT_ADDRESS]],
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )

    console.log("Respuesta de Alchemy:", JSON.stringify(response.data, null, 2))

    // Verificar si tenemos resultados
    if (
      response.data &&
      response.data.result &&
      response.data.result.tokenBalances &&
      response.data.result.tokenBalances.length > 0
    ) {
      // Obtener el balance en formato hexadecimal
      const tokenBalance = response.data.result.tokenBalances[0]

      if (tokenBalance && tokenBalance.tokenBalance) {
        // Convertir de hex a decimal
        const balanceInWei = Number.parseInt(tokenBalance.tokenBalance, 16)

        // Convertir de wei a unidades de token (asumiendo 18 decimales)
        const formattedBalance = balanceInWei / Math.pow(10, 18)

        console.log("Balance formateado:", formattedBalance)
        return formattedBalance
      }
    }

    console.log("No se encontró balance para el token CDT")
    return 0
  } catch (error) {
    console.error("Error al obtener el balance de CDT:", error)

    // En lugar de devolver un valor simulado, devolvemos 0 y registramos el error
    console.error("Error al obtener balance, devolviendo 0")
    return 0
  }
}

// Función para obtener el nonce actual con manejo de concurrencia
async function getCurrentNonce(walletAddress: string): Promise<number> {
  // Si el último nonce se actualizó hace menos de 2 segundos, incrementarlo en lugar de consultar
  const now = Date.now()
  if (lastUsedNonce !== -1 && now - nonceUpdateTime < 2000) {
    lastUsedNonce++
    console.log("Usando nonce incrementado:", lastUsedNonce)
    return lastUsedNonce
  }

  // Obtener el nonce actual desde la blockchain
  try {
    const nonceResponse = await axios.post(
      ALCHEMY_API_URL,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionCount",
        params: [walletAddress, "pending"], // Usar "pending" en lugar de "latest"
      },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )

    if (!nonceResponse.data || !nonceResponse.data.result) {
      throw new Error("No se pudo obtener el nonce")
    }

    const nonce = Number.parseInt(nonceResponse.data.result, 16)

    // Actualizar el nonce global
    lastUsedNonce = nonce
    nonceUpdateTime = now

    console.log("Nonce obtenido de la blockchain:", nonce)
    return nonce
  } catch (error) {
    console.error("Error al obtener nonce:", error)
    throw error
  }
}

// Función para enviar recompensas de staking usando la API de Alchemy directamente
export async function sendRewards(
  toAddress: string,
  amount: number,
): Promise<{ success: boolean; txHash: string | null; error?: string }> {
  // Normalizar el monto antes de procesarlo
  const normalizedAmount = normalizeAmount(amount);
  
  console.log(`Enviando ${normalizedAmount} CDT a ${toAddress} (valor original: ${amount})`);

  // Si el monto normalizado es 0, no enviamos la transacción
  if (normalizedAmount <= 0) {
    console.log("Monto normalizado es 0, no se enviará la transacción");
    return {
      success: false,
      txHash: null,
      error: "Monto demasiado pequeño para procesar",
    };
  }

  try {
    // Obtener la clave privada de la wallet central
    const privateKey = process.env.CENTRAL_WALLET_PRIVATE_KEY
    if (!privateKey) {
      throw new Error("No se ha configurado la clave privada de la wallet central")
    }

    // Crear una wallet sin proveedor (solo para firmar)
    const wallet = new ethers.Wallet(privateKey)
    console.log("Dirección de la wallet central:", wallet.address)

    // Obtener el balance de CDT de la wallet central
    const cdtBalance = await getCDTBalance(wallet.address)
    console.log("Balance de CDT en la wallet central:", cdtBalance, "CDT")

    // Verificar si hay suficiente CDT para enviar
    if (cdtBalance < normalizedAmount) {
      console.error(
        `La wallet central no tiene suficiente CDT para enviar. Tiene ${cdtBalance} CDT, necesita ${normalizedAmount} CDT`,
      )
      return {
        success: false,
        txHash: null,
        error: "Fondos insuficientes en la wallet central",
      }
    }

    // Obtener el nonce actual con manejo de concurrencia
    const nonce = await getCurrentNonce(wallet.address)
    console.log("Nonce a utilizar:", nonce)

    // Obtener el gas price usando la API de Alchemy
    const gasPriceResponse = await axios.post(ALCHEMY_API_URL, {
      jsonrpc: "2.0",
      id: 1,
      method: "eth_gasPrice",
      params: [],
    })

    if (!gasPriceResponse.data || !gasPriceResponse.data.result) {
      throw new Error("No se pudo obtener el gas price")
    }

    const gasPrice = gasPriceResponse.data.result
    console.log("Gas price:", gasPrice)

    // Crear los datos de la transacción (llamada a la función transfer del contrato)
    const iface = new ethers.utils.Interface(CDT_ABI)
    
    // CAMBIO IMPORTANTE: Convertir a formato decimal completo para evitar notación científica
    const formattedAmount = formatDecimal(normalizedAmount);
    console.log(`Valor formateado para ethers: ${formattedAmount}`);
    
    try {
      // Usar el valor formateado para la conversión a wei
      const amountInWei = ethers.utils.parseUnits(formattedAmount, 18)
      const data = iface.encodeFunctionData("transfer", [toAddress, amountInWei])

      // Crear la transacción
      const tx = {
        to: CDT_CONTRACT_ADDRESS,
        nonce: ethers.utils.hexlify(nonce),
        gasLimit: ethers.utils.hexlify(200000), // Gas limit fijo
        gasPrice: gasPrice,
        data: data,
        chainId: 480, // WorldChain chainId
        value: "0x0",
      }

      console.log("Transacción a firmar:", tx)

      // Firmar la transacción sin usar un proveedor
      const signedTx = await wallet.signTransaction(tx)
      console.log("Transacción firmada:", signedTx)

      // Enviar la transacción usando la API de Alchemy
      const sendResponse = await axios.post(ALCHEMY_API_URL, {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_sendRawTransaction",
        params: [signedTx],
      })

      console.log("Respuesta de envío:", JSON.stringify(sendResponse.data, null, 2))

      if (sendResponse.data && sendResponse.data.result) {
        const txHash = sendResponse.data.result
        console.log("Transacción enviada. Hash:", txHash)
        return { success: true, txHash }
      } else if (sendResponse.data && sendResponse.data.error) {
        // Si hay un error de nonce, intentar recuperar
        const errorData = sendResponse.data.error
        if (errorData && typeof errorData.message === "string" && errorData.message.includes("nonce too low")) {
          console.log("Error de nonce detectado, actualizando nonce global")

          // Forzar actualización del nonce
          nonceUpdateTime = 0
          await getCurrentNonce(wallet.address)

          return {
            success: false,
            txHash: null,
            error: `Error de nonce: ${JSON.stringify(errorData)}. Por favor, intenta nuevamente.`,
          }
        }

        throw new Error(`Error de Alchemy: ${JSON.stringify(errorData)}`)
      }

      throw new Error("Respuesta inesperada de Alchemy")
    } catch (parseError) {
      // Si hay un error al parsear el valor, intentamos con un enfoque alternativo
      console.error("Error al parsear el valor, intentando enfoque alternativo:", parseError);
      
      // Convertir a un valor más grande y luego ajustar las unidades
      // Por ejemplo, si tenemos 1e-9, lo multiplicamos por 1e9 para obtener 1
      // y luego usamos 9 decimales menos (18-9=9)
      let adjustedDecimals = 18;
      let adjustedAmount = normalizedAmount;
      
      // Si el valor es muy pequeño, ajustamos
      if (normalizedAmount < 1e-6) {
        const exponent = Math.floor(Math.log10(normalizedAmount));
        const adjustment = Math.abs(exponent);
        adjustedAmount = normalizedAmount * Math.pow(10, adjustment);
        adjustedDecimals = Math.max(18 - adjustment, 0);
        console.log(`Ajustando valor: ${normalizedAmount} -> ${adjustedAmount} con ${adjustedDecimals} decimales`);
      }
      
      // Convertir a string con formato fijo
      const adjustedAmountStr = adjustedAmount.toString();
      
      // Usar el valor ajustado para la conversión a wei
      const amountInWei = ethers.utils.parseUnits(adjustedAmountStr, adjustedDecimals);
      const data = iface.encodeFunctionData("transfer", [toAddress, amountInWei]);
      
      // Crear la transacción con el nuevo data
      const tx = {
        to: CDT_CONTRACT_ADDRESS,
        nonce: ethers.utils.hexlify(nonce),
        gasLimit: ethers.utils.hexlify(200000), // Gas limit fijo
        gasPrice: gasPrice,
        data: data,
        chainId: 480, // WorldChain chainId
        value: "0x0",
      }

      console.log("Transacción a firmar (enfoque alternativo):", tx);

      // Firmar la transacción sin usar un proveedor
      const signedTx = await wallet.signTransaction(tx);
      console.log("Transacción firmada (enfoque alternativo):", signedTx);

      // Enviar la transacción usando la API de Alchemy
      const sendResponse = await axios.post(ALCHEMY_API_URL, {
        jsonrpc: "2.0",
        id: 1,
        method: "eth_sendRawTransaction",
        params: [signedTx],
      });

      console.log("Respuesta de envío (enfoque alternativo):", JSON.stringify(sendResponse.data, null, 2));

      if (sendResponse.data && sendResponse.data.result) {
        const txHash = sendResponse.data.result;
        console.log("Transacción enviada (enfoque alternativo). Hash:", txHash);
        return { success: true, txHash };
      } else if (sendResponse.data && sendResponse.data.error) {
        throw new Error(`Error de Alchemy (enfoque alternativo): ${JSON.stringify(sendResponse.data.error)}`);
      }

      throw new Error("Respuesta inesperada de Alchemy (enfoque alternativo)");
    }
  } catch (error) {
    console.error("Error al enviar recompensas:", error)

    // En lugar de devolver un hash simulado, devolvemos error
    return {
      success: false,
      txHash: null,
      error: error instanceof Error ? error.message : "Error desconocido al enviar recompensas",
    }
  }
}