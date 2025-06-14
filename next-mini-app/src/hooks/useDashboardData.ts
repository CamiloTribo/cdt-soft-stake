"use client"

import { useState, useEffect, useCallback } from "react"
import { useWorldAuth } from "next-world-auth/react"
import { useTranslation } from "../../src/components/TranslationProvider"
import { getPendingCdtPurchases, getCdtPurchaseStats } from "@/src/lib/supabase" // ✅ Importar funciones
import { type CdtPurchase } from "@/src/lib/supabase" // ✅ Importar tipo CdtPurchase

export const useDashboardData = () => {
  const { t } = useTranslation()
  const [stakedAmount, setStakedAmount] = useState(0)
  const [pendingRewards, setPendingRewards] = useState(0)
  const [lastClaimDate, setLastClaimDate] = useState<Date | null>(null)
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [cdtPrice, setCdtPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<{ isPositive: boolean }>({
    isPositive: true,
  })
  const [totalClaimed, setTotalClaimed] = useState(0)
  const [country, setCountry] = useState("")
  const [realtimeRewards, setRealtimeRewards] = useState(0)
  // NUEVO: Estado para boosts
  const [hasBoost, setHasBoost] = useState(false)
  const [availableBoosts, setAvailableBoosts] = useState(0)
  // ✅ NUEVO: Estado para compras CDT
  const [pendingCdtPurchases, setPendingCdtPurchases] = useState<CdtPurchase[]>([]) // ✅ Tipo especificado
  const [cdtPurchaseStats, setCdtPurchaseStats] = useState({
    totalPurchases: 0,
    totalWldSpent: 0,
    totalCdtPurchased: 0,
    pendingClaims: 0,
  })

  const { session } = useWorldAuth()
  const translationValues = useTranslation()
  const { t: translation } = translationValues

  // Función para obtener un identificador único del usuario
  const getUserIdentifier = useCallback(() => {
    if (!session || !session.user || !session.user.walletAddress) return null
    return session.user.walletAddress
  }, [session])

  // Función para calcular el nivel basado en el staked amount
  const getUserLevel = useCallback(() => {
    if (stakedAmount >= 10000000) return 3
    if (stakedAmount >= 1000000) return 2
    if (stakedAmount >= 100000) return 1
    return 0
  }, [stakedAmount])

  // NUEVA: Función para verificar boosts disponibles
  const fetchBoostData = useCallback(async () => {
    try {
      const identifier = getUserIdentifier()
      if (!identifier) return

      const baseUrl = "https://tribo-vault.vercel.app"
      const response = await fetch(`${baseUrl}/api/boosts/available?wallet_address=${identifier}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAvailableBoosts(data.available_boosts || 0)
          setHasBoost(data.available_boosts > 0)
        }
      }
    } catch (error) {
      console.error("Error fetching boost data:", error)
      setHasBoost(false)
      setAvailableBoosts(0)
    }
  }, [getUserIdentifier])

  // NUEVA: Función para registrar la compra de boosts después del pago con WLD
  const registerBoostPurchase = useCallback(async (quantity: number): Promise<boolean> => {
    try {
      const identifier = getUserIdentifier()
      if (!identifier) return false

      console.log("🚀 Registrando compra de boost:", quantity)
      
      // Obtener el nivel actual del usuario
      const level = getUserLevel()
      
      const response = await fetch("/api/boosts/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: identifier,
          quantity,
          level // ✅ Añadir el nivel del usuario
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        console.log("✅ Compra de boost registrada con éxito")
        // Actualizar el estado local de boosts
        await fetchBoostData()
        return true
      } else {
        console.error("❌ Error al registrar la compra de boost:", data.error)
        return false
      }
    } catch (error) {
      console.error("Error en registerBoostPurchase:", error)
      return false
    }
  }, [getUserIdentifier, getUserLevel, fetchBoostData])

  // Función para formatear el tiempo restante
  const formatTimeRemaining = useCallback(
    (targetDate: Date) => {
      const now = new Date()
      const diffMs = targetDate.getTime() - now.getTime()

      if (diffMs <= 0) {
        return translation("rewards_ready")
      }

      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000)

      return `${diffHrs.toString().padStart(2, "0")}:${diffMins.toString().padStart(2, "0")}:${diffSecs.toString().padStart(2, "0")}`
    },
    [translation],
  )

  // Función para formatear fecha
  const formatDate = (date: Date) => {
    const day = date.toLocaleDateString("es-ES", { day: "2-digit" })
    const month = date.toLocaleDateString("es-ES", { month: "2-digit" })
    const year = date.toLocaleDateString("es-ES", { year: "numeric" })
    const hour = date.toLocaleTimeString("es-ES", { hour: "2-digit", hour12: false })
    const minute = date.toLocaleTimeString("es-ES", { minute: "2-digit" })

    return `${day}/${month}/${year} ${hour}:${minute}`
  }

  // Función para calcular recompensas en tiempo real
  const calculateRealtimeRewards = useCallback(() => {
    if (!lastClaimDate || !stakedAmount) return 0

    const now = new Date()
    const elapsedMs = now.getTime() - lastClaimDate.getTime()
    const dayFraction = elapsedMs / (24 * 60 * 60 * 1000)

    // Si ya pasó el tiempo de claim (24h), mostrar las recompensas completas
    if (nextClaimTime && now >= nextClaimTime) {
      return pendingRewards
    }

    // Calcular recompensas acumuladas (0.1% diario)
    // Añadir milisegundos para crear un efecto de incremento continuo
    const millisecondFraction = (now.getMilliseconds() / 1000) * 0.000001 * stakedAmount
    return stakedAmount * 0.001 * dayFraction + millisecondFraction
  }, [lastClaimDate, stakedAmount, pendingRewards, nextClaimTime])

  // Función para obtener el precio del token
  const fetchTokenPrice = useCallback(async () => {
    try {
      console.log("Obteniendo precio del token en vivo...")
      const baseUrl = "https://tribo-vault.vercel.app"
      const response = await fetch(`${baseUrl}/api/token-price`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(t("error_updating"))
      }

      const data = await response.json()

      if (data.success) {
        const newPrice = data.price

        if (cdtPrice !== null) {
          setCdtPrice(newPrice)
          setPriceChange({
            isPositive: newPrice >= cdtPrice,
          })
        } else {
          setCdtPrice(newPrice)
          setPriceChange({
            isPositive: true,
          })
        }
      } else {
        console.error("Error en la respuesta de la API:", data.error)
      }
    } catch (error) {
      console.error("Error al obtener el precio del token:", error)
    }
  }, [t, cdtPrice])

  // Función optimizada para obtener datos de staking
  const fetchStakingData = useCallback(async () => {
    try {
      const identifier = getUserIdentifier()
      if (!identifier) {
        console.error("No se pudo obtener identificador de usuario")
        return
      }

      const timestamp = Date.now()
      const baseUrl = "https://tribo-vault.vercel.app"
      const response = await fetch(`${baseUrl}/api/staking?wallet_address=${identifier}&_t=${timestamp}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(t("error_loading"))
      }

      const data = await response.json()

      setStakedAmount(data.staked_amount)

      if (data.pending_rewards !== pendingRewards) {
        setPendingRewards(data.pending_rewards)
      }

      if (data.last_claim_timestamp) {
        const lastClaim = new Date(data.last_claim_timestamp)
        if (!lastClaimDate || lastClaim.getTime() !== lastClaimDate.getTime()) {
          setLastClaimDate(lastClaim)

          const nextClaim = new Date(lastClaim)
          nextClaim.setHours(nextClaim.getHours() + 24)
          setNextClaimTime(nextClaim)
        }
      }

      if (!username) {
        try {
          const usernameResponse = await fetch(`${baseUrl}/api/username?wallet_address=${identifier}`)
          if (usernameResponse.ok) {
            const usernameData = await usernameResponse.json()
            if (usernameData.username && usernameData.username !== username) {
              setUsername(usernameData.username)
              setTotalClaimed(usernameData.total_claimed || 0)
              if (usernameData.country) {
                setCountry(usernameData.country)
              }
            }
          }
        } catch (error) {
          console.error("Error fetching username:", error)
        }
      }

      // NUEVO: Obtener datos de boosts después de obtener datos de staking
      await fetchBoostData()
    } catch (error) {
      console.error("Error fetching staking data:", error)
    }
  }, [getUserIdentifier, t, pendingRewards, lastClaimDate, username, fetchBoostData])

  // ✅ NUEVO: Función para obtener datos de compras CDT
  const fetchCdtPurchaseData = useCallback(async () => {
    try {
      const identifier = getUserIdentifier()
      if (!identifier) {
        console.error("No se pudo obtener identificador de usuario")
        return
      }

      // Obtener compras pendientes
      const pendingPurchases = await getPendingCdtPurchases(identifier)
      setPendingCdtPurchases(pendingPurchases)

      // Obtener estadísticas de compras
      const stats = await getCdtPurchaseStats(identifier)
      setCdtPurchaseStats(stats)
    } catch (error) {
      console.error("Error fetching CDT purchase data:", error)
    }
  }, [getUserIdentifier])

  // Actualizar el contador cada segundo
  useEffect(() => {
    if (!nextClaimTime) return

    const updateTimer = () => {
      setTimeRemaining(formatTimeRemaining(nextClaimTime))
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [nextClaimTime, formatTimeRemaining])

  // Actualizar las recompensas en tiempo real
  useEffect(() => {
    if (!lastClaimDate) return

    const updateRealtimeRewards = () => {
      setRealtimeRewards(calculateRealtimeRewards())
    }

    updateRealtimeRewards()
    const interval = setInterval(updateRealtimeRewards, 1000)
    return () => clearInterval(interval)
  }, [lastClaimDate, calculateRealtimeRewards])

  // Cargar datos iniciales y configurar actualizaciones automáticas
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    const loadInitialData = async () => {
      try {
        await fetchStakingData()
        await fetchTokenPrice()
        await fetchCdtPurchaseData() // ✅ Cargar datos de compras CDT
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInitialData()

    const handleFocus = () => {
      fetchStakingData()
      fetchTokenPrice()
      fetchCdtPurchaseData() // ✅ Actualizar datos de compras CDT
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchStakingData()
        fetchTokenPrice()
        fetchCdtPurchaseData() // ✅ Actualizar datos de compras CDT
      }
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    const interval = setInterval(() => {
      fetchStakingData()
      fetchTokenPrice()
      fetchCdtPurchaseData() // ✅ Actualizar datos de compras CDT
    }, 10000)

    return () => {
      isMounted = false
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      clearInterval(interval)
    }
  }, [fetchStakingData, fetchTokenPrice, fetchCdtPurchaseData])

  // Verificar si las recompensas están disponibles para reclamar
  const areRewardsClaimable = nextClaimTime ? new Date() >= nextClaimTime : false

  // Calcular el valor estimado en USD
  const calculateUsdValue = (amount: number) => {
    if (cdtPrice && amount) {
      return (cdtPrice * amount).toFixed(2)
    }
    return "0.00"
  }

  return {
    stakedAmount,
    pendingRewards,
    lastClaimDate,
    nextClaimTime,
    timeRemaining,
    isLoading,
    username,
    cdtPrice,
    priceChange,
    totalClaimed,
    country,
    realtimeRewards,
    areRewardsClaimable,
    // NUEVOS: Datos de boost
    hasBoost,
    availableBoosts,
    getUserIdentifier,
    getUserLevel, // ✅ Exportar la función de nivel
    formatTimeRemaining,
    formatDate,
    calculateRealtimeRewards,
    fetchTokenPrice,
    fetchStakingData,
    fetchBoostData, // NUEVA función para actualizar boosts
    registerBoostPurchase, // NUEVA función para registrar compras de boosts
    calculateUsdValue,
    // ✅ NUEVOS: Datos de compras CDT
    pendingCdtPurchases,
    cdtPurchaseStats,
  }
}