import { type NextRequest, NextResponse } from "next/server"
import { getUserByAddress } from "@/src/lib/supabase"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function POST(request: NextRequest) {
  try {
    console.log("🛒 CDT PURCHASE: Endpoint llamado")
    const { userId, username, wldAmount, cdtAmount, txHash } = await request.json()

    // Validar parámetros
    if (!userId || !wldAmount || !cdtAmount) {
      console.error("❌ CDT PURCHASE: Parámetros faltantes:", { userId, wldAmount, cdtAmount })
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Validar que los amounts sean números válidos
    if (typeof wldAmount !== "number" || wldAmount <= 0) {
      console.error("❌ CDT PURCHASE: WLD amount inválido:", wldAmount)
      return NextResponse.json({ error: "Invalid WLD amount" }, { status: 400 })
    }

    if (typeof cdtAmount !== "number" || cdtAmount <= 0) {
      console.error("❌ CDT PURCHASE: CDT amount inválido:", cdtAmount)
      return NextResponse.json({ error: "Invalid CDT amount" }, { status: 400 })
    }

    // Validar txHash si se proporciona
    if (txHash && (typeof txHash !== "string" || txHash.length < 10)) {
      console.error("❌ CDT PURCHASE: TxHash inválido:", txHash)
      return NextResponse.json({ error: "Invalid transaction hash" }, { status: 400 })
    }

    // Buscar al usuario usando la función helper
    console.log("🔍 CDT PURCHASE: Buscando usuario con address:", userId)
    const user = await getUserByAddress(userId)

    if (!user) {
      console.error("❌ CDT PURCHASE: Usuario no encontrado")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log("✅ CDT PURCHASE: Usuario encontrado:", user)

    // Verificar si ya existe una compra pendiente para este usuario
    const { data: existingPurchase, error: existingError } = await supabase
      .from("cdt_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("is_claimed", false)
      .maybeSingle()

    if (existingError) {
      console.error("❌ CDT PURCHASE: Error verificando compras existentes:", existingError)
      return NextResponse.json({ error: "Failed to verify existing purchases" }, { status: 500 })
    }

    if (existingPurchase) {
      console.error("❌ CDT PURCHASE: Usuario ya tiene una compra pendiente")
      return NextResponse.json({ error: "User already has a pending purchase" }, { status: 400 })
    }

    // Registrar la compra de CDT
    console.log("🛒 CDT PURCHASE: Registrando compra de CDT")
    const { data: purchase, error: purchaseError } = await supabase
      .from("cdt_purchases")
      .insert({
        user_id: userId,
        username: username || user.username || "",
        wld_amount: wldAmount,
        cdt_amount: cdtAmount,
        tx_hash: txHash || "",
        is_claimed: false,
        purchased_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (purchaseError) {
      console.error("❌ CDT PURCHASE: Error al crear compra:", purchaseError)
      return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 })
    }

    console.log("✅ CDT PURCHASE: Compra creada exitosamente:", purchase)

    // Registrar la transacción usando user.id
    try {
      const { error: txError } = await supabase.from("transactions").insert([
        {
          user_id: user.id,
          wallet_address: userId,
          username: username || user.username || "",
          type: "purchase",
          amount: wldAmount,
          token_type: "WLD",
          tx_hash: txHash || "",
          status: "success",
          description: `Compra de ${cdtAmount} CDT por ${wldAmount} WLD`,
        },
      ])

      if (txError) {
        console.error("⚠️ CDT PURCHASE: Error al registrar transacción (no crítico):", txError)
      }
    } catch (error) {
      console.error("⚠️ CDT PURCHASE: Error al registrar transacción (no crítico):", error)
    }

    // Actualizar estadísticas del usuario (total_purchased)
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("total_purchased")
        .eq("id", user.id)
        .single()

      if (!userError && userData) {
        const currentTotal = userData.total_purchased || 0
        const newTotal = currentTotal + wldAmount

        const { error: updateError } = await supabase
          .from("users")
          .update({ total_purchased: newTotal })
          .eq("id", user.id)

        if (updateError) {
          console.error("⚠️ CDT PURCHASE: Error updating total_purchased:", updateError)
        } else {
          console.log(`Total purchased updated for user ${user.id}: ${currentTotal} -> ${newTotal}`)
        }
      }
    } catch (error) {
      console.error("⚠️ CDT PURCHASE: Error updating user stats (no crítico):", error)
    }

    console.log("✅ CDT PURCHASE: Compra completada exitosamente")
    return NextResponse.json({
      success: true,
      purchaseId: purchase.id,
      message: `Successfully purchased ${cdtAmount} CDT for ${wldAmount} WLD`,
    })
  } catch (error) {
    console.error("❌ CDT PURCHASE: Error general:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}