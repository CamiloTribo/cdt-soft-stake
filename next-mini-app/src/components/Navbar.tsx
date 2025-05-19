"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useTranslation } from "./TranslationProvider"

export default function Navbar() {
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-gray-800 z-40 py-1">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-around items-center">
          {/* Dashboard - Usando el logo de TRIBO Vault */}
          <Link href="/dashboard" className="group flex flex-col items-center py-2" aria-label={t("dashboard")}>
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                pathname.includes("/dashboard")
                  ? "bg-primary shadow-lg shadow-primary/20"
                  : "bg-gray-800 group-hover:bg-gray-700"
              }`}
            >
              <Image
                src="/LOGO TRIBO Vault- sin fondo.png"
                alt={t("dashboard")}
                width={28}
                height={28}
                className="transition-transform group-hover:scale-110"
              />
            </div>
            <span className={`mt-1 text-xs ${pathname.includes("/dashboard") ? "text-primary" : "text-gray-400"}`}>
              {t("home")}
            </span>
          </Link>

          {/* Proyecto TRIBO */}
          <Link
            href="/proyecto-tribo"
            className="group flex flex-col items-center py-2"
            aria-label={t("project_tribo")}
          >
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                pathname.includes("/proyecto-tribo")
                  ? "bg-primary shadow-lg shadow-primary/20"
                  : "bg-gray-800 group-hover:bg-gray-700"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={pathname.includes("/proyecto-tribo") ? "#000" : "#fff"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:scale-110"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                <path d="M2 12h20"></path>
              </svg>
            </div>
            <span className={`mt-1 text-xs ${pathname.includes("/proyecto-tribo") ? "text-primary" : "text-gray-400"}`}>
              {t("project")}
            </span>
          </Link>

          {/* Rankings */}
          <Link href="/rankings" className="group flex flex-col items-center py-2" aria-label={t("rankings")}>
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                pathname.includes("/rankings")
                  ? "bg-primary shadow-lg shadow-primary/20"
                  : "bg-gray-800 group-hover:bg-gray-700"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={pathname.includes("/rankings") ? "#000" : "#fff"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:scale-110"
              >
                <path d="M18 21v-8M12 21V9M6 21v-4"></path>
                <path d="M18 3v4M12 3v2M6 3v8"></path>
              </svg>
            </div>
            <span className={`mt-1 text-xs ${pathname.includes("/rankings") ? "text-primary" : "text-gray-400"}`}>
              {t("rankings")}
            </span>
          </Link>

          {/* Profile/Wallet */}
          <Link href="/profile" className="group flex flex-col items-center py-2" aria-label={t("tribo_wallet")}>
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                pathname.includes("/profile")
                  ? "bg-primary shadow-lg shadow-primary/20"
                  : "bg-gray-800 group-hover:bg-gray-700"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={pathname.includes("/profile") ? "#000" : "#fff"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:scale-110"
              >
                <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
                <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
              </svg>
            </div>
            <span className={`mt-1 text-xs ${pathname.includes("/profile") ? "text-primary" : "text-gray-400"}`}>
              {t("wallet")}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
