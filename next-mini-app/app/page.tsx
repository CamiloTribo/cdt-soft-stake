"use client"

import Image from "next/image"
import { useWorldAuth } from "next-world-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { useTranslation } from "../src/components/TranslationProvider"
import { LanguageSelector } from "../src/components/LanguageSelector"

export default function Home() {
  const { t } = useTranslation()
  const { isLoading, isAuthenticated, session, signInWallet } = useWorldAuth()

  const router = useRouter()
  const [username, setUsername] = useState("")
  const [isSavingUsername, setIsSavingUsername] = useState(false)
  const [showUsernameForm, setShowUsernameForm] = useState(false)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [isMascotHovered, setIsMascotHovered] = useState(false)
  const [showVerificationMessage, setShowVerificationMessage] = useState(false)
  const [totalUsers, setTotalUsers] = useState(0)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  // Función para obtener un identificador único del usuario
  const getUserIdentifier = useCallback(() => {
    if (!session || !session.user || !session.user.walletAddress) return null
    return session.user.walletAddress
  }, [session])

  // Función para obtener contadores de usuarios
  const fetchUserCounts = useCallback(async () => {
    try {
      setIsLoadingUsers(true)
      const response = await fetch("/api/total-users-count")
      if (response.ok) {
        const data = await response.json()
        if (data.count !== undefined) {
          setTotalUsers(data.count)
        }
      }
    } catch (error) {
      console.error("Error fetching user counts:", error)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [])

  // Cargar contadores de usuarios al inicio
  useEffect(() => {
    fetchUserCounts()
  }, [fetchUserCounts])

  // Función para verificar si el usuario está autenticado - Simplificado para evitar redirecciones automáticas
  useEffect(() => {
    if (isAuthenticated && session?.isAuthenticatedWallet) {
      console.log("Usuario autenticado:", session)
      // No hacemos nada automáticamente para evitar ciclos
    }
  }, [isAuthenticated, session])

  // Nuevo efecto para actualizar el nivel de verificación
  useEffect(() => {
    // Solo ejecutar si el usuario está autenticado
    if (isAuthenticated && session?.user?.walletAddress) {
      // CAMBIO IMPORTANTE: Ahora siempre asignamos "human" como nivel de verificación
      // cuando el usuario se autentica con wallet
      const verificationLevel = "human"

      console.log("Actualizando nivel de verificación:", verificationLevel)

      // Actualizar el nivel de verificación en la base de datos
      fetch("/api/update-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: session.user.walletAddress,
          verification_level: verificationLevel,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            console.error("Error updating verification level")
          } else {
            console.log("Nivel de verificación actualizado correctamente")
            // Actualizar contadores después de verificación
            fetchUserCounts()
          }
        })
        .catch((error) => {
          console.error("Error updating verification level:", error)
        })
    }
  }, [isAuthenticated, session, fetchUserCounts])

  // Función para manejar el clic en la mascota - Ahora muestra mensaje si no está verificado
  const handleMascotClick = () => {
    // CAMBIO: Ahora solo verificamos si está autenticado con wallet
    if (isAuthenticated && session?.isAuthenticatedWallet) {
      router.push("/dashboard")
    } else {
      setShowVerificationMessage(true)
      setTimeout(() => {
        setShowVerificationMessage(false)
      }, 3000)
    }
  }

  // Función para guardar username
  const handleSaveUsername = async () => {
    const identifier = getUserIdentifier()
    if (!identifier || !username) {
      console.error("No hay identifier o username")
      return
    }

    try {
      setIsSavingUsername(true)
      setUsernameError(null)

      console.log("Guardando username:", username, "para wallet:", identifier)

      const response = await fetch("/api/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_address: identifier,
          username: username,
        }),
      })

      const data = await response.json()
      console.log("Respuesta al guardar username:", data)

      if (response.ok && data.success) {
        console.log("Username guardado correctamente, redirigiendo a dashboard")

        // Mostrar confeti
        setShowConfetti(true)

        // Añadir un pequeño retraso antes de redirigir
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        console.error("Error al guardar username:", data.error)
        setUsernameError(data.error || t("error_username"))
      }
    } catch (error) {
      console.error("Error registering username:", error)
      setUsernameError(t("error_username"))
    } finally {
      setIsSavingUsername(false)
    }
  }

  // Función para verificar si el usuario tiene username y redirigir al dashboard
  const handleContinueToDashboard = useCallback(async () => {
    const identifier = getUserIdentifier()
    if (!identifier) {
      console.error("No se pudo obtener identificador de usuario")
      return
    }

    try {
      const response = await fetch(`/api/username?wallet_address=${identifier}`)
      const data = await response.json()

      if (response.ok) {
        if (data.hasUsername) {
          router.push("/dashboard")
        } else {
          setShowUsernameForm(true)
        }
      }
    } catch (error) {
      console.error("Error checking username:", error)
      setShowUsernameForm(true)
    }
  }, [getUserIdentifier, router])

  useEffect(() => {
    // CAMBIO: Ahora solo verificamos si está autenticado con wallet
    if (isAuthenticated && session?.isAuthenticatedWallet) {
      handleContinueToDashboard()
    }
  }, [isAuthenticated, session, handleContinueToDashboard])

  // Efecto para registrar el estado del botón en la consola
  useEffect(() => {
    console.log("Estado del botón - disabled:", session?.isAuthenticatedWorldID)
  }, [session?.isAuthenticatedWorldID])

  // Componente de confeti
  const Confetti = () => {
    return (
      <div className="confetti-container">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="home-container">
      {/* Header simplificado para la página de inicio */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/LOGO TRIBO Vault- sin fondo.png" alt="Tribo Logo" width={28} height={28} className="mr-2" />
            <h1 className="text-xl font-bold">{t("tribo_vault")}</h1>
          </div>
          <LanguageSelector />
        </div>
      </div>

      {/* Contenido principal centrado verticalmente */}
      <main className="home-main">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ebd0a]"></div>
          </div>
        ) : (
          <>
            {/* Sección de mascota y autenticación */}
            {(!isAuthenticated || !showUsernameForm) && (
              <div className="w-full flex flex-col items-center justify-center">
                {/* Mascota DETECTRIBER - Con bocadillo siempre visible */}
                <div className="detectriber-container flex justify-center mb-8 w-full">
                  <div className="speech-bubble">
                    <p className="text-center text-sm break-words">
                      {showVerificationMessage ? t("verify_first") : t("detectriber_message")}
                    </p>
                  </div>

                  <div
                    className={`relative cursor-pointer transition-transform duration-300 ${
                      isMascotHovered ? "scale-105" : ""
                    }`}
                    onMouseEnter={() => setIsMascotHovered(true)}
                    onMouseLeave={() => setIsMascotHovered(false)}
                    onClick={handleMascotClick}
                  >
                    <Image
                      src="/DETECTRIBER.png"
                      alt="Detectriber"
                      width={320}
                      height={320}
                      className={`${isMascotHovered ? "animate-bounce" : "animate-pulse"}`}
                    />
                  </div>
                </div>

                {/* Botón de conectar wallet */}
                <button
                  onClick={signInWallet}
                  className="w-full max-w-xs px-6 py-4 bg-[#4ebd0a] hover:bg-[#3fa008] text-black font-medium rounded-full transition-colors text-lg shadow-lg shadow-[#4ebd0a]/20"
                  disabled={session?.isAuthenticatedWallet}
                >
                  {session?.isAuthenticatedWallet ? "✓ Wallet conectada" : "Conectar World Wallet"}
                </button>

                {/* Botón para continuar al dashboard si está autenticado */}
                {isAuthenticated && session?.isAuthenticatedWallet && (
                  <button
                    onClick={handleContinueToDashboard}
                    className="w-full max-w-xs px-6 py-4 bg-[#4ebd0a] hover:bg-[#3fa008] text-black font-medium rounded-full transition-colors mt-4 text-lg shadow-lg shadow-[#4ebd0a]/20"
                  >
                    {t("go_dashboard")}
                  </button>
                )}
              </div>
            )}

            {/* Username Form - Solo se muestra si el usuario está autenticado pero no tiene username */}
            {isAuthenticated && session?.isAuthenticatedWallet && showUsernameForm && (
              <div className="w-full max-w-md flex flex-col items-center">
                {/* Imagen decorativa arriba del formulario */}
                <div className="mb-6">
                  <Image
                    src="/Jefe Tribo Discord.png"
                    alt="Jefe Tribo"
                    width={120}
                    height={120}
                    className="animate-pulse"
                  />
                </div>

                <div className="w-full bg-black border border-[#4ebd0a] rounded-xl shadow-lg p-8 mb-8 relative overflow-hidden">
                  <h2 className="text-2xl font-semibold mb-6 text-white text-center">{t("welcome_tribo")}</h2>
                  <p className="text-gray-300 mb-6 text-center">{t("choose_name")}</p>

                  <div className="mb-6">
                    <label htmlFor="username" className="block text-sm font-medium text-[#4ebd0a] mb-2">
                      {t("triber_name")}
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t("enter_name")}
                      className="w-full px-4 py-3 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-[#4ebd0a] focus:border-[#4ebd0a] bg-black text-white"
                    />
                  </div>

                  {usernameError && (
                    <div className="mb-4 p-3 bg-black border border-[#ff1744] rounded-md">
                      <p className="text-sm text-[#ff1744]">{usernameError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleSaveUsername}
                    disabled={isSavingUsername || !username}
                    className={`w-full px-6 py-3 rounded-full ${
                      isSavingUsername || !username
                        ? "bg-gray-700 cursor-not-allowed"
                        : "bg-[#4ebd0a] hover:bg-[#3fa008] text-black"
                    } font-medium transition-colors shadow-lg`}
                  >
                    {isSavingUsername ? t("saving") : t("continue_dashboard")}
                  </button>
                </div>
              </div>
            )}

            {/* Confeti cuando se guarda el username */}
            {showConfetti && <Confetti />}
          </>
        )}
      </main>

      {/* Barra inferior fija con contador de usuarios */}
      <div className="home-footer">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <div className="flex items-center bg-[#4ebd0a]/10 px-4 py-2 rounded-full border border-[#4ebd0a]/30">
            <div className="h-8 w-8 flex items-center justify-center bg-[#4ebd0a]/20 rounded-full mr-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4ebd0a"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="m16 11 2 2 4-4" />
              </svg>
            </div>
            <span className="text-gray-300 text-sm">
              Humanos verificados:{" "}
              <span className="text-[#4ebd0a] font-medium">
                {isLoadingUsers ? (
                  <span className="inline-block w-8 h-4 bg-gray-700 animate-pulse rounded"></span>
                ) : (
                  totalUsers.toLocaleString()
                )}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
