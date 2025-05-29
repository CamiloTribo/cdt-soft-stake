import { NextResponse } from "next/server"
import { getUserByAddress } from "@/src/lib/supabase"
import { sendRewards } from "@/src/lib/blockchain"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Interfaz para errores con mensaje
interface ErrorWithMessage {
  message: string;
}

// Función para verificar si un error tiene propiedad message
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Función para obtener el mensaje de error
function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return String(error);
}

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
    console.log("🎁 CDT CLAIM: Endpoint llamado")
    
    // Obtener datos del body
    const body = await request.json()
    const { userId, username, purchaseId } = body

    // Validar parámetros
    if (!userId || !purchaseId) {
      console.error("❌ CDT CLAIM: Parámetros faltantes:", { userId, purchaseId })
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    // Buscar al usuario usando la función helper
    console.log("🔍 CDT CLAIM: Buscando usuario con address:", userId)
    const user = await getUserByAddress(userId)

    if (!user) {
      console.error("❌ CDT CLAIM: Usuario no encontrado")
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    console.log("✅ CDT CLAIM: Usuario encontrado:", user)

    // Verificar si la compra existe y no ha sido reclamada
    console.log("🔍 CDT CLAIM: Buscando compra:", purchaseId)
    const { data: purchase, error: purchaseError } = await supabase
      .from("cdt_purchases")
      .select("*")
      .eq("id", purchaseId)
      .eq("user_id", userId)
      .eq("is_claimed", false)
      .single()

    if (purchaseError || !purchase) {
      console.error("❌ CDT CLAIM: Compra no encontrada o ya reclamada:", purchaseError)
      return NextResponse.json({ 
        success: false, 
        error: "Purchase not found or already claimed" 
      }, { status: 404 })
    }

    console.log("✅ CDT CLAIM: Compra encontrada:", purchase)

    // Enviar CDT usando blockchain.ts
    let claimResult;
    try {
      console.log(`💸 CDT CLAIM: Enviando ${purchase.cdt_amount} CDT al usuario ${username} (${userId})`)
      claimResult = await sendRewards(userId, purchase.cdt_amount)
    } catch (error: unknown) {
      console.error("Error en sendRewards:", error)
      
      // Si el error es por un valor decimal inválido, proporcionamos un mensaje más claro
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes("invalid decimal value")) {
        console.log("Detectado error de valor decimal inválido")
        
        return NextResponse.json({
          success: false,
          error: "Error al procesar entrega de CDT. Por favor, intenta nuevamente más tarde.",
          details: "Se ha detectado un valor decimal inválido que será corregido automáticamente."
        }, { status: 400 })
      }
      
      // Si es otro tipo de error, lo propagamos
      throw error
    }

    // Verificación mejorada del resultado
    if (!claimResult || !claimResult.success || !claimResult.txHash) {
      console.error("❌ CDT CLAIM: Error en sendRewards:", claimResult)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to deliver CDT",
          details: claimResult ? `TxHash: ${claimResult.txHash}` : "No result",
        },
        { status: 400 },
      )
    }

    console.log("✅ CDT CLAIM: CDT enviado exitosamente:", claimResult)

    // Actualizar el estado de la compra a reclamada
    const { error: updateError } = await supabase
      .from("cdt_purchases")
      .update({ 
        is_claimed: true, 
        claimed_at: new Date().toISOString(),
        delivery_tx_hash: claimResult.txHash
      })
      .eq("id", purchaseId)

    if (updateError) {
      console.error("❌ CDT CLAIM: Error al actualizar compra:", updateError)
      return NextResponse.json({ success: false, error: "Failed to update purchase" }, { status: 500 })
    }

    // Registrar la transacción de entrega de CDT
    const { error: txError } = await supabase.from("transactions").insert([
      {
        user_id: user.id,
        wallet_address: userId,
        username: username || user.username || "",
        type: "receive",
        amount: purchase.cdt_amount, // ✅ USAR purchase.cdt_amount
        token_type: "CDT",
        tx_hash: claimResult.txHash,
        status: "success",
        description: `${username || user.username} reclamó ${purchase.cdt_amount} CDT del paquete comprado`,
      },
    ])

    if (txError) {
      console.error("⚠️ CDT CLAIM: Error registering transaction:", txError)
      // Continuamos aunque falle el registro de la transacción
    }

    // Actualizar el total_claimed del usuario
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("total_claimed")
        .eq("id", user.id)
        .single()

      if (!userError && userData) {
        const currentTotal = userData.total_claimed || 0
        const newTotal = currentTotal + purchase.cdt_amount // ✅ USAR purchase.cdt_amount

        const { error: updateError } = await supabase
          .from("users")
          .update({ total_claimed: newTotal })
          .eq("id", user.id)

        if (updateError) {
          console.error("⚠️ CDT CLAIM: Error updating total_claimed:", updateError)
        } else {
          console.log(`Total claimed updated for user ${user.id}: ${currentTotal} -> ${newTotal}`)
        }
      }
    } catch (error) {
      console.error("⚠️ CDT CLAIM: Error updating user stats (no crítico):", error)
    }

    // Sincronizar el nivel del usuario después del claim
    try {
      const baseUrl = "https://tribo-vault.vercel.app";
      const updateLevelUrl = `${baseUrl}/api/update-level`;
      
      // Obtener el balance actual
      const { data: stakingData } = await supabase
        .from("staking_info")
        .select("staked_amount")
        .eq("user_id", user.id)
        .single();
        
      if (stakingData) {
        await fetchWithRetry(updateLevelUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: userId,
            staked_amount: stakingData.staked_amount,
          }),
        }, 3);
      }
    } catch (error) {
      console.error("⚠️ CDT CLAIM: Error syncing user level after claim:", error);
      // No interrumpimos el flujo principal si falla la sincronización
    }

    console.log("✅ CDT CLAIM: CDT reclamado exitosamente")
    return NextResponse.json({
      success: true,
      message: "¡CDT reclamados correctamente!",
      cdtAmount: purchase.cdt_amount, // ✅ USAR purchase.cdt_amount
      txHash: claimResult.txHash,
    })
  } catch (error: unknown) {
    console.error("❌ CDT CLAIM: Error general:", error)
    return NextResponse.json(
      {
        success: false,
        error: isErrorWithMessage(error) ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}