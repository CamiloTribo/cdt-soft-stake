"use client"

import Image from "next/image"
import { useWorldAuth } from "next-world-auth/react"
import { LanguageSelector } from "./LanguageSelector"
import { useTranslation } from "./TranslationProvider"
import Link from "next/link"
import { useState, useEffect } from "react"
import { CountryFlag } from "./CountryFlag"

export default function Header() {
  const { signOut, session } = useWorldAuth()
  const { t } = useTranslation()
  const [username, setUsername] = useState<string | null>(null)
  const [country, setCountry] = useState<string | null>(null)

  // Obtener el username personalizado del usuario
  useEffect(() => {
    const fetchUsername = async () => {
      if (session?.user?.walletAddress) {
        try {
          const response = await fetch(`/api/username?wallet_address=${session.user.walletAddress}`)
          if (response.ok) {
            const data = await response.json()
            if (data.username) {
              setUsername(data.username)
            }
            // Obtener el país si existe
            if (data.country) {
              setCountry(data.country)
            }
          }
        } catch (error) {
          console.error("Error fetching username:", error)
        }
      }
    }

    fetchUsername()
  }, [session])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center group">
            <div className="relative overflow-hidden rounded-full p-0.5 bg-gradient-to-r from-purple-500/30 to-blue-500/30 transition-all duration-300 group-hover:from-purple-500/50 group-hover:to-blue-500/50">
              <Image
                src="/LOGO TRIBO Vault- sin fondo.png"
                alt="Tribo Logo"
                width={30}
                height={30}
                className="transition-transform duration-300 group-hover:scale-110"
              />
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector />
          {username && (
            <div className="text-sm bg-gray-800/80 px-3 py-1.5 rounded-full text-white truncate max-w-[150px] flex items-center border border-gray-700/50 shadow-inner">
              {country && <CountryFlag countryCode={country} className="mr-2" />}
              <span className="font-medium">@{username}</span>
            </div>
          )}
          {session && (
            <button
              onClick={signOut}
              className="p-2 rounded-full bg-gray-800/50 border border-gray-700/50 hover:bg-gray-700/70 hover:border-gray-600 active:scale-95 transition-all duration-200"
              title={t("disconnect")}
              aria-label={t("disconnect")}
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
                className="text-gray-300"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
