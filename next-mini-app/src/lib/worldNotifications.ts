/**
 * Biblioteca de utilidades para enviar notificaciones a través de la API de World App
 */

/**
 * Envía una notificación a una o varias direcciones de wallet
 * @param walletAddresses Array de direcciones de wallet a las que enviar la notificación
 * @param title Título de la notificación
 * @param message Mensaje de la notificación
 * @param path Ruta dentro de la mini app a la que dirigir al usuario al tocar la notificación
 * @returns Respuesta de la API de World App
 */
export async function sendWorldNotification(walletAddresses: string[], title: string, message: string, path = "/") {
  try {
    // Verificar que tenemos la API key
    if (!process.env.WORLD_DEVELOPER_API_KEY) {
      throw new Error("WORLD_DEVELOPER_API_KEY no está definida en las variables de entorno")
    }

    // Verificar que tenemos direcciones de wallet
    if (!walletAddresses || walletAddresses.length === 0) {
      throw new Error("No se proporcionaron direcciones de wallet")
    }

    // Preparar la URL de la API
    const apiUrl = "https://developer.worldcoin.org/api/v1/notifications"

    // Preparar los datos de la notificación
    const notificationData = {
      wallet_addresses: walletAddresses.join(","),
      title: title,
      message: message,
      mini_app_path: path,
    }

    console.log("Enviando notificación:", notificationData)

    // Enviar la notificación
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WORLD_DEVELOPER_API_KEY}`,
      },
      body: JSON.stringify(notificationData),
    })

    // Verificar la respuesta
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Error al enviar notificación: ${JSON.stringify(errorData)}`)
    }

    // Devolver la respuesta
    return await response.json()
  } catch (error) {
    console.error("Error en sendWorldNotification:", error)
    throw error
  }
}

/**
 * Envía una notificación de claim disponible a una dirección de wallet
 * @param walletAddress Dirección de wallet a la que enviar la notificación
 * @returns Respuesta de la API de World App
 */
export async function sendClaimReadyNotification(walletAddress: string) {
  return sendWorldNotification(
    [walletAddress],
    "¡Recompensas disponibles!",
    "Tus recompensas de CDT están listas para ser reclamadas. ¡Reclama ahora!",
    "/dashboard",
  )
}

/**
 * Envía una notificación de recordatorio de claim a una dirección de wallet
 * @param walletAddress Dirección de wallet a la que enviar la notificación
 * @returns Respuesta de la API de World App
 */
export async function sendClaimReminderNotification(walletAddress: string) {
  return sendWorldNotification(
    [walletAddress],
    "Recordatorio de recompensas",
    "Te quedan 12 horas para reclamar tus recompensas de CDT. ¡No te olvides!",
    "/dashboard",
  )
}
