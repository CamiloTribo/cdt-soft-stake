import { NextResponse } from "next/server";
import { getUserByAddress } from "@/src/lib/supabase";
import { getStakingInfo, calculatePendingRewards } from "@/src/lib/staking";
import { getCDTBalance } from "@/src/lib/blockchain";

export async function GET(request: Request) {
  try {
    // Obtener la dirección de wallet de la query
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("wallet_address");

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });
    }

    // Buscar al usuario por su dirección de wallet
    const user = await getUserByAddress(walletAddress);
    
    // Si el usuario no existe, devolvemos el balance actual pero sin historial de staking
    if (!user) {
      const balance = await getCDTBalance(walletAddress);
      return NextResponse.json({
        staked_amount: balance,
        pending_rewards: 0,
        last_claim_timestamp: null,
      });
    }

    // Obtener información de staking
    const stakingInfo = await getStakingInfo(user.id);
    
    // Si no hay información de staking, devolvemos el balance actual pero sin recompensas
    if (!stakingInfo) {
      const balance = await getCDTBalance(walletAddress);
      return NextResponse.json({
        staked_amount: balance,
        pending_rewards: 0,
        last_claim_timestamp: null,
      });
    }

    // Calcular recompensas pendientes
    const pendingRewards = calculatePendingRewards(stakingInfo);

    return NextResponse.json({
      staked_amount: stakingInfo.staked_amount,
      pending_rewards: pendingRewards,
      last_claim_timestamp: stakingInfo.last_claim_timestamp,
    });
  } catch (error) {
    console.error("Error in staking API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}