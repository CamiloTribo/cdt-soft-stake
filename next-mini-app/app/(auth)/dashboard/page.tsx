"use client"

import React, { useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useWorldAuth } from "next-world-auth/react"
import { Tokens } from "next-world-auth"
import { useTranslation } from "../../../src/components/TranslationProvider"
import CdtRain from "../../../src/components/CdtRain"
import CdtButtonRain from "../../../src/components/CdtButtonRain"
import { CountryFlag } from "../../../src/components/CountryFlag"
import { useDashboardData } from "../../../src/hooks/useDashboardData"

// Componentes optimizados
import { ClaimSection } from "../../../src/components/dashboard/ClaimSection"
import { WalletCard } from "../../../src/components/dashboard/WalletCard"
import { SocialLinks } from "../../../src/components/dashboard/SocialLinks"
import { SupportSection } from "../../../src/components/dashboard/SupportSection"
import { CountryModal } from "../../../src/components/dashboard/CountryModal"
import { WelcomeGiftModal } from "../../../src/components/dashboard/WelcomeGiftModal"

// Función para obtener la URL de swap
function getSwapUrl() {
  return process.env.NEXT_PUBLIC_BUY_CDT_URL || "https://app.uniswap.org/#/swap"
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { pay, session } = useWorldAuth()

  // Estados de UI
  const [isFirstVisit, setIsFirstVisit] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSendingCDT, setIsSendingCDT] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txError, setTxError] = useState<string | null>(null)
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [showCdtRain, setShowCdtRain] = useState(false)
  const [showWelcomeGift, setShowWelcomeGift] = useState(false)
  const [isClaimingWelcomeGift, setIsClaimingWelcomeGift] = useState(false)
  const [welcomeGiftError, setWelcomeGiftError] = useState<string | null>(null)
  const [showCountryModal, setShowCountryModal] = useState(false)
  const [isUpdatingCountry, setIsUpdatingCountry] = useState(false)
  const [countryUpdateError, setCountryUpdateError] = useState<string | null>(null)

  // Estados para hover
  const [isDiscordHovered, setIsDiscordHovered] = useState(false)
  const [isProfileHovered, setIsProfileHovered] = useState(false)
  const [isDailyGiveawayHovered, setIsDailyGiveawayHovered] = useState(false)
  const [isWebsiteHovered, setIsWebsiteHovered] = useState(false)
  const [isTelegramHovered, setIsTelegramHovered] = useState(false)
  const [isTwitterHovered, setIsTwitterHovered] = useState(false)

  // Obtener datos del dashboard usando el hook personalizado
  const {
    stakedAmount,
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
    getUserIdentifier,
    formatDate,
    fetchStakingData,
    calculateUsdValue,
  } = useDashboardData()

  // Verificar si es la primera visita después de registrarse
  React.useEffect(() => {
    const checkFirstVisit = async () => {
      const identifier = getUserIdentifier()
      if (!identifier || !username) return

      const firstVisitKey = `tribo-first-visit-${identifier}`
      const hasVisitedBefore = localStorage.getItem(firstVisitKey)

      if (!hasVisitedBefore) {
        setIsFirstVisit(true)
        localStorage.setItem(firstVisitKey, "true")
      }
    }

    if (username) {
      checkFirstVisit()
    }
  }, [username, getUserIdentifier])

  // Verificar regalo de bienvenida
  React.useEffect(() => {
    const checkWelcomeGift = async () => {
      const identifier = getUserIdentifier()
      if (!identifier) return

      const giftCheckKey = `tribo-welcome-gift-check-${identifier}`
      const hasCheckedGift = localStorage.getItem(giftCheckKey)

      if (hasCheckedGift) {
        const giftClaimedKey = `tribo-welcome-gift-claimed-${identifier}`
        const hasClaimedGift = localStorage.getItem(giftClaimedKey)
        if (hasClaimedGift) {
          return
        }
      }

      try {
        const response = await fetch(`/api/welcome-gift?wallet_address=${identifier}`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (response.ok) {
          const data = await response.json()
          localStorage.setItem(giftCheckKey, "true")

          if (data.claimed) {
            localStorage.setItem(`tribo-welcome-gift-claimed-${identifier}`, "true")
          } else {
            setShowWelcomeGift(true)
          }
        }
      } catch (error) {
        console.error("Error checking welcome gift:", error)
        setShowWelcomeGift(true)
      }
    }

    if (session && username) {
      checkWelcomeGift()
    }
  }, [session, username, getUserIdentifier])

  // Verificar selección de país
  React.useEffect(() => {
    const checkCountrySelection = async () => {
      const identifier = getUserIdentifier()
      if (!identifier) return

      if (country) {
        return
      }

      setShowCountryModal(true)
    }

    if (session && username) {
      checkCountrySelection()
    }
  }, [session, username, country, getUserIdentifier])

  // Handlers
  const handleSaveCountry = async (selectedCountry: string) => {
    const identifier = getUserIdentifier()
    if (!identifier) return

    try {
      setIsUpdatingCountry(true)
      setCountryUpdateError(null)

      const response = await fetch("/api/update-country", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: identifier,
          country: selectedCountry,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const countryModalKey = `tribo-country-modal-${identifier}`
        localStorage.setItem(countryModalKey, "true")
        setShowCountryModal(false)
      } else {
        setCountryUpdateError(data.error || t("error_updating_country"))
      }
    } catch (error) {
      console.error("Error updating country:", error)
      setCountryUpdateError(t("error_updating_country"))
    } finally {
      setIsUpdatingCountry(false)
    }
  }

  const handleClaimRewards = useCallback(async () => {
    const identifier = getUserIdentifier()
    if (!identifier) return

    try {
      await fetchStakingData()

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
        setShowCdtRain(true)

        setTimeout(() => {
          setShowCdtRain(false)
        }, 5000)

        if (data.amount) {
          // Actualizar el total_claimed si la API devuelve la cantidad reclamada
        }

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

  const handleClaimWelcomeGift = async () => {
    const identifier = getUserIdentifier()
    if (!identifier) return

    try {
      setIsClaimingWelcomeGift(true)
      setWelcomeGiftError(null)

      const response = await fetch("/api/welcome-gift", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wallet_address: identifier }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        localStorage.setItem(`tribo-welcome-gift-claimed-${identifier}`, "true")
        setShowWelcomeGift(false)
        setShowCdtRain(true)

        setTimeout(() => {
          setShowCdtRain(false)
        }, 5000)

        setTimeout(() => {
          fetchStakingData()
        }, 3000)
      } else {
        setWelcomeGiftError(data.error || t("welcome_gift_error"))
      }
    } catch (error) {
      console.error("Error claiming welcome gift:", error)
      setWelcomeGiftError(error instanceof Error ? error.message : t("welcome_gift_error"))
    } finally {
      setIsClaimingWelcomeGift(false)
    }
  }

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

  const handleSendCDT = async () => {
    setIsSendingCDT(true)
    setTxError(null)
    setTxHash(null)

    try {
      const result = (await pay({
        amount: 0.23,
        token: Tokens.WLD,
        recipient: "0x8a89B684145849cc994be122ddEc5b268CAE0cB6",
      })) as { success?: boolean; txHash?: string; transactionHash?: string }

      const hasSuccess = result && result.success === true
      const hasHash = !!(result && (result.txHash || result.transactionHash))

      if (hasHash || hasSuccess) {
        setTxHash(t("thanks_support"))

        const identifier = getUserIdentifier()
        if (identifier) {
          try {
            const transactionHash =
              result.txHash || result.transactionHash || "0x" + Math.random().toString(16).substring(2, 10)

            const response = await fetch("/api/transactions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                wallet_address: identifier,
                type: "support",
                amount: 0.23,
                token_type: "WLD",
                tx_hash: transactionHash,
                status: "success",
                description: "Apoyo al proyecto Tribo Vault",
              }),
            })

            if (!response.ok) {
              console.error("Error al registrar transacción:", response.statusText)
            }
          } catch (error) {
            console.error("Error registering support transaction:", error)
          }
        }
      } else if (result && result.success === false) {
        setTxError(t("transaction_rejected"))
      } else {
        setTxError(t("transaction_cancelled"))
      }
    } catch (error) {
      console.error("Error al enviar propina:", error)
      setTxError(error instanceof Error ? error.message : t("error_sending"))
    } finally {
      setIsSendingCDT(false)
    }
  }

  const handleCloseCountryModal = () => {
    const identifier = getUserIdentifier()
    if (identifier) {
      localStorage.setItem(`tribo-country-modal-${identifier}`, "true")
    }
    setShowCountryModal(false)
  }

  // URL del topic de sorteos en Telegram
  const telegramGiveawayUrl = "https://t.me/cryptodigitaltribe/5474"

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto relative overflow-hidden">
      {/* Estilos globales */}
      <style jsx global>{`
        .dashboard-content * {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }
        
        body {
          overflow-x: hidden;
          width: 100%;
          position: relative;
        }
        
        .cdt-rain-container {
          pointer-events: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          overflow: hidden;
        }

        .cdt-rain-container.hidden {
          display: none;
        }

        .cdt-rain-container.visible {
          display: block;
        }
        
        /* Animación para el contador de recompensas */
        @keyframes pulse-green {
          0% { opacity: 1; }
          50% { opacity: 0.8; }
          100% { opacity: 1; }
        }

        .rewards-counter {
          animation: pulse-green 2s infinite;
          font-family: 'Helvetica Neue', monospace;
          letter-spacing: -0.5px;
        }
        
        /* Animación para el botón de Swap */
        @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animated-gradient-button {
          background: linear-gradient(270deg, #4ebd0a, #d4d4d8, #ff1744, #d4d4d8, #4ebd0a);
          background-size: 400% 400%;
          animation: gradient-animation 8s ease infinite;
          color: white;
          font-weight: bold;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .animated-gradient-button:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        
        /* Mejoras para las tarjetas */
        .dashboard-card {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid #333;
          border-radius: 1rem;
          transition: all 0.3s ease;
        }
        
        .dashboard-card:hover {
          border-color: #444;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          transform: translateY(-2px);
        }
        
        /* Mejoras para los botones */
        .primary-button {
          background-color: var(--primary);
          color: black;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .primary-button:hover {
          background-color: var(--primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(78, 189, 10, 0.2);
        }
        
        .secondary-button {
          background-color: var(--secondary);
          color: white;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .secondary-button:hover {
          background-color: var(--secondary-hover);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(255, 23, 68, 0.2);
        }
      `}</style>

      <div className="dashboard-content relative p-5">
        {/* Banner de bienvenida - Solo se muestra en la primera visita */}
        {isFirstVisit && (
          <div className="mb-6 bg-black/60 border-l-4 border-primary p-4 rounded-xl shadow-lg animate-fadeIn dashboard-card">
            <div className="flex items-start">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">
                  {t("welcome")}, {username}! 🎉
                </h3>
                <p className="text-gray-300 mt-2">{t("how_works_desc")}</p>
                <div className="mt-3 flex gap-4">
                  <button
                    onClick={handleUpdateStake}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-black font-medium rounded-full transition-all text-sm primary-button"
                  >
                    {t("update_balance")}
                  </button>
                  <button
                    onClick={() => setIsFirstVisit(false)}
                    className="px-4 py-2 bg-transparent border border-gray-600 hover:bg-gray-800 text-white rounded-full transition-all text-sm"
                  >
                    {t("disconnect")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección de usuario y saludo con detective verificador */}
        <div className="mb-6 relative">
          <div className="flex items-center">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white">
                Tribo <span className="text-primary">Vault</span>
              </h2>
              {username && (
                <p className="text-white text-xl mt-1 flex items-center">
                  {t("hello")}, {country && <CountryFlag countryCode={country} className="mx-1" />}
                  <span className="font-bold text-primary">{username}</span>
                </p>
              )}
            </div>
            <div className="flex items-center justify-end">
              <Image
                src="/detective-verificador.png"
                alt="Detective Verificador"
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* CDTs Ganados - Diseño mejorado */}
        <div className="mb-6 dashboard-card p-6">
          <h4 className="text-lg font-semibold text-primary mb-2">{t("cdts_earned")}</h4>
          <p className="text-4xl font-bold text-white mb-1">{totalClaimed.toLocaleString()} CDT</p>
          <p className="text-sm text-primary">
            ≈ ${calculateUsdValue(totalClaimed)} {t("usd_claimed")}
          </p>
        </div>

        {/* Botón de Swap WLD/CDT */}
        <div className="mb-6">
          <Link
            href={getSwapUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-full text-lg font-bold animated-gradient-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <path d="M16 3h5v5"></path>
              <path d="M4 20 21 3"></path>
              <path d="M21 16v5h-5"></path>
              <path d="M15 15 3 3"></path>
            </svg>
            <span className="whitespace-nowrap">{t("swap_wld_cdt")}</span>
            <div className="flex items-center gap-1">
              <Image src="/TOKEN CDT.png" alt="CDT Token" width={24} height={24} className="rounded-full" />
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
                className="ml-1"
              >
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </div>
          </Link>
        </div>

        {/* Sección de reclamación */}
        <ClaimSection
          timeRemaining={timeRemaining}
          nextClaimTime={nextClaimTime}
          realtimeRewards={realtimeRewards}
          isClaiming={isClaiming}
          areRewardsClaimable={areRewardsClaimable}
          claimSuccess={claimSuccess}
          claimError={claimError}
          handleClaimRewardsAction={handleClaimRewards}
          formatDateAction={formatDate}
        />

        {/* Enlace a la sección de niveles */}
        <div className="mb-6">
          <Link
            href="/rankings?tab=levels"
            className="block w-full bg-gradient-to-r from-[#4ebd0a] to-yellow-500 text-black font-bold py-4 px-6 rounded-xl text-center relative overflow-hidden shadow-md"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#4ebd0a]/20 to-yellow-500/20 animate-pulse"></div>
            <div className="relative z-10 flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20v-6M6 20V10M18 20V4"></path>
              </svg>
              <span className="text-lg">{t("discover_staking_levels")}</span>
              <span className="ml-1 text-sm bg-black/20 px-2 py-0.5 rounded-full">{t("up_to_apy")}</span>
            </div>
          </Link>
        </div>

        {/* Botón para conocer TRIBO */}
        <div className="mb-6">
          <Link
            href={process.env.NEXT_PUBLIC_WEBSITE_URL || "https://cryptodigitaltribe.com/"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full px-6 py-4 rounded-full text-lg font-bold bg-gradient-to-r from-primary to-primary-hover text-black transition-all duration-300 shadow-md"
            onMouseEnter={() => setIsWebsiteHovered(true)}
            onMouseLeave={() => setIsWebsiteHovered(false)}
            onTouchStart={() => setIsWebsiteHovered(true)}
            onTouchEnd={() => setIsWebsiteHovered(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span className="whitespace-nowrap">{t("know_tribo")}</span>
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
              className={`ml-1 transition-transform duration-300 ${isWebsiteHovered ? "translate-x-1" : ""}`}
            >
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>
        </div>

        {/* Wallet Card */}
        <WalletCard
          stakedAmount={stakedAmount}
          cdtPrice={cdtPrice}
          priceChange={priceChange}
          isUpdating={isUpdating}
          updateSuccess={updateSuccess}
          updateError={updateError}
          handleUpdateStakeAction={handleUpdateStake}
          isProfileHovered={isProfileHovered}
          setIsProfileHoveredAction={setIsProfileHovered}
        />

        {/* Sección de ganancias */}
        <div className="mb-6 dashboard-card p-6">
          <h3 className="text-xl font-semibold mb-4 text-center text-white">{t("earn_daily")}</h3>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-black/50 p-4 rounded-xl border border-primary text-center transition-all hover:border-primary-hover hover:bg-black/70">
              <p className="text-sm text-gray-400 mb-1">{t("daily")}</p>
              <p className="text-2xl font-bold text-primary">0.1%</p>
            </div>
            <div className="bg-black/50 p-4 rounded-xl border border-primary text-center transition-all hover:border-primary-hover hover:bg-black/70">
              <p className="text-sm text-gray-400 mb-1">{t("monthly")}</p>
              <p className="text-2xl font-bold text-primary">3%</p>
            </div>
            <div className="bg-black/50 p-4 rounded-xl border border-primary text-center transition-all hover:border-primary-hover hover:bg-black/70">
              <p className="text-sm text-gray-400 mb-1">{t("yearly")}</p>
              <p className="text-2xl font-bold text-primary">36.5%</p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400">{t("how_works_desc")}</p>
        </div>

        {/* Sección de redes sociales */}
        <SocialLinks
          isDiscordHovered={isDiscordHovered}
          setIsDiscordHoveredAction={setIsDiscordHovered}
          isTelegramHovered={isTelegramHovered}
          setIsTelegramHoveredAction={setIsTelegramHovered}
          isTwitterHovered={isTwitterHovered}
          setIsTwitterHoveredAction={setIsTwitterHovered}
        />

        {/* Banner de sorteos diarios */}
        <Link
          href={telegramGiveawayUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-6 bg-secondary rounded-xl p-4 shadow-lg border border-secondary/30 transition-all duration-300 relative overflow-hidden"
          onMouseEnter={() => setIsDailyGiveawayHovered(true)}
          onMouseLeave={() => setIsDailyGiveawayHovered(false)}
          onTouchStart={() => setIsDailyGiveawayHovered(true)}
          onTouchEnd={() => setIsDailyGiveawayHovered(false)}
        >
          <CdtButtonRain containerClassName="rounded-xl" />

          <div className="flex items-center justify-between relative z-10">
            <div>
              <h3 className="text-black font-bold text-xl">{t("daily_giveaway")}</h3>
              <p className="text-white text-sm mt-1">{t("join_daily_giveaway")}</p>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-300 ${isDailyGiveawayHovered ? "translate-x-1" : ""}`}
              >
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </div>
          </div>
        </Link>

        {/* Sección de propina */}
        <SupportSection
          isSendingCDT={isSendingCDT}
          txHash={txHash}
          txError={txError}
          handleSendCDTAction={handleSendCDT}
        />

        {/* Componente CdtRain */}
        <div className={`cdt-rain-container ${showCdtRain ? "visible" : "hidden"}`} aria-hidden="true">
          <CdtRain count={50} duration={5} />
        </div>

        {/* Modales */}
        <WelcomeGiftModal
          showWelcomeGift={showWelcomeGift}
          isClaimingWelcomeGift={isClaimingWelcomeGift}
          welcomeGiftError={welcomeGiftError}
          handleClaimWelcomeGiftAction={handleClaimWelcomeGift}
        />

        <CountryModal
          showCountryModal={showCountryModal}
          country={country}
          isUpdatingCountry={isUpdatingCountry}
          countryUpdateError={countryUpdateError}
          handleSaveCountryAction={handleSaveCountry}
          onCloseAction={handleCloseCountryModal}
        />
      </div>
    </div>
  )
}
