"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-gray-800 z-40 py-1">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-around items-center">
          {/* Dashboard - Usando el logo de TRIBO Vault */}
          <Link href="/dashboard" className="group flex flex-col items-center py-2" aria-label="Dashboard">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                pathname.includes("/dashboard")
                  ? "bg-[#4ebd0a] shadow-lg shadow-[#4ebd0a]/20"
                  : "bg-gray-800 group-hover:bg-gray-700"
              }`}
            >
              <Image
                src="/LOGO TRIBO Vault- sin fondo.png"
                alt="Dashboard"
                width={28}
                height={28}
                className="transition-transform group-hover:scale-110"
              />
            </div>
          </Link>

          {/* Transactions */}
          <Link href="/transactions" className="group flex flex-col items-center py-2" aria-label="Transactions">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                pathname.includes("/transactions")
                  ? "bg-[#4ebd0a] shadow-lg shadow-[#4ebd0a]/20"
                  : "bg-gray-800 group-hover:bg-gray-700"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={pathname.includes("/transactions") ? "#000" : "#fff"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:scale-110"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
          </Link>

          {/* Profile/Wallet */}
          <Link href="/profile" className="group flex flex-col items-center py-2" aria-label="TRIBO Wallet">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-200 ${
                pathname.includes("/profile")
                  ? "bg-[#4ebd0a] shadow-lg shadow-[#4ebd0a]/20"
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
          </Link>
        </div>
      </div>
    </nav>
  )
}
