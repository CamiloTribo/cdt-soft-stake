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
  icon?: string
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
      dailyRate: 0.1,
      apy: 36.5,
      benefits: [t("base_rate_daily")],
    },
    {
      id: "cryptotribers",
      name: t("cryptotribers"),
      minAmount: 100000,
      maxAmount: 999999,
      color: "#C0C0C0",
      dailyRate: 0.11,
      apy: 40.15,
      benefits: [t("daily_rate_011"), t("access_exclusive_channels")],
    },
    {
      id: "millotribers",
      name: t("millotribers"),
      minAmount: 1000000,
      maxAmount: 9999999,
      color: "#FFD700",
      dailyRate: 0.12,
      apy: 43.8,
      benefits: [t("daily_rate_012"), t("access_special_discord")],
    },
    {
      id: "legendarytribers",
      name: t("legendarytribers"),
      minAmount: 10000000,
      maxAmount: null,
      color: "#B9F2FF",
      dailyRate: 0.13,
      apy: 47.45,
      benefits: [t("daily_rate_013"), t("exclusive_legend_benefits")],
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

// Función para sincronizar el nivel con Supabase
export async function syncUserLevel(address: string, stakedAmount: number) {
  // Esta función se llamará cuando:
  // 1. El usuario inicie sesión
  // 2. Se actualice el balance del usuario
  // 3. El usuario reclame recompensas

  try {
    const response = await fetch("/api/update-level", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address,
        staked_amount: stakedAmount,
      }),
    })

    if (!response.ok) {
      console.error("Error syncing user level")
    }

    return await response.json()
  } catch (error) {
    console.error("Error syncing user level:", error)
    return { success: false, error }
  }
}
