"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useTranslation } from "./TranslationProvider"

export default function Navbar() {
  const pathname = usePathname()
  const { t } = useTranslation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-40">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-around">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center py-3 px-4 ${
              pathname.includes("/dashboard") ? "text-[#4ebd0a]" : "text-gray-400 hover:text-white"
            }`}
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
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
            <span className="text-xs mt-1">{t("dashboard")}</span>
          </Link>

          <Link
            href="/transactions"
            className={`flex flex-col items-center py-3 px-4 ${
              pathname.includes("/transactions") ? "text-[#4ebd0a]" : "text-gray-400 hover:text-white"
            }`}
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
            <span className="text-xs mt-1">{t("transactions")}</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
