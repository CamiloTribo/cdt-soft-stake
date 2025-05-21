import { NextResponse } from "next/server"
import { getUserByAddress } from "@/src/lib/supabase"
import { claimRewards } from "@/src/lib/staking"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Función de utilidad para reintentos
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Intento ${attempt} para ${url}`);
      const response = await fetch(url, options);
      if (response.ok) return response;
      lastError = new Error(`HTTP error ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.warn(`Intento ${attempt} falló:`, error);
      lastError = error;
      
      // Esperar antes de reintentar (backoff exponencial)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

export async function POST(request: Request) {
  try {
    // Obtener la dirección de wallet del body
    const body = await request.json()
    const { wallet_address } = body

    if (!wallet_address) {
      return NextResponse.json({ success: false, error: "Wallet address is required" }, { status: 400 })
    }

    // Buscar al usuario por su dirección de wallet
    const user = await getUserByAddress(wallet_address)

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Reclamar recompensas
    const claimResult = await claimRewards(user.id, wallet_address)

    // Verificación mejorada del resultado
    if (!claimResult || !claimResult.success || !claimResult.txHash) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to claim rewards",
          details: claimResult ? `Amount: ${claimResult.amount}, TxHash: ${claimResult.txHash}` : "No result",
        },
        { status: 400 },
      )
    }

    // Registrar la transacción
    const { error: txError } = await supabase.from("transactions").insert([
      {
        user_id: user.id,
        type: "claim",
        amount: claimResult.amount,
        token_type: "CDT",
        tx_hash: claimResult.txHash,
        status: "success",
        description: "Reclamación de recompensas diarias",
      },
    ])

    if (txError) {
      console.error("Error registering transaction:", txError)
      // Continuamos aunque falle el registro de la transacción
    }

    // MEJORA: Actualizar el total_claimed del usuario de manera más eficiente
    // Obtenemos el total_claimed actual para asegurarnos de tener el valor más reciente
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("total_claimed")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("Error getting current total_claimed:", userError)
    } else {
      // Calculamos el nuevo total_claimed
      const currentTotal = userData.total_claimed || 0
      const newTotal = currentTotal + claimResult.amount

      // Actualizamos directamente con el nuevo valor
      const { error: updateError } = await supabase.from("users").update({ total_claimed: newTotal }).eq("id", user.id)

      if (updateError) {
        console.error("Error updating total_claimed:", updateError)
      } else {
        console.log(`Total claimed updated for user ${user.id}: ${currentTotal} -> ${newTotal}`)
      }
    }

    // Sincronizar el nivel del usuario después del claim
    try {
      // Construir URL absoluta
      const baseUrl = "https://tribo-vault.vercel.app";
      const updateLevelUrl = `${baseUrl}/api/update-level`;
      
      // Obtener el balance actual
      const { data: stakingData } = await supabase
        .from("staking_info")
        .select("staked_amount")
        .eq("user_id", user.id)
        .single();
        
      if (stakingData) {
        // Usar fetchWithRetry para manejar fallos temporales
        await fetchWithRetry(updateLevelUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: wallet_address,
            staked_amount: stakingData.staked_amount,
          }),
        }, 3); // 3 intentos máximo
      }
    } catch (error) {
      console.error("Error syncing user level after claim:", error);
      // No interrumpimos el flujo principal si falla la sincronización
    }

    return NextResponse.json({
      success: true,
      message: "¡Recompensas reclamadas correctamente!",
      amount: claimResult.amount, // Añadimos la cantidad reclamada en la respuesta
    })
  } catch (error) {
    console.error("Error in claim API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}