"use client"

import { useState, useEffect, useCallback } from "react"
import { useWorldAuth } from "next-world-auth/react"
import { Tokens } from "next-world-auth"
import Image from "next/image"
import Link from "next/link"
import { useTranslation } from "../../../src/components/TranslationProvider"

export default function Dashboard() {
  const { t } = useTranslation()
  const [stakedAmount, setStakedAmount] = useState(0)
  const [pendingRewards, setPendingRewards] = useState(0)
  const [lastClaimDate, setLastClaimDate] = useState<Date | null>(null)
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [username, setUsername] = useState("")
  const [cdtPrice, setCdtPrice] = useState<number | null>(null)

  // Estado para controlar si es la primera visita
  const [isFirstVisit, setIsFirstVisit] = useState(false)

  // Estados para los botones de prueba
  const [isSendingCDT, setIsSendingCDT] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null)

  // Estado para los botones con hover
  const [isBuyButtonHovered, setIsBuyButtonHovered] = useState(false)
  const [isDiscordHovered, setIsDiscordHovered] = useState(false)
  const [isSwapButtonHovered, setIsSwapButtonHovered] = useState(false)
  const [isTransactionsHovered, setIsTransactionsHovered] = useState(false)

  // Estados para mensajes de claim y update
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const { session, pay } = useWorldAuth()

  // Función para obtener un identificador único del usuario
  const getUserIdentifier = useCallback(() => {
    if (!session || !session.user || !session.user.walletAddress) return null
    return session.user.walletAddress
  }, [session])

  // Verificar si es la primera visita después de registrarse
  useEffect(() => {
    const checkFirstVisit = async () => {
      const identifier = getUserIdentifier()
      if (!identifier || !username) return

      const firstVisitKey = `tribo-first-visit-${identifier}`
      const hasVisitedBefore = localStorage.getItem(firstVisitKey)

      if (!hasVisitedBefore) {
        setIsFirstVisit(true)
        // Marcar como visitado para futuras sesiones
        localStorage.setItem(firstVisitKey, "true")
      }
    }

    if (username) {
      checkFirstVisit()
    }
  }, [username, getUserIdentifier])

  // Función para formatear el tiempo restante
  const formatTimeRemaining = useCallback(
    (targetDate: Date) => {
      const now = new Date()
      const diffMs = targetDate.getTime() - now.getTime()

      if (diffMs <= 0) {
        // Usar la clave "rewards_ready" para cuando las recompensas están listas
        return t("rewards_ready")
      }

      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000)

      return `${diffHrs.toString().padStart(2, "0")}:${diffMins.toString().padStart(2, "0")}:${diffSecs.toString().padStart(2, "0")}`
    },
    [t],
  )

  // Función para formatear fecha
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Función para obtener el precio del token
  const fetchTokenPrice = useCallback(async () => {
    try {
      const response = await fetch("/api/token-price")
      if (!response.ok) {
        throw new Error(t("error_updating"))
      }
      const data = await response.json()
      if (data.success) {
        setCdtPrice(data.price)
      } else {
        console.error("Error en la respuesta de la API:", data.error)
      }
    } catch (error) {
      console.error("Error al obtener el precio del token:", error)
    }
  }, [t])

  // Función para obtener datos de staking
  const fetchStakingData = useCallback(async () => {
    try {
      setIsLoading(true)

      const identifier = getUserIdentifier()
      if (!identifier) {
        console.error("No se pudo obtener identificador de usuario")
        return
      }

      const response = await fetch(`/api/staking?wallet_address=${identifier}`)

      if (!response.ok) {
        throw new Error(t("error_loading"))
      }

      const data = await response.json()

      setStakedAmount(data.staked_amount)
      setPendingRewards(data.pending_rewards)

      if (data.last_claim_timestamp) {
        const lastClaim = new Date(data.last_claim_timestamp)
        setLastClaimDate(lastClaim)

        // Calcular próximo claim (24h después del último)
        const nextClaim = new Date(lastClaim)
        nextClaim.setHours(nextClaim.getHours() + 24)
        setNextClaimTime(nextClaim)
      }

      // Obtener el username del usuario con la nueva API
      try {
        const usernameResponse = await fetch(`/api/username?wallet_address=${identifier}`)
        if (usernameResponse.ok) {
          const usernameData = await usernameResponse.json()
          if (usernameData.username) {
            setUsername(usernameData.username)
          }
        }
      } catch (error) {
        console.error("Error fetching username:", error)
      }

      // Obtener el precio del token
      await fetchTokenPrice()
    } catch (error) {
      console.error("Error fetching staking data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [getUserIdentifier, fetchTokenPrice, t])

  // Actualizar el contador cada segundo
  useEffect(() => {
    if (!nextClaimTime) return

    const updateTimer = () => {
      setTimeRemaining(formatTimeRemaining(nextClaimTime))
    }

    // Actualizar inmediatamente
    updateTimer()

    // Luego actualizar cada segundo
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [nextClaimTime, formatTimeRemaining])

  useEffect(() => {
    fetchStakingData()
  }, [fetchStakingData])

  const handleClaimRewards = useCallback(async () => {
    const identifier = getUserIdentifier()
    if (!identifier) return

    try {
      setIsClaiming(true)
      setClaimSuccess(null)
      setClaimError(null)

      const response = await fetch("/api/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet_address: identifier }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setClaimSuccess(data.message || t("rewards_claimed"))

        // Recargar datos después de reclamar
        fetchStakingData()
      } else {
        setClaimError(data.error || t("error_claiming"))
      }
    } catch (error) {
      console.error("Error claiming rewards:", error)
      setClaimError(error instanceof Error ? error.message : t("error_claiming"))
    } finally {
      setIsClaiming(false)
    }
  }, [getUserIdentifier, fetchStakingData, t])

  const handleUpdateStake = useCallback(async () => {
    const identifier = getUserIdentifier()
    if (!identifier) return

    try {
      setIsUpdating(true)
      setUpdateSuccess(null)
      setUpdateError(null)

      const response = await fetch("/api/update-stake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet_address: identifier }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUpdateSuccess(data.message || t("balance_updated"))

        // Recargar datos después de actualizar
        fetchStakingData()
      } else {
        setUpdateError(data.error || t("error_updating"))
      }
    } catch (error) {
      console.error("Error updating stake:", error)
      setUpdateError(error instanceof Error ? error.message : t("error_updating"))
    } finally {
      setIsUpdating(false)
    }
  }, [getUserIdentifier, fetchStakingData, t])

  // Función para enviar propina
  const handleSendCDT = async () => {
    setIsSendingCDT(true)
    setTxError(null)
    setTxHash(null)

    try {
      console.log("Intentando enviar propina de 0.023 WLD...")

      // Usar el método pay de World Auth
      const result = (await pay({
        amount: 0.023,
        token: Tokens.WLD,
        recipient: "0x8a89B684145849cc994be122ddEc5b268CAE0cB6",
      })) as { success?: boolean; txHash?: string; transactionHash?: string }

      console.log("Resultado completo de la transacción:", JSON.stringify(result, null, 2))

      // Verificación mejorada del éxito de la transacción
      const hasSuccess = result && result.success === true
      const hasHash = !!(result && (result.txHash || result.transactionHash))

      console.log("Verificación de transacción:", {
        hasSuccess,
        hasHash,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : null,
      })

      // SOLUCIÓN: Si tenemos un hash de transacción, SIEMPRE consideramos que fue exitosa
      // independientemente del campo success
      if (hasHash || hasSuccess) {
        // La transacción tiene un hash o success=true, lo que significa que se completó en la blockchain
        setTxHash(t("thanks_support"))

        // Registrar la transacción en la base de datos
        const identifier = getUserIdentifier()
        if (identifier) {
          try {
            const transactionHash =
              result.txHash || result.transactionHash || "0x" + Math.random().toString(16).substring(2, 10)

            console.log("Registrando transacción exitosa con hash:", transactionHash)

            // IMPORTANTE: Asegurarnos de que el status sea "success" explícitamente
            const response = await fetch("/api/transactions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                wallet_address: identifier,
                type: "support",
                amount: 0.023,
                token_type: "WLD",
                tx_hash: transactionHash,
                status: "success", // Asegurarnos de que esto sea "success"
                description: "Apoyo al proyecto Tribo Vault",
              }),
            })

            console.log("Respuesta al registrar transacción:", {
              status: response.status,
              ok: response.ok,
              statusText: response.statusText,
            })

            if (!response.ok) {
              console.error("Error al registrar transacción:", response.statusText)
              // No mostrar error al usuario si la transacción blockchain fue exitosa
            }
          } catch (error) {
            console.error("Error registering support transaction:", error)
            // No mostrar error al usuario si la transacción blockchain fue exitosa
          }
        }
      } else if (result && result.success === false) {
        // La transacción fue explícitamente rechazada
        setTxError("Transacción rechazada")
      } else {
        // No hay hash ni éxito explícito, probablemente fue cancelada
        setTxError("Transacción cancelada o no completada")
      }
    } catch (error) {
      console.error("Error al enviar propina:", error)
      setTxError(error instanceof Error ? error.message : t("error_sending"))
    } finally {
      setIsSendingCDT(false)
    }
  }

  // Calcular el valor estimado en USD
  const calculateUsdValue = () => {
    if (cdtPrice && stakedAmount) {
      return (cdtPrice * stakedAmount).toFixed(2)
    }
    return "0.00"
  }

  // Calcular las ganancias anuales estimadas
  const calculateYearlyEarnings = () => {
    // 0.1% diario durante 365 días con interés compuesto
    if (stakedAmount) {
      let amount = stakedAmount
      for (let i = 0; i < 365; i++) {
        amount += amount * 0.001 // 0.1% diario
      }
      return Math.round(amount - stakedAmount)
    }
    return 0
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ebd0a]"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Banner de bienvenida - Solo se muestra en la primera visita */}
      {isFirstVisit && (
        <div className="mb-6 bg-gradient-to-r from-[#4ebd0a]/20 to-black border-l-4 border-[#4ebd0a] p-4 rounded-md shadow-lg animate-fadeIn">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">
                {t("welcome")}, {username}! 🎉
              </h3>
              <p className="text-gray-300 mt-2">{t("how_works_desc")}</p>
              <div className="mt-3 flex gap-4">
                <button
                  onClick={handleUpdateStake}
                  className="px-4 py-2 bg-[#4ebd0a] hover:bg-[#4ebd0a]/80 text-black font-medium rounded-md transition-colors text-sm"
                >
                  {t("update_balance")}
                </button>
                <button
                  onClick={() => setIsFirstVisit(false)}
                  className="px-4 py-2 bg-transparent border border-gray-600 hover:bg-gray-800 text-white rounded-md transition-colors text-sm"
                >
                  {t("disconnect")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sección de usuario y saludo - Sin corona */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white">
          Tribo <span className="text-[#4ebd0a]">Vault</span>
        </h2>
        {username && (
          <p className="text-white text-xl mt-1">
            {t("hello")}, <span className="font-bold text-[#4ebd0a]">{username}</span>
          </p>
        )}
      </div>

      {/* Botón Buy CDT - Primero según la captura */}
      <div className="mb-6">
        <Link
          href={
            process.env.NEXT_PUBLIC_BUY_CDT_URL ||
            "https://world.org/mini-app?app_id=app_15daccf5b7d4ec9b7dbba044a8fdeab5"
          }
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-3 w-full px-6 py-4 rounded-md text-white font-medium text-lg transition-all duration-300 ${
            isBuyButtonHovered ? "bg-[#4ebd0a] shadow-lg transform -translate-y-1" : "bg-[#ff1744] hover:bg-[#ff2954]"
          }`}
          onMouseEnter={() => setIsBuyButtonHovered(true)}
          onMouseLeave={() => setIsBuyButtonHovered(false)}
          onTouchStart={() => setIsBuyButtonHovered(true)}
          onTouchEnd={() => setIsBuyButtonHovered(false)}
        >
          <Image src="/TOKEN CDT.png" alt="CDT Token" width={28} height={28} className="rounded-full" />
          <span className="font-bold">{t("buy_cdt")}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`ml-2 transition-transform duration-300 ${isBuyButtonHovered ? "translate-x-1" : ""}`}
          >
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </Link>
      </div>

      {/* Card de TRIBO Wallet - Con estadísticas adicionales */}
      <div className="mb-6 bg-black rounded-xl shadow-lg p-6 border border-gray-800">
        <div className="flex items-center mb-2">
          <Image src="/TRIBO Wallet sin fondo.png" alt="TRIBO Wallet" width={32} height={32} className="mr-3" />
          <h2 className="text-xl font-semibold text-[#4ebd0a]">{t("tribo_wallet")}</h2>
        </div>
        <p className="text-gray-400 text-sm mb-4">{t("tokens_staked")}</p>
        <p className="text-3xl font-bold mb-2 text-white">{stakedAmount.toLocaleString()} CDT</p>

        {/* Estadísticas adicionales */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-900/50 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">{t("estimated_value")}</p>
            <p className="text-lg font-semibold text-white">
              ${calculateUsdValue()} <span className="text-xs text-gray-400">USD</span>
            </p>
          </div>
          <div className="bg-gray-900/50 p-3 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">{t("yearly_earnings")}</p>
            <p className="text-lg font-semibold text-white">
              {calculateYearlyEarnings().toLocaleString()} <span className="text-xs text-gray-400">CDT</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400">{t("current_price")}</p>
            <p className="text-sm font-medium text-white">${cdtPrice?.toFixed(9) || "0.000000000"}</p>
          </div>
        </div>

        <button
          onClick={handleUpdateStake}
          disabled={isUpdating}
          className={`w-full px-4 py-2 rounded-md ${
            isUpdating ? "bg-gray-700 cursor-not-allowed" : "bg-black hover:bg-gray-900 border border-gray-700"
          } transition-colors`}
        >
          {isUpdating ? t("updating") : t("update_balance")}
        </button>

        {/* Mensaje de éxito para actualización de balance */}
        {updateSuccess && !updateError && !isUpdating && (
          <div className="mt-4 p-3 bg-black border border-[#4ebd0a] rounded-md">
            <p className="text-sm font-medium text-[#4ebd0a]">{updateSuccess}</p>
          </div>
        )}

        {/* Mensaje de error para actualización de balance */}
        {updateError && !isUpdating && (
          <div className="mt-4 p-3 bg-black border border-[#ff1744] rounded-md">
            <p className="text-sm font-medium text-[#ff1744]">{t("error_updating")}</p>
            <p className="text-xs mt-1 text-[#ff1744]">{updateError}</p>
          </div>
        )}
      </div>

      {/* SECCIÓN UNIFICADA: Próximo Claim simplificada - Ahora con fecha */}
      <div className="mb-6 bg-black rounded-xl shadow-lg p-6 border border-gray-800">
        <h2 className="text-xl font-semibold mb-4 text-center text-[#4ebd0a]">{t("next_claim")}</h2>

        {/* Countdown con barra */}
        {nextClaimTime ? (
          <>
            <div className="flex flex-col items-center mb-5">
              <div className="text-4xl font-mono font-bold mb-3 text-white">{timeRemaining}</div>
              {/* Fecha del próximo claim */}
              <div className="text-sm text-gray-400">
                {nextClaimTime ? formatDate(nextClaimTime) : "Fecha no disponible"}
              </div>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-3 mb-6">
              <div
                className="bg-[#4ebd0a] h-3 rounded-full"
                style={{
                  width: `${
                    nextClaimTime && lastClaimDate
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            100 - ((nextClaimTime.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)) * 100,
                          ),
                        )
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </>
        ) : (
          <p className="text-xl mb-6 text-center text-white">{t("no_claims_yet")}</p>
        )}

        {/* Cantidad a reclamar */}
        <div className="text-center mb-5">
          <p className="text-lg text-gray-300 mb-2">{t("available_rewards")}</p>
          <p className="text-4xl font-bold text-white">{pendingRewards.toLocaleString()} CDT</p>
        </div>

        {/* Botón de reclamar */}
        <button
          onClick={handleClaimRewards}
          disabled={isClaiming || pendingRewards <= 0}
          className={`w-full px-4 py-3 rounded-md ${
            isClaiming || pendingRewards <= 0 ? "bg-gray-700 cursor-not-allowed" : "bg-[#ff1744] hover:bg-[#ff2954]"
          } text-white font-medium transition-colors`}
        >
          {isClaiming ? t("claiming") : pendingRewards <= 0 ? t("no_rewards") : t("claim_rewards")}
        </button>

        {/* Mensajes de éxito/error para claim */}
        {claimSuccess && !claimError && !isClaiming && (
          <div className="mt-4 p-3 bg-black border border-[#4ebd0a] rounded-md">
            <p className="text-sm font-medium text-[#4ebd0a]">{claimSuccess}</p>
          </div>
        )}

        {claimError && !isClaiming && (
          <div className="mt-4 p-3 bg-black border border-[#ff1744] rounded-md">
            <p className="text-sm font-medium text-[#ff1744]">{t("error_claiming")}</p>
            <p className="text-xs mt-1 text-[#ff1744]">{claimError}</p>
          </div>
        )}
      </div>

      {/* NUEVO: Link a historial de transacciones */}
      <div className="mb-6">
        <Link
          href="/transactions"
          className={`flex items-center justify-center gap-3 w-full px-6 py-3 rounded-md text-white font-medium transition-all duration-300 ${
            isTransactionsHovered
              ? "bg-[#ff1744] shadow-lg transform -translate-y-1"
              : "bg-[#4ebd0a] hover:bg-[#3fa008]"
          }`}
          onMouseEnter={() => setIsTransactionsHovered(true)}
          onMouseLeave={() => setIsTransactionsHovered(false)}
          onTouchStart={() => setIsTransactionsHovered(true)}
          onTouchEnd={() => setIsTransactionsHovered(false)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          <span className="whitespace-nowrap">{t("view_transactions")}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${isTransactionsHovered ? "translate-x-1" : ""}`}
          >
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </Link>
      </div>

      {/* Botón de Discord - Corregido para que el texto no esté en dos líneas */}
      <div className="mb-6 flex items-center gap-4">
        <Image src="/Jefe Tribo Discord.png" alt="Discord" width={48} height={48} className="rounded-full" />
        <Link
          href={process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/tribo"}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-md text-white font-medium transition-all duration-300 ${
            isDiscordHovered ? "bg-[#5865F2] shadow-lg transform -translate-y-1" : "bg-[#5865F2]/80 hover:bg-[#5865F2]"
          }`}
          onMouseEnter={() => setIsDiscordHovered(true)}
          onMouseLeave={() => setIsDiscordHovered(false)}
          onTouchStart={() => setIsDiscordHovered(true)}
          onTouchEnd={() => setIsDiscordHovered(false)}
        >
          <span className="whitespace-nowrap">{t("join_community")}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${isDiscordHovered ? "translate-x-1" : ""}`}
          >
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </Link>
      </div>

      {/* NUEVO: Botón de Swap CDT */}
      <div className="mb-6">
        <Link
          href="https://world.org/mini-app?app_id=app_a4f7f3e62c1de0b9490a5260cb390b56"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center gap-3 w-full px-6 py-3 rounded-md text-white font-medium transition-all duration-300 ${
            isSwapButtonHovered
              ? "bg-[#4ebd0a] shadow-lg transform -translate-y-1"
              : "bg-[#ff1744]/80 hover:bg-[#ff1744]"
          }`}
          onMouseEnter={() => setIsSwapButtonHovered(true)}
          onMouseLeave={() => setIsSwapButtonHovered(false)}
          onTouchStart={() => setIsSwapButtonHovered(true)}
          onTouchEnd={() => setIsSwapButtonHovered(false)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 3h5v5"></path>
            <path d="M4 20 21 3"></path>
            <path d="M21 16v5h-5"></path>
            <path d="M15 15 3 3"></path>
          </svg>
          <span className="whitespace-nowrap">{t("swap_cdt")}</span>
          <Image src="/TOKEN CDT.png" alt="CDT Token" width={20} height={20} className="rounded-full" />
        </Link>
      </div>

      {/* Sección de propina - Movida al final */}
      <div className="mb-6">
        <div className="bg-black rounded-xl shadow-lg p-6 border border-gray-800">
          <h2 className="text-xl font-semibold mb-2 text-[#4ebd0a]">{t("support_project")}</h2>
          <p className="text-gray-400 text-sm mb-4">{t("support_help")}</p>
          <button
            onClick={handleSendCDT}
            disabled={isSendingCDT}
            className={`w-full px-4 py-3 rounded-md ${
              isSendingCDT ? "bg-gray-700 cursor-not-allowed" : "bg-[#ff1744] hover:bg-[#ff2954]"
            } text-white font-medium transition-colors`}
          >
            {isSendingCDT ? t("processing") : t("support_with")}
          </button>

          {txHash && !txError && isSendingCDT === false && (
            <div className="mt-4 p-3 bg-black border border-[#4ebd0a] rounded-md">
              <p className="text-sm font-medium text-[#4ebd0a]">{txHash}</p>
              <p className="text-xs mt-1 text-[#4ebd0a]">{t("reward_message")}</p>
            </div>
          )}

          {txError && isSendingCDT === false && (
            <div className="mt-4 p-3 bg-black border border-[#ff1744] rounded-md">
              <p className="text-sm font-medium text-[#ff1744]">{t("error_sending")}</p>
              <p className="text-xs mt-1 text-[#ff1744]">{txError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
