import { NextResponse } from "next/server"
import { ethers } from "ethers"

// Configuración
const WORLD_CHAIN_RPC = process.env.WORLD_CHAIN_RPC || "https://worldchain-mainnet.g.alchemy.com/public"
const CDT_CONTRACT_ADDRESS = process.env.CDT_CONTRACT_ADDRESS || "0x3Cb880f7ac84950c369e700deE2778d023b0C52d"
const CENTRAL_WALLET_ADDRESS = process.env.CENTRAL_WALLET_ADDRESS || "0x8a89B684145849cc994be122ddEc5b268CAE0cB6"

// ABI mínimo para el token CDT (solo necesitamos la función transfer)
const CDT_ABI = ["function transfer(address to, uint256 amount) returns (bool)"]

export async function POST(request: Request) {
  try {
    // Obtener parámetros
    const body = await request.json()
    const { amount, walletAddress } = body

    if (!amount || !walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requiere amount y walletAddress",
        },
        { status: 400 },
      )
    }

    // Validar dirección usando ethers
    if (!ethers.utils.isAddress(walletAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: "Dirección de wallet inválida",
        },
        { status: 400 },
      )
    }

    // Crear un proveedor para interactuar con la blockchain
    const provider = new ethers.providers.JsonRpcProvider(WORLD_CHAIN_RPC)

    // En una transacción real, el usuario firmaría la transacción con su wallet
    // Aquí simulamos como si el usuario estuviera enviando desde su wallet
    const simulationWallet = ethers.Wallet.createRandom().connect(provider)
    const userWalletAddress = walletAddress // La dirección real del usuario

    console.log("Dirección de la wallet del usuario:", userWalletAddress)
    console.log("Dirección de la wallet central (destino):", CENTRAL_WALLET_ADDRESS)

    // En un caso real, verificaríamos el balance del usuario
    // const cdtBalance = await getCDTBalance(userWalletAddress)
    // if (cdtBalance < amount) {
    //   throw new Error(`El usuario no tiene suficiente CDT. Tiene ${cdtBalance} CDT, necesita ${amount} CDT`)
    // }

    // Simulamos un balance para la demostración
    const simulatedBalance = 1000
    console.log("Balance simulado del usuario:", simulatedBalance, "CDT")

    // Crear instancia del contrato
    const cdtContract = new ethers.Contract(CDT_CONTRACT_ADDRESS, CDT_ABI, simulationWallet)

    // Convertir el monto a wei (asumiendo 18 decimales para CDT)
    const amountInWei = ethers.utils.parseUnits(amount.toString(), 18)

    // Obtener el nonce actual (necesario para cualquier transacción)
    const nonce = await provider.getTransactionCount(userWalletAddress)

    // Obtener el gas price actual
    const gasPrice = await provider.getGasPrice()

    // Estimar el gas necesario para la transacción
    const gasEstimate = ethers.BigNumber.from(100000) // Valor típico para transferencias de tokens

    // Crear los datos de la transacción (llamada a la función transfer)
    // Aquí es donde especificamos que el destino es la wallet central
    const data = cdtContract.interface.encodeFunctionData("transfer", [CENTRAL_WALLET_ADDRESS, amountInWei])

    // Crear el objeto de transacción
    const txObject = {
      from: userWalletAddress,
      to: CDT_CONTRACT_ADDRESS,
      nonce: nonce,
      gasLimit: gasEstimate,
      gasPrice: gasPrice,
      data: data,
      value: ethers.constants.Zero, // No enviamos ETH, solo tokens
      chainId: 480, // WorldChain chainId
    }

    // En una transacción real, el usuario firmaría con su wallet:
    // const signedTx = await userWallet.signTransaction(txObject)
    // const txResponse = await provider.sendTransaction(signedTx)
    // const receipt = await txResponse.wait()

    // Verificar si hay suficiente balance para la transacción
    if (simulatedBalance < Number.parseFloat(amount)) {
      return NextResponse.json(
        {
          success: false,
          error: `Balance insuficiente. El usuario tiene ${simulatedBalance} CDT, pero se requieren ${amount} CDT.`,
          walletBalance: simulatedBalance,
          requiredAmount: amount,
        },
        { status: 400 },
      )
    }

    // Para la simulación, generamos un hash ficticio
    const simulatedTxHash =
      "0x" +
      Array(64)
        .fill(0)
        .map(() => Math.floor(Math.random() * 16).toString(16))
        .join("")

    // Registrar información para depuración
    console.log("Simulación de transacción CDT (pago de usuario a wallet central):")
    console.log("- Wallet del usuario:", userWalletAddress)
    console.log("- Wallet central (destino):", CENTRAL_WALLET_ADDRESS)
    console.log("- Cantidad:", amount, "CDT (", amountInWei.toString(), "wei)")
    console.log("- Nonce:", nonce)
    console.log("- Gas Price:", ethers.utils.formatUnits(gasPrice, "gwei"), "gwei")
    console.log("- Gas Limit:", gasEstimate.toString())
    console.log("- Datos de transacción:", data)
    console.log("- Objeto de transacción:", JSON.stringify(txObject, null, 2))
    console.log("- Hash simulado:", simulatedTxHash)

    // Devolver respuesta exitosa con todos los detalles de la transacción
    return NextResponse.json({
      success: true,
      message: "Transacción preparada correctamente (simulación)",
      txHash: simulatedTxHash,
      transactionDetails: {
        type: "user_to_central_wallet",
        from: userWalletAddress,
        to: CENTRAL_WALLET_ADDRESS,
        contractAddress: CDT_CONTRACT_ADDRESS,
        contractMethod: "transfer",
        parameters: {
          recipient: CENTRAL_WALLET_ADDRESS,
          amount: amount.toString(),
          amountInWei: amountInWei.toString(),
        },
        userBalance: simulatedBalance,
        nonce: nonce,
        gasPrice: ethers.utils.formatUnits(gasPrice, "gwei") + " gwei",
        gasLimit: gasEstimate.toString(),
        chainId: 480,
        data: data,
        rawTransaction: txObject,
      },
    })
  } catch (error) {
    console.error("Error en simulación de transacción CDT:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
