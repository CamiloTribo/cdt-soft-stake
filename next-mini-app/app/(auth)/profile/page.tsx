"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useWorldAuth } from "next-world-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useTranslation } from "../../../src/components/TranslationProvider"
import { CountrySelector } from "../../../src/components/CountrySelector"
import { CountryFlag } from "../../../src/components/CountryFlag"
import { LevelSection } from "../../../src/components/dashboard/LevelSection"

// Mantenemos los tipos existentes
type UserStats = {
  totalStaked: number
  totalClaimed: number
  referralCount: number
}

type Referral = {
  id: string
  created_at: string
  referred: {
    id: string
    username: string
    address: string
    created_at: string
    staked_amount: number
  }
}

// Función para formatear números grandes (K, M, B)
function formatBalance(balance: number): string {
  if (balance >= 1000000) {
    return (balance / 1000000).toFixed(1) + "M"
  } else if (balance >= 1000) {
    return (balance / 1000).toFixed(1) + "K"
  } else {
    return balance.toFixed(1)
  }
}

export default function Profile() {
  const { t, locale } = useTranslation()
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [userStats, setUserStats] = useState<UserStats>({
    totalStaked: 0,
    totalClaimed: 0,
    referralCount: 0,
  })
  const [isCopied, setIsCopied] = useState(false)
  const [cdtPrice, setCdtPrice] = useState<number | null>(null)
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null)

  // Estado para el país
  const [country, setCountry] = useState("")
  const [isUpdatingCountry, setIsUpdatingCountry] = useState(false)
  const [countryUpdateSuccess, setCountryUpdateSuccess] = useState(false)
  const [countryUpdateError, setCountryUpdateError] = useState("")

  // Estados para la lista de referidos
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false)
  const [referralsError, setReferralsError] = useState<string | null>(null)

  const { isAuthenticated, session } = useWorldAuth()
  const router = useRouter()

  // Función para obtener un identificador único del usuario
  const getUserIdentifier = useCallback(() => {
    if (!session || !session.user || !session.user.walletAddress) return null
    return session.user.walletAddress
  }, [session])

  // Función para obtener datos del usuario
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true)

      const identifier = getUserIdentifier()
      if (!identifier) {
        console.error("No se pudo obtener identificador de usuario")
        return
      }

      // Obtener el username y datos del usuario
      try {
        console.log("Fetching user data for profile:", identifier)
        const usernameResponse = await fetch(`/api/username?wallet_address=${identifier}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (usernameResponse.ok) {
          const usernameData = await usernameResponse.json()
          console.log("User data received in profile:", usernameData)

          if (usernameData.username) {
            setUsername(usernameData.username)

            // Actualizar total_claimed y referral_count desde la API de username
            setUserStats((prev) => ({
              ...prev,
              totalClaimed: usernameData.total_claimed || 0,
              referralCount: usernameData.referral_count || 0,
            }))

            // Actualizar el país si existe
            if (usernameData.country) {
              console.log("Country found in profile:", usernameData.country)
              setCountry(usernameData.country)
            } else {
              console.log("No country found in user data for profile")
            }
          }
        } else {
          console.error("Error response in profile:", await usernameResponse.text())
        }
      } catch (error) {
        console.error("Error fetching username:", error)
      }

      // Obtener datos de staking
      try {
        const stakingResponse = await fetch(`/api/staking?wallet_address=${identifier}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        })

        if (stakingResponse.ok) {
          const stakingData = await stakingResponse.json()

          setUserStats((prev) => ({
            ...prev,
            totalStaked: stakingData.staked_amount || 0,
          }))

          // Obtener la fecha del último claim
          if (stakingData.last_claim_timestamp) {
            setLastClaimDate(stakingData.last_claim_timestamp)
          }
        }
      } catch (error) {
        console.error("Error fetching staking data:", error)
      }

      // Obtener el precio del token CDT
      try {
        const priceResponse = await fetch("/api/token-price")
        if (priceResponse.ok) {
          const priceData = await priceResponse.json()
          if (priceData.success) {
            setCdtPrice(priceData.price)
          }
        }
      } catch (error) {
        console.error("Error fetching token price:", error)
      }

      // Obtener la lista de referidos
      fetchReferrals(identifier)
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [getUserIdentifier])

  // Función para obtener la lista de referidos
  const fetchReferrals = async (walletAddress: string) => {
    if (!walletAddress) return

    try {
      setIsLoadingReferrals(true)
      setReferralsError(null)

      const response = await fetch(`/api/referral?wallet_address=${walletAddress}`)

      if (!response.ok) {
        throw new Error("Error al cargar referidos")
      }

      const data = await response.json()

      if (data.success && data.referrals) {
        setReferrals(data.referrals)
      } else {
        setReferrals([])
      }
    } catch (err) {
      console.error("Error fetching referrals:", err)
      setReferralsError(err instanceof Error ? err.message : "Error al cargar referidos")
    } finally {
      setIsLoadingReferrals(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    fetchUserData()
  }, [isAuthenticated, router, fetchUserData])

  // Efecto para actualizar la UI cuando cambia el país
  useEffect(() => {
    if (country) {
      console.log("País actualizado:", country)
    }
  }, [country])

  // Función para generar el link de referido
  const generateReferralLink = () => {
    return `https://worldcoin.org/mini-app?app_id=app_adf5744abe7aef9fe2a5841d4f1552d3&path=/?ref=${username}`
  }

  // Función para copiar el link de referido
  const copyReferralLink = () => {
    navigator.clipboard.writeText(generateReferralLink())
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Función para actualizar el país del usuario
  const handleUpdateCountry = async () => {
    const identifier = getUserIdentifier()
    if (!identifier || !country) return

    setIsUpdatingCountry(true)
    setCountryUpdateError("")
    setCountryUpdateSuccess(false)

    try {
      const response = await fetch("/api/update-country", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: identifier,
          country,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setCountryUpdateSuccess(true)
        setTimeout(() => setCountryUpdateSuccess(false), 3000)
        // No es necesario actualizar el estado country aquí porque ya se actualizó en el selector
      } else {
        setCountryUpdateError(data.error || t("error_updating_country"))
      }
    } catch (error) {
      console.error("Error updating country:", error)
      setCountryUpdateError(t("error_processing_request"))
    } finally {
      setIsUpdatingCountry(false)
    }
  }

  // Calcular el valor estimado en USD
  const calculateUsdValue = (amount: number) => {
    if (cdtPrice && amount) {
      return (cdtPrice * amount).toFixed(2)
    }
    return "0.00"
  }

  // Calcular las ganancias anuales estimadas
  const calculateYearlyEarnings = () => {
    // 0.1% diario durante 365 días con interés compuesto (36.5% anual)
    if (userStats.totalStaked) {
      let amount = userStats.totalStaked
      for (let i = 0; i < 365; i++) {
        amount += amount * 0.001 // 0.1% diario
      }
      return Math.round(amount - userStats.totalStaked)
    }
    return 0
  }

  // Función para formatear la fecha del último claim
  const formatLastClaimDate = () => {
    if (!lastClaimDate) return t("never")

    const date = new Date(lastClaimDate)
    return date.toLocaleDateString()
  }

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  // Modificamos la parte de la animación de carga para que sea idéntica a rankings
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen py-12">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-[#4ebd0a] animate-spin"></div>
          <div className="absolute inset-3 rounded-full border-t-2 border-r-2 border-[#4ebd0a]/70 animate-spin animation-delay-150"></div>
          <div className="absolute inset-6 rounded-full border-t-2 border-r-2 border-[#4ebd0a]/40 animate-spin animation-delay-300"></div>
        </div>
      </div>
    )
  }

  // Clases comunes para las tarjetas
  const cardClass =
    "mb-4 bg-black rounded-2xl shadow-lg p-5 border border-gray-800 transition-all duration-300 hover:border-gray-700"
  const cardTitleClass = "text-xl font-semibold text-[#4ebd0a] mb-2"
  const cardValueClass = "text-4xl font-bold text-white mb-1"
  const cardSubtitleClass = "text-sm text-gray-400 mb-3"
  const cardSeparatorClass = "border-t border-gray-800 my-3"
  const buttonSecondaryClass =
    "w-full px-4 py-3 bg-black border border-gray-700 rounded-full hover:bg-gray-900 text-white text-center block transition-colors"

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="pt-16 pb-8 px-4">
        {" "}
        {/* Ajustado el padding superior para dar espacio al header fijo */}
        <div className="max-w-md mx-auto">
          {/* Header con logo de TRIBO Wallet */}
          <div className="flex flex-col items-center mb-6 mt-2 animate-fadeIn">
            <div className="relative mb-2">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#4ebd0a]/30 to-[#4ebd0a]/10 blur-md"></div>
              <Image
                src="/TRIBO Wallet sin fondo.png"
                alt={t("tribo_wallet")}
                width={100}
                height={100}
                className="relative z-10"
                priority
              />
            </div>
            {username && (
              <div className="flex flex-col items-center">
                <div className="flex items-center">
                  {country && <CountryFlag countryCode={country} className="mr-2" />}
                  <p className="text-2xl text-center">
                    <span className="text-white">@</span>
                    <span className="text-[#4ebd0a]">{username}</span>
                  </p>
                </div>
                <div className="mt-1 bg-[#4ebd0a]/20 px-3 py-1 rounded-full flex items-center">
                  <span className="text-[#4ebd0a] text-sm font-medium">{locale === "en" ? "Human ✓" : "Humano ✓"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Balance Total */}
          <div className={`${cardClass} transform transition-transform hover:translate-y-[-2px]`}>
            <h4 className={cardTitleClass}>{t("total_balance")}</h4>
            <p className={cardValueClass}>{userStats.totalStaked.toLocaleString()} CDT</p>
            <p className={cardSubtitleClass}>≈ ${calculateUsdValue(userStats.totalStaked)} USD</p>

            <div className={cardSeparatorClass}></div>

            <h5 className="text-base font-medium text-white mb-2">{t("annual_projection")}</h5>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">{t("estimated_earnings")}</p>
              <p className="text-lg font-semibold text-[#4ebd0a]">+{calculateYearlyEarnings().toLocaleString()} CDT</p>
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-sm text-gray-400">APY</p>
              <p className="text-lg font-semibold text-[#4ebd0a]">36.5%</p>
            </div>
          </div>

          {/* CDTs Ganados */}
          <div className={`${cardClass} transform transition-transform hover:translate-y-[-2px]`}>
            <h4 className={cardTitleClass}>{t("cdts_earned")}</h4>
            <p className={cardValueClass}>{userStats.totalClaimed.toLocaleString()} CDT</p>
            <p className={cardSubtitleClass}>
              ≈ ${calculateUsdValue(userStats.totalClaimed)} USD {t("usd_claimed")}
            </p>

            <div className={cardSeparatorClass}></div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-400">{t("last_claim")}</p>
              <p className="text-sm text-white">{formatLastClaimDate()}</p>
            </div>
            <div className="mt-3">
              <Link href="/transactions" className={buttonSecondaryClass} aria-label={t("view_full_history")}>
                {t("view_full_history")}
              </Link>
            </div>
          </div>

          {/* Sección de niveles - AÑADIDA AQUÍ */}
          <LevelSection stakedAmount={userStats.totalStaked} />

          {/* Sección de referidos */}
          <div
            className={`mb-6 bg-black rounded-2xl shadow-lg p-6 border border-gray-800 transition-all duration-300 hover:border-gray-700`}
          >
            <h4 className="text-xl font-semibold text-[#4ebd0a] mb-5">{t("referral_program")}</h4>

            <p className="text-sm text-gray-300 mb-4">{t("share_referral_code")}</p>

            {/* Tu link de referido */}
            <div className="bg-gray-900/50 p-4 rounded-xl mb-4">
              <p className="text-sm text-gray-400 mb-2">{t("your_referral_link")}</p>
              <div className="flex items-center">
                <input
                  type="text"
                  value={generateReferralLink()}
                  readOnly
                  className="flex-1 min-w-0 bg-black border border-gray-700 rounded-l-full px-3 py-2 text-xs font-mono text-white overflow-hidden text-ellipsis"
                  aria-label={t("your_referral_link")}
                />
                <button
                  onClick={copyReferralLink}
                  className="bg-[#4ebd0a] hover:bg-[#4ebd0a]/80 text-black px-3 py-2 rounded-r-full transition-colors"
                  aria-label={isCopied ? "Copied" : "Copy link"}
                >
                  {isCopied ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5"></path>
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">{t("share_this_link_with_friends")}</p>
            </div>

            {/* Invitaciones Totales */}
            <div className="bg-gray-900/50 p-4 rounded-xl mb-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-400">{t("total_invitations")}</p>
                <p className="text-xl font-bold text-[#4ebd0a]">{userStats.referralCount}</p>
              </div>
            </div>

            {/* Lista de referidos */}
            <div className="mb-5 mt-6">
              <h5 className="text-base font-medium text-white mb-3">{t("your_referrals")}</h5>

              {isLoadingReferrals ? (
                <div className="flex justify-center py-4">
                  <div
                    className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#4ebd0a]"
                    aria-label="Loading referrals"
                  ></div>
                </div>
              ) : referralsError ? (
                <div className="bg-black/30 rounded-xl p-4 text-center">
                  <p className="text-red-500 text-sm">{t("error_loading_referrals")}</p>
                </div>
              ) : referrals.length === 0 ? (
                <div className="bg-gray-900/30 rounded-xl p-4 text-center">
                  <p className="text-gray-400 text-sm">{t("no_referrals_yet")}</p>
                  <p className="text-xs text-gray-500 mt-1">{t("share_to_invite")}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      className="bg-black/30 rounded-xl p-3 flex items-center justify-between border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center min-w-0 flex-1 mr-2">
                        <div className="bg-[#4ebd0a]/20 rounded-full p-2 mr-3 flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#4ebd0a"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <line x1="19" y1="8" x2="19" y2="14"></line>
                            <line x1="16" y1="11" x2="22" y2="11"></line>
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate" title={`@${referral.referred.username}`}>
                            @{referral.referred.username}
                          </p>
                          <p className="text-xs text-gray-400">
                            {t("joined_on")} {formatDate(referral.referred.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center flex-shrink-0">
                        <div className="bg-[#4ebd0a]/10 rounded-full px-3 py-1 flex items-center">
                          <Image src="/TOKEN CDT.png" alt="CDT Token" width={16} height={16} className="mr-1" />
                          <span className="text-[#4ebd0a] text-sm font-medium">
                            {formatBalance(referral.referred.staked_amount || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Separador */}
            <div className={cardSeparatorClass}></div>

            {/* ❌ CÓDIGO OBSOLETO - Sistema de códigos */}
            {/* 
            <div>
              <p className="text-sm text-gray-300 mb-3">{t("invited_by_friend")}</p>

              <form onSubmit={handleReferralSubmit}>
                <div className="flex w-full">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder={t("referral_code")}
                    className="flex-1 min-w-0 bg-black border border-gray-700 rounded-l-full px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#4ebd0a]"
                    aria-label={t("referral_code")}
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`whitespace-nowrap px-4 py-2 rounded-r-full font-medium transition-colors ${
                      isSubmitting ? "bg-gray-700 cursor-not-allowed" : "bg-[#4ebd0a] hover:bg-[#4ebd0a]/80 text-black"
                    }`}
                    aria-disabled={isSubmitting}
                  >
                    {isSubmitting ? t("sending") : t("register")}
                  </button>
                </div>

                {referralError && (
                  <p className="text-sm text-red-500 mt-2" role="alert">
                    {referralError}
                  </p>
                )}
                {referralSuccess && (
                  <p className="text-sm text-[#4ebd0a] mt-2" role="alert">
                    {t("referral_registered")}
                  </p>
                )}
              </form>
            </div>
            */}
          </div>

          {/* Selector de país */}
          <div className={`${cardClass} transform transition-transform hover:translate-y-[-2px]`}>
            <h4 className={cardTitleClass}>{t("select_your_country")}</h4>
            <p className="text-sm text-gray-300 mb-4">{t("country_selection_description")}</p>

            <div className="mb-4">
              <CountrySelector value={country} onChangeAction={setCountry} className="w-full" />
            </div>

            <button
              onClick={handleUpdateCountry}
              disabled={isUpdatingCountry || !country}
              className={`w-full px-4 py-2 rounded-full transition-colors ${
                isUpdatingCountry || !country
                  ? "bg-gray-700 cursor-not-allowed"
                  : "bg-[#4ebd0a] hover:bg-[#3fa008] text-black"
              } font-medium`}
              aria-disabled={isUpdatingCountry || !country}
            >
              {isUpdatingCountry ? t("updating") : t("update_country")}
            </button>

            {countryUpdateSuccess && (
              <p className="text-sm text-[#4ebd0a] mt-2 text-center animate-fadeIn" role="alert">
                {t("country_updated")}
              </p>
            )}

            {countryUpdateError && (
              <p className="text-sm text-red-500 mt-2 text-center" role="alert">
                {countryUpdateError}
              </p>
            )}
          </div>

          {/* Botón para volver al dashboard */}
          <div className="mb-6 text-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-black border border-gray-700 rounded-full hover:bg-gray-900 text-white transition-colors"
              aria-label={t("back_to_dashboard")}
            >
              <span className="flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                  aria-hidden="true"
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
                {t("back_to_dashboard")}
              </span>
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
