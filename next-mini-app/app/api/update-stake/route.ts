import { NextResponse } from "next/server";
import { getUserByAddress, createUser } from "@/src/lib/supabase";
import { updateStakedAmount } from "@/src/lib/staking";

export async function POST(request: Request) {
  try {
    // Obtener la dirección de wallet y username del body
    const body = await request.json();
    const { wallet_address, username } = body;

    if (!wallet_address) {
      return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 });
    }

    // Buscar al usuario por su dirección de wallet
    let user = await getUserByAddress(wallet_address);

    // Si el usuario no existe, lo creamos
    if (!user) {
      user = await createUser(wallet_address, username);
      if (!user) {
        return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
      }
    }

    // Actualizar el monto stakeado
    const success = await updateStakedAmount(user.id, wallet_address);

    if (!success) {
      return NextResponse.json({ success: false, error: "Failed to update staked amount" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: "Balance actualizado correctamente" 
    });
  } catch (error) {
    console.error("Error in update-stake API:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal server error" 
    }, { status: 500 });
  }
}