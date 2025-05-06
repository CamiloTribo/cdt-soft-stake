import { NextResponse } from "next/server";
import { getUserByAddress, updateUsername } from "@/src/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wallet_address, username } = body;

    if (!wallet_address || !username) {
      return NextResponse.json({ error: "Wallet address and username are required" }, { status: 400 });
    }

    // Buscar al usuario por su dirección de wallet
    const user = await getUserByAddress(wallet_address);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Actualizar el username
    const success = await updateUsername(user.id, username);

    if (!success) {
      return NextResponse.json({ error: "Failed to update username" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in update-username API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}