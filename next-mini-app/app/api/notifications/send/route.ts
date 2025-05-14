import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import {
  sendClaimReadyNotification,
  sendClaimReminderNotification,
  sendWorldNotification,
} from "@/src/lib/worldNotifications"

// Crear cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
)

export async function POST(request: NextRequest) {
  try {
    // Obtener datos de la solicitud
    const data = await request.json()
    const { type, walletAddress, customTitle, customMessage, path } = data

    // Si se proporciona una dirección de wallet específica, enviar solo a esa dirección
    if (walletAddress) {
      switch (type) {
        case "claim_ready":
          await sendClaimReadyNotification(walletAddress)
          break
        case "claim_reminder":
          await sendClaimReminderNotification(walletAddress)
          break
        case "custom":
          if (!customTitle || !customMessage) {
            return NextResponse.json(
              { success: false, error: "Se requiere título y mensaje personalizados" },
              { status: 400 },
            )
          }
          await sendWorldNotification([walletAddress], customTitle, customMessage, path || "/dashboard")
          break
        default:
          return NextResponse.json({ success: false, error: "Tipo de notificación no válido" }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: `Notificación de tipo ${type} enviada a ${walletAddress}`,
      })
    }

    // Si no se proporciona una dirección específica, enviar a todos los usuarios elegibles
    switch (type) {
      case "claim_ready":
        await sendClaimReadyNotifications()
        break
      case "claim_reminder":
        await sendClaimReminderNotifications()
        break
      default:
        return NextResponse.json({ success: false, error: "Tipo de notificación no válido" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Notificaciones de tipo ${type} enviadas a usuarios elegibles`,
    })
  } catch (error) {
    console.error("Error en la API de notificaciones:", error)
    return NextResponse.json({ success: false, error: "Error al enviar notificaciones" }, { status: 500 })
  }
}

/**
 * Envía notificaciones de claim disponible a todos los usuarios elegibles
 */
async function sendClaimReadyNotifications() {
  try {
    // Obtener la fecha actual menos 24 horas
    const oneDayAgo = new Date()
    oneDayAgo.setHours(oneDayAgo.getHours() - 24)

    // Obtener usuarios que no han reclamado en las últimas 24 horas
    const { data: users, error } = await supabase
      .from("staking_info")
      .select("wallet_address")
      .lt("last_claim_timestamp", oneDayAgo.toISOString())

    if (error) {
      throw error
    }

    if (!users || users.length === 0) {
      console.log("No hay usuarios elegibles para notificaciones de claim disponible")
      return
    }

    // Enviar notificaciones en lotes de 10 para evitar sobrecargar la API
    const batchSize = 10
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      const walletAddresses = batch.map((user) => user.wallet_address)

      await sendWorldNotification(
        walletAddresses,
        "¡Recompensas disponibles!",
        "Tus recompensas de CDT están listas para ser reclamadas. ¡Reclama ahora!",
        "/dashboard",
      )

      // Esperar un segundo entre lotes para evitar límites de tasa
      if (i + batchSize < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    console.log(`Notificaciones de claim disponible enviadas a ${users.length} usuarios`)
  } catch (error) {
    console.error("Error al enviar notificaciones de claim disponible:", error)
    throw error
  }
}

/**
 * Envía notificaciones de recordatorio de claim a todos los usuarios elegibles
 */
async function sendClaimReminderNotifications() {
  try {
    // Obtener la fecha actual menos 12 horas
    const twelveHoursAgo = new Date()
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12)

    // Obtener la fecha actual menos 13 horas (para evitar duplicados)
    const thirteenHoursAgo = new Date()
    thirteenHoursAgo.setHours(thirteenHoursAgo.getHours() - 13)

    // Obtener usuarios que reclamaron hace aproximadamente 12 horas
    const { data: users, error } = await supabase
      .from("staking_info")
      .select("wallet_address")
      .lt("last_claim_timestamp", thirteenHoursAgo.toISOString())
      .gt("last_claim_timestamp", twelveHoursAgo.toISOString())

    if (error) {
      throw error
    }

    if (!users || users.length === 0) {
      console.log("No hay usuarios elegibles para notificaciones de recordatorio de claim")
      return
    }

    // Enviar notificaciones en lotes de 10 para evitar sobrecargar la API
    const batchSize = 10
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      const walletAddresses = batch.map((user) => user.wallet_address)

      await sendWorldNotification(
        walletAddresses,
        "Recordatorio de recompensas",
        "Te quedan 12 horas para reclamar tus recompensas de CDT. ¡No te olvides!",
        "/dashboard",
      )

      // Esperar un segundo entre lotes para evitar límites de tasa
      if (i + batchSize < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    console.log(`Notificaciones de recordatorio de claim enviadas a ${users.length} usuarios`)
  } catch (error) {
    console.error("Error al enviar notificaciones de recordatorio de claim:", error)
    throw error
  }
}
