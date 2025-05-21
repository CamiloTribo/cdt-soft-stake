// src/lib/levels.ts

export interface StakingLevel {
  id: string
  name: string
  minAmount: number
  maxAmount: number | null
  color: string
  dailyRate: number
  apy: number
  benefits: string[]
  imageUrl: string // Añadida propiedad para la imagen
  bgColor: string // Añadido color de fondo para combinar con la imagen
}

// Definición de niveles (usamos funciones para permitir traducciones)
export function getStakingLevels(t: (key: string) => string): StakingLevel[] {
  return [
    {
      id: "tribers",
      name: t("tribers"),
      minAmount: 0,
      maxAmount: 99999,
      color: "#4ebd0a",
      bgColor: "#ffb1b1", // Color rosa similar al fondo de la imagen
      dailyRate: 0.1,
      apy: 36.5,
      benefits: [t("base_rate_daily")],
      imageUrl: "/levels/level-1.png",
    },
    {
      id: "cryptotribers",
      name: t("cryptotribers"),
      minAmount: 100000,
      maxAmount: 999999,
      color: "#4ebd0a", // Cambiado a verde para combinar con la imagen
      bgColor: "#4ebd0a", // Color verde similar al fondo de la imagen
      dailyRate: 0.11,
      apy: 40.15,
      benefits: [t("daily_rate_011"), t("access_exclusive_channels")],
      imageUrl: "/levels/level-2.png",
    },
    {
      id: "millotribers",
      name: t("millotribers"),
      minAmount: 1000000,
      maxAmount: 9999999,
      color: "#FFD700",
      bgColor: "#ff9d42", // Color naranja similar al fondo de la imagen
      dailyRate: 0.12,
      apy: 43.8,
      benefits: [t("daily_rate_012"), t("access_special_discord")],
      imageUrl: "/levels/level-3.png",
    },
    {
      id: "legendarytribers",
      name: t("legendarytribers"),
      minAmount: 10000000,
      maxAmount: null,
      color: "#FFD700", // Cambiado a dorado para combinar con la imagen
      bgColor: "#ffc107", // Color dorado similar al fondo de la imagen
      dailyRate: 0.13,
      apy: 47.45,
      benefits: [t("daily_rate_013"), t("exclusive_legend_benefits")],
      imageUrl: "/levels/level-4.png",
    },
  ]
}

// Función para obtener el nivel de un usuario
export function getUserLevel(stakedAmount: number, t: (key: string) => string): StakingLevel {
  const levels = getStakingLevels(t)
  for (let i = levels.length - 1; i >= 0; i--) {
    if (stakedAmount >= levels[i].minAmount) {
      return levels[i]
    }
  }
  return levels[0] // Nivel por defecto
}

// Función para obtener el siguiente nivel
export function getNextLevel(stakedAmount: number, t: (key: string) => string): StakingLevel | null {
  const levels = getStakingLevels(t)
  for (let i = 0; i < levels.length - 1; i++) {
    if (stakedAmount >= levels[i].minAmount && stakedAmount < levels[i + 1].minAmount) {
      return levels[i + 1]
    }
  }
  return null // No hay siguiente nivel
}

// Función para calcular el progreso hacia el siguiente nivel
export function getProgressToNextLevel(stakedAmount: number, t: (key: string) => string): number {
  const currentLevel = getUserLevel(stakedAmount, t)
  const nextLevel = getNextLevel(stakedAmount, t)

  if (!nextLevel) return 100 // Ya está en el nivel máximo

  const totalRange = nextLevel.minAmount - currentLevel.minAmount
  const currentProgress = stakedAmount - currentLevel.minAmount

  return Math.min(100, Math.floor((currentProgress / totalRange) * 100))
}

// Función para obtener la tasa diaria según el nivel
export function getDailyRateForAmount(stakedAmount: number, t: (key: string) => string): number {
  const level = getUserLevel(stakedAmount, t)
  return level.dailyRate
}

// Función de utilidad para reintentos
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Intento ${attempt} para ${url}`)
      const response = await fetch(url, options)
      if (response.ok) return response
      lastError = new Error(`HTTP error ${response.status}: ${response.statusText}`)
    } catch (error) {
      console.warn(`Intento ${attempt} falló:`, error)
      lastError = error

      // Esperar antes de reintentar (backoff exponencial)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// Función para sincronizar el nivel con Supabase
export async function syncUserLevel(address: string, stakedAmount: number) {
  // Esta función se llamará cuando:
  // 1. El usuario inicie sesión
  // 2. Se actualice el balance del usuario
  // 3. El usuario reclame recompensas

  try {
    // Construir URL absoluta
    const baseUrl = "https://tribo-vault.vercel.app"
    const updateLevelUrl = `${baseUrl}/api/update-level`

    // Usar fetchWithRetry para manejar fallos temporales
    const response = await fetchWithRetry(
      updateLevelUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          staked_amount: stakedAmount,
        }),
      },
      3,
    ) // 3 intentos máximo

    return await response.json()
  } catch (error) {
    console.error("Error syncing user level:", error)
    return { success: false, error }
  }
}
