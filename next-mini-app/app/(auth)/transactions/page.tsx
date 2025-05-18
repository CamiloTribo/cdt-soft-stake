"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useWorldAuth } from "next-world-auth/react"
import Image from "next/image"
import Link from "next/link"
import { useTranslation } from "../../../src/components/TranslationProvider"
import { LanguageSelector } from "../../../src/components/LanguageSelector"

type Transaction = {
  id: string
  type: string
  amount: number
  token_type: string
  tx_hash: string | null
  status: string
  created_at: string
  description: string | null
}

export default function Transactions() {
  const { t } = useTranslation()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  const { isAuthenticated, session } = useWorldAuth()
  const router = useRouter()

  // Función para obtener un identificador único del usuario
  const getUserIdentifier = useCallback(() => {
    if (!session || !session.user || !session.user.walletAddress) return null
    return session.user.walletAddress
  }, [session])

  // Función para obtener el historial de transacciones
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const identifier = getUserIdentifier()
      if (!identifier) {
        throw new Error(t("error_loading"))
      }

      const offset = (page - 1) * limit
      const response = await fetch(`/api/transactions?wallet_address=${identifier}&limit=${limit}&offset=${offset}`)

      if (!response.ok) {
        throw new Error(t("error_loading"))
      }

      const data = await response.json()
      setTransactions(data.transactions)
      setTotalPages(Math.ceil(data.pagination.total / limit))
    } catch (err) {
      console.error("Error fetching transactions:", err)
      setError(err instanceof Error ? err.message : t("error_loading"))
    } finally {
      setIsLoading(false)
    }
  }, [getUserIdentifier, page, limit, t])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    fetchTransactions()
  }, [isAuthenticated, router, fetchTransactions])

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Función para obtener el icono según el tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "claim":
        return "/icons-transactions/Entrega CDT.png"
      case "support":
        return "/icons-transactions/Apoyo WLD.png"
      default:
        return null
    }
  }

  // Función para obtener la descripción según el tipo
  const getTypeDescription = (type: string) => {
    switch (type) {
      case "claim":
        return "Stake"
      case "support":
        return t("support")
      default:
        return type
    }
  }

  // Función para traducir el estado
  const getStatusTranslation = (status: string) => {
    switch (status) {
      case "success":
        return t("completed")
      case "pending":
        return t("pending")
      case "failed":
        return t("failed")
      default:
        return status
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ebd0a]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 rounded-full bg-black"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header con selector de idioma */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-gray-800 shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <div className="relative overflow-hidden rounded-full p-0.5 bg-gradient-to-r from-purple-500/30 to-blue-500/30 transition-all duration-300 group-hover:from-purple-500/50 group-hover:to-blue-500/50">
                <Image
                  src="/LOGO TRIBO Vault- sin fondo.png"
                  alt="Tribo Logo"
                  width={28}
                  height={28}
                  className="transition-transform duration-300"
                  priority
                />
              </div>
              <h1 className="text-lg font-bold hidden sm:block ml-2">Tribo Vault</h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector />
            </div>
          </div>
        </div>

        <div className="pt-16 pb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-4 sm:mb-0">{t("transaction_history")}</h1>
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-black border border-gray-700 rounded-full hover:bg-gray-900 transition-all duration-200 text-sm shadow-sm hover:shadow-md hover:translate-y-[-1px]"
              aria-label={t("back_to_dashboard")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              {t("back_to_dashboard")}
            </Link>
          </div>

          {error && (
            <div
              className="mb-6 p-4 bg-black border border-[#ff1744] rounded-xl animate-fadeIn"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-center">
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
                  className="text-[#ff1744] mr-2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p className="text-[#ff1744]">{error}</p>
              </div>
            </div>
          )}

          {transactions.length === 0 ? (
            <div className="bg-black rounded-xl shadow-lg p-8 border border-gray-800 text-center transition-all duration-300 hover:border-gray-700 hover:shadow-xl">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 shadow-inner">
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
                    className="text-gray-400"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <p className="text-gray-400 text-lg font-medium">{t("no_transactions")}</p>
                <p className="text-gray-500 text-sm mt-2">
                  Las transacciones aparecerán aquí cuando realices operaciones
                </p>
                <Link
                  href="/dashboard"
                  className="mt-4 inline-flex items-center text-sm text-[#4ebd0a] hover:underline"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  {t("back_to_dashboard")}
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Vista de tarjetas para móviles y tablets */}
              <div className="space-y-4 sm:hidden">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-black rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-all duration-200 hover:shadow-md hover:translate-y-[-1px]"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 flex items-center justify-center mr-3 bg-gray-900 rounded-full shadow-inner">
                        {getTypeIcon(tx.type) ? (
                          <Image
                            src={getTypeIcon(tx.type) || ""}
                            alt={getTypeDescription(tx.type)}
                            width={24}
                            height={24}
                            className="max-w-full max-h-full"
                          />
                        ) : (
                          <span className="text-xl">📝</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{getTypeDescription(tx.type)}</p>
                        <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                      </div>
                      <div className="ml-auto">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            tx.status === "success"
                              ? "bg-[#4ebd0a]/20 text-[#4ebd0a] border border-[#4ebd0a]/30"
                              : tx.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                                : "bg-[#ff1744]/20 text-[#ff1744] border border-[#ff1744]/30"
                          }`}
                          aria-label={`Estado: ${getStatusTranslation(tx.status)}`}
                        >
                          {getStatusTranslation(tx.status)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-800 pt-3">
                      <div className="flex items-center">
                        <span className="font-mono text-xl font-semibold text-white">{tx.amount.toLocaleString()}</span>
                        <span className="ml-1 text-[#4ebd0a]">{tx.token_type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista de tabla para desktop */}
              <div className="hidden sm:block bg-black rounded-xl shadow-lg border border-gray-800 overflow-hidden transition-all duration-300 hover:border-gray-700 hover:shadow-xl">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">{t("type")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">{t("amount")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">{t("status")}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">{t("date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-gray-800 transition-colors duration-150 hover:bg-gray-900/50"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center">
                            {getTypeIcon(tx.type) ? (
                              <div className="w-8 h-8 flex items-center justify-center mr-3 bg-gray-900 rounded-full shadow-inner">
                                <Image
                                  src={getTypeIcon(tx.type) || ""}
                                  alt={getTypeDescription(tx.type)}
                                  width={20}
                                  height={20}
                                  className="max-w-full max-h-full"
                                />
                              </div>
                            ) : (
                              <span className="mr-3 text-xl">📝</span>
                            )}
                            <span className="text-base">{getTypeDescription(tx.type)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-base font-medium">{tx.amount.toLocaleString()}</span>{" "}
                          <span className="text-base text-[#4ebd0a]">{tx.token_type}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tx.status === "success"
                                ? "bg-[#4ebd0a]/20 text-[#4ebd0a] border border-[#4ebd0a]/30"
                                : tx.status === "pending"
                                  ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                                  : "bg-[#ff1744]/20 text-[#ff1744] border border-[#ff1744]/30"
                            }`}
                            aria-label={`Estado: ${getStatusTranslation(tx.status)}`}
                          >
                            {getStatusTranslation(tx.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-400">{formatDate(tx.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación mejorada */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center bg-black border border-gray-800 rounded-full overflow-hidden shadow-md transition-all duration-200 hover:border-gray-700">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={`px-4 py-2 flex items-center transition-colors duration-200 ${
                        page === 1 ? "text-gray-500 cursor-not-allowed" : "text-white hover:bg-gray-900"
                      }`}
                      aria-label={t("previous")}
                      aria-disabled={page === 1}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1"
                      >
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                      {t("previous")}
                    </button>

                    <div className="px-4 py-2 border-l border-r border-gray-800 bg-gray-900/30">
                      <span className="text-white font-medium">{page}</span>
                      <span className="text-gray-400 mx-1">{t("of")}</span>
                      <span className="text-white font-medium">{totalPages}</span>
                    </div>

                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className={`px-4 py-2 flex items-center transition-colors duration-200 ${
                        page === totalPages ? "text-gray-500 cursor-not-allowed" : "text-white hover:bg-gray-900"
                      }`}
                      aria-label={t("next")}
                      aria-disabled={page === totalPages}
                    >
                      {t("next")}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="ml-1"
                      >
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
