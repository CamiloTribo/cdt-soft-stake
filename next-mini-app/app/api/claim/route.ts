import { NextResponse } from "next/server"
import { getUserByAddress } from "@/src/lib/supabase"
import { claimRewards } from "@/src/lib/staking"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Función de utilidad para reintentos en operaciones críticas
async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
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

    // Reclamar recompensas con reintentos
    const claimResult = await retryOperation(async () => {
      return await claimRewards(user.id, wallet_address)
    }, 3);

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

    // Registrar la transacción con reintentos
    try {
      await retryOperation(async () => {
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
          throw new Error(`Error registering transaction: ${txError.message}`);
        }
        
        return true;
      }, 2);
    } catch (txError) {
      console.error("Error registering transaction after retries:", txError)
      // Continuamos aunque falle el registro de la transacción
    }

    // MEJORA: Actualizar el total_claimed del usuario de manera más eficiente
    try {
      await retryOperation(async () => {
        // Obtenemos el total_claimed actual para asegurarnos de tener el valor más reciente
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("total_claimed")
          .eq("id", user.id)
          .single()

        if (userError) {
          throw new Error(`Error getting current total_claimed: ${userError.message}`);
        }

        // Calculamos el nuevo total_claimed
        const currentTotal = userData.total_claimed || 0
        const newTotal = currentTotal + claimResult.amount

        // Actualizamos directamente con el nuevo valor
        const { error: updateError } = await supabase.from("users").update({ total_claimed: newTotal }).eq("id", user.id)

        if (updateError) {
          throw new Error(`Error updating total_claimed: ${updateError.message}`);
        }
        
        console.log(`Total claimed updated for user ${user.id}: ${currentTotal} -> ${newTotal}`)
        return true;
      }, 2);
    } catch (updateError) {
      console.error("Error updating total_claimed after retries:", updateError)
      // Continuamos aunque falle la actualización del total_claimed
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