import { NextResponse } from "next/server"
import { getUserByAddress } from "@/src/lib/supabase"
import { getStakingInfo, calculatePendingRewards, updateStakedAmount } from "@/src/lib/staking"
import { getCDTBalance } from "@/src/lib/blockchain"

// Modificar la función GET para que siempre verifique el balance actual en la blockchain
export async function GET(request: Request) {
  try {
    // Obtener la dirección de wallet de la query
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get("wallet_address")

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // IMPORTANTE: Siempre obtener el balance actual de la blockchain
    const currentBalance = await getCDTBalance(walletAddress)

    // Buscar al usuario por su dirección de wallet
    const user = await getUserByAddress(walletAddress)

    // Si el usuario no existe, devolvemos el balance actual pero sin historial de staking
    if (!user) {
      return NextResponse.json({
        staked_amount: currentBalance,
        pending_rewards: 0,
        last_claim_timestamp: null,
      })
    }

    // Obtener información de staking
    const stakingInfo = await getStakingInfo(user.id)

    // Si no hay información de staking, devolvemos el balance actual pero sin recompensas
    if (!stakingInfo) {
      return NextResponse.json({
        staked_amount: currentBalance,
        pending_rewards: 0,
        last_claim_timestamp: null,
      })
    }

    // IMPORTANTE: Actualizar automáticamente el balance en la base de datos si ha cambiado
    if (Math.abs(stakingInfo.staked_amount - currentBalance) > 0.000001) {
      console.log(`Balance ha cambiado. DB: ${stakingInfo.staked_amount}, Blockchain: ${currentBalance}`)
      // Actualizar el balance en la base de datos
      await updateStakedAmount(user.id, walletAddress)
      // Actualizar el stakingInfo con el nuevo balance
      stakingInfo.staked_amount = currentBalance
    }

    // Calcular recompensas pendientes basadas en el balance actualizado
    const pendingRewards = calculatePendingRewards(stakingInfo)

    return NextResponse.json({
      staked_amount: currentBalance, // Siempre devolver el balance actual de la blockchain
      pending_rewards: pendingRewards,
      last_claim_timestamp: stakingInfo.last_claim_timestamp,
    })
  } catch (error) {
    console.error("Error in staking API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
