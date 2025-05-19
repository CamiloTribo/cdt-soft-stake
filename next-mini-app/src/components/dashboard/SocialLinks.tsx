"use client"

import type React from "react"
import Link from "next/link"
import { useTranslation } from "../../../src/components/TranslationProvider"

interface SocialLinksProps {
  isDiscordHovered: boolean
  setIsDiscordHoveredAction: (value: boolean) => void
  isTelegramHovered: boolean
  setIsTelegramHoveredAction: (value: boolean) => void
  isTwitterHovered: boolean
  setIsTwitterHoveredAction: (value: boolean) => void
}

export const SocialLinks: React.FC<SocialLinksProps> = ({
  isDiscordHovered,
  setIsDiscordHoveredAction,
  isTelegramHovered,
  setIsTelegramHoveredAction,
  isTwitterHovered,
  setIsTwitterHoveredAction,
}) => {
  const { t } = useTranslation()

  return (
    <div className="mb-6 grid grid-cols-1 gap-4">
      {/* Botón de Discord - Mejorado */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#5865F2]">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
          </svg>
        </div>
        <Link
          href={process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/BaYaaUsUuN"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-full text-white font-medium transition-all duration-300 bg-[#5865F2] shadow-md"
          onMouseEnter={() => setIsDiscordHoveredAction(true)}
          onMouseLeave={() => setIsDiscordHoveredAction(false)}
          onTouchStart={() => setIsDiscordHoveredAction(true)}
          onTouchEnd={() => setIsDiscordHoveredAction(false)}
        >
          <span className="whitespace-nowrap">{t("join_community")}</span>
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
            className={`transition-transform duration-300 ${isDiscordHovered ? "translate-x-1" : ""}`}
          >
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </Link>
      </div>

      {/* Botón de Telegram - Mejorado */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#0088cc]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="white"
            className="transform translate-x-0.5"
          >
            <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
          </svg>
        </div>
        <Link
          href={process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/cryptodigitaltribe"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-full text-white font-medium transition-all duration-300 bg-[#0088cc] shadow-md"
          onMouseEnter={() => setIsTelegramHoveredAction(true)}
          onMouseLeave={() => setIsTelegramHoveredAction(false)}
          onTouchStart={() => setIsTelegramHoveredAction(true)}
          onTouchEnd={() => setIsTelegramHoveredAction(false)}
        >
          <span className="whitespace-nowrap">{t("join_telegram")}</span>
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
            className={`transition-transform duration-300 ${isTelegramHovered ? "translate-x-1" : ""}`}
          >
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </Link>
      </div>

      {/* Botón de Twitter/X - Mejorado */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
        <Link
          href={process.env.NEXT_PUBLIC_TWITTER_URL || "https://x.com/TriboCDT"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-full text-white font-medium transition-all duration-300 bg-gray-900 shadow-md"
          onMouseEnter={() => setIsTwitterHoveredAction(true)}
          onMouseLeave={() => setIsTwitterHoveredAction(false)}
          onTouchStart={() => setIsTwitterHoveredAction(true)}
          onTouchEnd={() => setIsTwitterHoveredAction(false)}
        >
          <span className="whitespace-nowrap">{t("follow_twitter")}</span>
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
            className={`transition-transform duration-300 ${isTwitterHovered ? "translate-x-1" : ""}`}
          >
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </Link>
      </div>
    </div>
  )
}
