"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useWorldAuth } from "next-world-auth/react"
import Image from "next/image"
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
    return date.toLocaleDateString() + " " + date.toLocaleTimeString()
  }

  // Función para obtener el color según el estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-[#4ebd0a]"
      case "pending":
        return "text-yellow-500"
      case "failed":
        return "text-[#ff1744]"
      default:
        return "text-gray-400"
    }
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
        return "Apoyo"
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4ebd0a]"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-black text-white">
      <div className="max-w-4xl mx-auto">
        {/* Header con selector de idioma */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-gray-800 mb-8">
          <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              <Image src="/LOGO TRIBO Vault- sin fondo.png" alt="Tribo Logo" width={28} height={28} />
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector />
            </div>
          </div>
        </div>

        <div className="pt-16">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">{t("transaction_history")}</h1>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 text-sm bg-black border border-gray-700 rounded-md hover:bg-gray-900 transition-colors"
            >
              {t("back_to_dashboard")}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-black border border-[#ff1744] rounded-md">
              <p className="text-[#ff1744]">{error}</p>
            </div>
          )}

          {transactions.length === 0 ? (
            <div className="bg-black rounded-md shadow-lg p-6 border border-gray-800 text-center">
              <p className="text-gray-400">{t("no_transactions")}</p>
            </div>
          ) : (
            <>
              <div className="bg-black rounded-md shadow-lg border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
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
                        <tr key={tx.id} className="border-b border-gray-800 hover:bg-gray-900">
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              {getTypeIcon(tx.type) ? (
                                <div className="w-8 h-8 flex items-center justify-center mr-3">
                                  <Image
                                    src={getTypeIcon(tx.type) || ""}
                                    alt={getTypeDescription(tx.type)}
                                    width={32}
                                    height={32}
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
                            <span className="font-mono text-base">{tx.amount.toLocaleString()}</span>{" "}
                            <span className="text-base">{tx.token_type}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`${getStatusColor(tx.status)} text-base`}>
                              {getStatusTranslation(tx.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-base text-gray-400">{formatDate(tx.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className={`px-3 py-1 rounded-md ${
                        page === 1
                          ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                          : "bg-gray-800 text-white hover:bg-gray-700"
                      }`}
                    >
                      {t("previous")}
                    </button>
                    <span className="px-3 py-1 bg-gray-800 rounded-md">
                      {page} {t("of")} {totalPages}
                    </span>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className={`px-3 py-1 rounded-md ${
                        page === totalPages
                          ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                          : "bg-gray-800 text-white hover:bg-gray-700"
                      }`}
                    >
                      {t("next")}
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
