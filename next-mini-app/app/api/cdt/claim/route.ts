import { NextResponse } from "next/server"
import { getUserByAddress } from "@/src/lib/supabase"
import { sendFixedCDT } from "@/src/lib/blockchain" // ✅ Importar sendFixedCDT en lugar de claimRewards
import { sendRewards } from "@/src/lib/blockchain" // ✅ Importar sendRewards para referidos
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

export async function POST(request: Request) {
  try {
    console.log("🎁 CDT CLAIM: Endpoint llamado")
    
    // Obtener datos del body
    const body = await request.json()
    const { userId, purchaseId } = body // ✅ Quitar username
    console.log("🎁 CDT CLAIM: Request body:", { userId, purchaseId });

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

    // ✅ USAR sendFixedCDT() para enviar cantidad fija de CDT
    let claimResult;
    try {
      console.log(`💰 CDT CLAIM: Enviando cantidad FIJA de ${purchase.cdt_amount} CDT para el usuario ${userId}`)
      claimResult = await sendFixedCDT(userId, purchase.cdt_amount) // ✅ USAR sendFixedCDT con cantidad fija
      console.log("✅ CDT CLAIM: sendFixedCDT result:", claimResult);
    } catch (error: unknown) {
      console.error("❌ CDT CLAIM: Error en sendFixedCDT:", error)
      
      const errorMessage = getErrorMessage(error);
      if (errorMessage.includes("invalid decimal value")) {
        console.log("❌ CDT CLAIM: Detectado error de valor decimal inválido")
        
        return NextResponse.json({
          success: false,
          error: "Error al procesar entrega de CDT. Por favor, intenta nuevamente más tarde.",
          details: "Se ha detectado un valor decimal inválido que será corregido automáticamente."
        }, { status: 400 })
      }
      
      throw error
    }

    // Verificación mejorada del resultado
    if (!claimResult || !claimResult.success || !claimResult.txHash) {
      console.error("❌ CDT CLAIM: Error en sendFixedCDT:", claimResult)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to deliver CDT",
          details: claimResult ? `Amount: ${purchase.cdt_amount}, TxHash: ${claimResult.txHash}` : "No result",
        },
        { status: 400 },
      )
    }

    console.log("✅ CDT CLAIM: CDT reclamado exitosamente:", claimResult)

    // ✅ USAR tx_hash en lugar de delivery_tx_hash
    const { error: updateError } = await supabase
      .from("cdt_purchases")
      .update({ 
        is_claimed: true, 
        claimed_at: new Date().toISOString(),
        tx_hash: claimResult.txHash  // ✅ Usar tx_hash para delivery
      })
      .eq("id", purchaseId)

    if (updateError) {
      console.error("❌ CDT CLAIM: Error al actualizar compra:", updateError)
      return NextResponse.json({ success: false, error: "Failed to update purchase" }, { status: 500 })
    }

    console.log("✅ CDT CLAIM: Compra actualizada exitosamente")

    // Actualizar el total_claimed del usuario
    console.log("📊 CDT CLAIM: Actualizando total_claimed del usuario")
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("total_claimed")
        .eq("id", user.id)
        .single()

      if (!userError && userData) {
        const currentTotal = userData.total_claimed || 0
        const newTotal = currentTotal + purchase.cdt_amount

        const { error: updateError } = await supabase
          .from("users")
          .update({ total_claimed: newTotal })
          .eq("id", user.id)

        if (updateError) {
          console.error("⚠️ CDT CLAIM: Error updating total_claimed:", updateError)
        } else {
          console.log(`✅ CDT CLAIM: Total claimed updated for user ${user.id}: ${currentTotal} -> ${newTotal}`)
        }
      }
    } catch (error) {
      console.error("⚠️ CDT CLAIM: Error updating user stats (no crítico):", error)
    }

    // ===== INICIO: CÓDIGO PARA RECOMPENSAS DE REFERIDOS =====
    try {
      // 1. Verificar si el usuario tiene un referente
      console.log("🔍 REFERRAL: Verificando si el usuario tiene referente...");
      const { data: referralData, error: referralError } = await supabase
        .from("referrals")
        .select("referrer_id, referrer_username")
        .eq("referred_id", user.id)
        .maybeSingle();

      if (referralError) {
        console.error("❌ REFERRAL: Error al buscar referente:", referralError);
      } 
      else if (referralData && referralData.referrer_id) {
        // 2. Calcular 1% de la recompensa
        const referralReward = purchase.cdt_amount * 0.01;
        console.log(`💰 REFERRAL: Calculando 1% de ${purchase.cdt_amount} = ${referralReward} CDT`);

        // 3. Obtener dirección del referente
        const referrerUser = await getUserByAddress(referralData.referrer_id);
        if (!referrerUser) {
          console.error("❌ REFERRAL: No se pudo obtener datos del referente");
        } else {
          // 4. Enviar recompensa al referente
          console.log(`💸 REFERRAL: Enviando ${referralReward} CDT al referente ${referralData.referrer_username}`);
          const referralSendResult = await sendRewards(referralData.referrer_id, referralReward);

          if (referralSendResult.success) {
            console.log(`✅ REFERRAL: Recompensa enviada exitosamente. Hash: ${referralSendResult.txHash}`);
            
            // 5. Registrar en la tabla referral_rewards
            const { error: rewardError } = await supabase.from("referral_rewards").insert({
              referrer_id: referralData.referrer_id,
              referred_id: user.id,
              claim_amount: purchase.cdt_amount,
              reward_amount: referralReward,
              tx_hash: referralSendResult.txHash,
              created_at: new Date().toISOString()
            });

            if (rewardError) {
              console.error("❌ REFERRAL: Error al registrar recompensa:", rewardError);
            } else {
              console.log("✅ REFERRAL: Recompensa registrada correctamente");
            }

            // 6. OPCIONAL: Registrar también en transactions para el referente
            try {
              const { error: txError } = await supabase.from("transactions").insert({
                user_id: referrerUser.id,
                wallet_address: referralData.referrer_id,
                type: "referral_reward",
                amount: referralReward,
                token_type: "CDT",
                tx_hash: referralSendResult.txHash,
                status: "success",
                description: `Recompensa por referido: ${user.username || user.address}`,
              });

              if (txError) {
                console.error("⚠️ REFERRAL: Error al registrar transacción (no crítico):", txError);
              } else {
                console.log("✅ REFERRAL: Transacción registrada para el referente");
              }
            } catch (txError) {
              console.error("⚠️ REFERRAL: Error al registrar transacción (no crítico):", txError);
            }

          } else {
            console.error("❌ REFERRAL: Error al enviar recompensa:", referralSendResult.error);
          }
        }
      } else {
        console.log("ℹ️ REFERRAL: El usuario no tiene referente");
      }
    } catch (referralError) {
      console.error("❌ REFERRAL: Error general en proceso de recompensa:", referralError);
      // No interrumpimos el flujo principal si falla la recompensa
    }
    // ===== FIN: CÓDIGO PARA RECOMPENSAS DE REFERIDOS =====

    console.log("✅ CDT CLAIM: CDT reclamado exitosamente")
    return NextResponse.json({
      success: true,
      message: "¡CDT reclamados correctamente!",
      cdtAmount: purchase.cdt_amount,
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