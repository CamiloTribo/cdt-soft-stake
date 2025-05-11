"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { TranslationKey } from "../types/translations"

type LanguageContextType = {
  locale: "es" | "en"
  setLocale: (locale: "es" | "en") => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "es",
  setLocale: () => {},
  t: (key: TranslationKey) => key,
})

// Traducciones de respaldo en caso de que falle la carga
const fallbackTranslations = {
  es: {
    tribo_vault: "Tribo Vault",
    welcome: "Bienvenido a Tribo Vault",
    hello: "Hola",
    buy_cdt: "COMPRAR CDT",
    disconnect: "Desconectar",
    error_updating: "Error al actualizar balance",
    error_loading: "Error al cargar datos",
    how_works_desc:
      "Tribo Vault te permite ganar recompensas diarias basadas en la cantidad de tokens CDT que tienes en tu wallet.",
    username_changes_title: "Actualización del sistema de referidos",
    username_changes_description:
      "Hemos realizado mejoras en el sistema de referidos. Si tu nombre de usuario ha cambiado, no te preocupes: tus referidos anteriores se mantienen intactos y tu nuevo código de referido es ahora tu nombre de usuario actual.",
  },
  en: {
    tribo_vault: "Tribo Vault",
    welcome: "Welcome to Tribo Vault",
    hello: "Hello",
    buy_cdt: "BUY CDT",
    disconnect: "Disconnect",
    error_updating: "Error updating balance",
    error_loading: "Error loading data",
    how_works_desc:
      "Tribo Vault allows you to earn daily rewards based on the amount of CDT tokens you have in your wallet.",
    username_changes_title: "Referral System Update",
    username_changes_description:
      "We've made improvements to the referral system. If your username has changed, don't worry: your previous referrals remain intact and your new referral code is now your current username.",
  },
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<"es" | "en">(() => {
    if (typeof window !== "undefined") {
      const savedLocale = localStorage.getItem("language")
      return (savedLocale === "en" ? "en" : "es") as "es" | "en"
    }
    return "es"
  })

  const [translations, setTranslations] = useState<Record<string, string>>(
    locale === "es" ? fallbackTranslations.es : fallbackTranslations.en,
  )

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        console.log(`Intentando cargar traducciones desde: /messages/${locale}.json`)
        const response = await fetch(`/messages/${locale}.json`)

        if (!response.ok) {
          console.error(`Error al cargar traducciones: ${response.status}`)
          // Usar traducciones de respaldo
          setTranslations(locale === "es" ? fallbackTranslations.es : fallbackTranslations.en)
          return
        }

        const data = await response.json()
        console.log("Traducciones cargadas correctamente:", data)
        setTranslations(data)
      } catch (error) {
        console.error("Error loading translations:", error)
        // Usar traducciones de respaldo
        setTranslations(locale === "es" ? fallbackTranslations.es : fallbackTranslations.en)
      }
    }

    loadTranslations()

    if (typeof window !== "undefined") {
      localStorage.setItem("language", locale)
    }
  }, [locale])

  const t = (key: TranslationKey): string => {
    if (!translations || !translations[key]) {
      console.warn(`Traducción no encontrada para la clave: ${key}`)
      // Intentar usar la traducción de respaldo
      const fallback = locale === "es" ? fallbackTranslations.es : fallbackTranslations.en
      return fallback[key as keyof typeof fallback] || key
    }
    return translations[key]
  }

  return <LanguageContext.Provider value={{ locale, setLocale, t }}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  return useContext(LanguageContext)
}
