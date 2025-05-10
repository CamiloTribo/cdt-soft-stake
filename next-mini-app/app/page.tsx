"use client"

import Image from "next/image"
import { useWorldAuth } from "next-world-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { useTranslation } from "../src/components/TranslationProvider"
import { LanguageSelector } from "../src/components/LanguageSelector"

export default function Home() {
  const { t } = useTranslation()
  // Eliminamos signInWorldID de la desestructuración ya que no lo usamos
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

        // Añadir un pequeño retraso antes de redirigir
        setTimeout(() => {
          router.push("/dashboard")
        }, 500)
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

  return (
    <div className="min-h-screen bg-black text-white">
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

      <main className="container max-w-4xl mx-auto px-4 py-12 main-content flex flex-col items-center">
        {/* Main Content */}
        {isLoading ? (
          <div className="flex items-center justify-center mt-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ebd0a]"></div>
          </div>
        ) : (
          <div className="w-full">
            {/* UN SOLO CONTADOR: Humanos verificados (pero realmente muestra el total) */}
            <div className="bg-black rounded-xl shadow-lg p-4 border border-gray-800 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex items-center justify-center bg-[#4ebd0a]/20 rounded-full mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
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
                  <div>
                    <p className="text-sm text-[#4ebd0a]">Humanos verificados</p>
                    <p className="text-2xl font-bold text-white">
                      {isLoadingUsers ? (
                        <span className="inline-block w-12 h-6 bg-gray-700 animate-pulse rounded"></span>
                      ) : (
                        totalUsers.toLocaleString()
                      )}
                    </p>
                  </div>
                </div>
                <div className="h-10 w-10 flex items-center justify-center bg-[#1E88E5]/20 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1E88E5"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Mascota DETECTRIBER - Con bocadillo siempre visible */}
            {(!isAuthenticated || !showUsernameForm) && (
              <div className="detectriber-container flex justify-center mb-8 w-full">
                <div className="speech-bubble">
                  <p className="text-center text-sm break-words">
                    {showVerificationMessage ? t("verify_first") : t("detectriber_message")}
                  </p>
                </div>

                <div
                  className={`relative cursor-pointer transition-transform duration-300 ${
                    isMascotHovered ? "scale-110" : ""
                  }`}
                  onMouseEnter={() => setIsMascotHovered(true)}
                  onMouseLeave={() => setIsMascotHovered(false)}
                  onClick={handleMascotClick}
                >
                  <Image
                    src="/DETECTRIBER.png"
                    alt="Detectriber"
                    width={200}
                    height={200}
                    className={`${isMascotHovered ? "animate-bounce" : "animate-pulse"}`}
                  />
                </div>
              </div>
            )}

            {/* Sección de verificación y conexión */}
            {(!isAuthenticated || !showUsernameForm) && (
              <div className="bg-black border border-[#4ebd0a] rounded-xl shadow-lg p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-center text-white">{t("verify_as_human")}</h2>
                <p className="text-center text-sm text-gray-400 mb-6">{t("verify_human_explanation")}</p>

                {/* Botones de verificación y conexión */}
                <div className="flex flex-col gap-4">
                  {/* Botón de conectar wallet */}
                  <button
                    onClick={signInWallet}
                    className="w-full px-6 py-3 bg-[#4ebd0a] hover:bg-[#3fa008] text-black font-medium rounded-md transition-colors"
                    disabled={session?.isAuthenticatedWallet}
                  >
                    {session?.isAuthenticatedWallet ? "✓ Wallet conectada" : "Conectar World Wallet"}
                  </button>

                  {/* Botón para continuar al dashboard si está autenticado */}
                  {isAuthenticated && session?.isAuthenticatedWallet && (
                    <button
                      onClick={handleContinueToDashboard}
                      className="w-full px-6 py-3 bg-[#4ebd0a] hover:bg-[#3fa008] text-black font-medium rounded-md transition-colors mt-4"
                    >
                      {t("go_dashboard")}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Username Form - Solo se muestra si el usuario está autenticado pero no tiene username */}
            {isAuthenticated && session?.isAuthenticatedWallet && showUsernameForm && (
              <div className="bg-black border border-[#4ebd0a] rounded-xl shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-white">{t("welcome_tribo")}</h2>
                <p className="text-gray-300 mb-6">{t("choose_name")}</p>

                <div className="mb-6">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
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
                  className={`w-full px-6 py-3 rounded-md ${
                    isSavingUsername || !username
                      ? "bg-gray-700 cursor-not-allowed"
                      : "bg-[#ff1744] hover:bg-[#ff2954] text-white"
                  } font-medium transition-colors`}
                >
                  {isSavingUsername ? t("saving") : t("continue_dashboard")}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500">
        <p>{t("footer_home")}</p>
      </footer>
      <style jsx global>{`
  .main-content {
    padding-top: calc(4rem + 16px); /* Espacio para el header más un margen adicional */
  }
  
  .detectriber-container {
    margin-top: 2rem;
    position: relative;
    padding-top: 3rem; /* Espacio para el bocadillo */
  }
  
  .speech-bubble {
    position: absolute;
    top: -2.5rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.8);
    border: 1px solid #4ebd0a;
    border-radius: 9999px;
    padding: 0.5rem 1rem;
    z-index: 10;
    max-width: 90%;
    margin: 0 auto;
    white-space: normal;
  }
  
  .speech-bubble:after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid #4ebd0a;
  }
`}</style>
    </div>
  )
}
