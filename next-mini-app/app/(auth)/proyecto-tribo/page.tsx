"use client"

import { useTranslation } from "@/src/components/TranslationProvider"
import ProjectSection from "@/src/components/ProjectSection"
import RoadmapTimeline from "@/src/components/RoadmapTimeline"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function ProyectoTriboPage() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        {/* Encabezado */}
        <div className="flex flex-col items-center justify-center mb-8 text-center">
          <Image src="/LOGO TRIBO.png" alt="TRIBO Logo" width={120} height={120} className="mb-4" />
          <h1 className="text-3xl font-bold mb-2">{t("project_tribo")}</h1>
          <p className="text-gray-400 max-w-2xl">Revolucionando las finanzas digitales a través de la comunidad</p>
        </div>

        {/* Nuestra Misión */}
        <ProjectSection title={t("our_mission")}>
          <p className="text-gray-200 leading-relaxed">{t("mission_text")}</p>
        </ProjectSection>

        {/* ¿Qué es CDT? */}
        <ProjectSection title={t("what_is_cdt")}>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <p className="text-gray-200 whitespace-pre-line leading-relaxed">{t("cdt_description")}</p>
            </div>
            <div className="flex-shrink-0">
              <Image
                src="/TOKEN CDT.png"
                alt="CDT Token"
                width={120}
                height={120}
                className="rounded-full animate-pulse-slow"
              />
            </div>
          </div>
        </ProjectSection>

        {/* Roadmap */}
        <ProjectSection title={t("our_roadmap")}>
          <p className="text-gray-200 mb-4">{t("roadmap_intro")}</p>
          <RoadmapTimeline />
        </ProjectSection>

        {/* Comunidad TRIBO */}
        <ProjectSection title={t("join_tribe")}>
          <p className="text-gray-200 mb-6">{t("community_text")}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Telegram */}
            <a
              href={process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/tribocdt"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-[#4ebd0a]/20"
            >
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
                className="text-[#4ebd0a]"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              <span>Telegram</span>
            </a>

            {/* Twitter */}
            <a
              href={process.env.NEXT_PUBLIC_TWITTER_URL || "https://twitter.com/tribocdt"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-[#4ebd0a]/20"
            >
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
                className="text-[#4ebd0a]"
              >
                <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
              </svg>
              <span>Twitter</span>
            </a>

            {/* Discord */}
            <a
              href={process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/tribocdt"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 p-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-[#4ebd0a]/20"
            >
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
                className="text-[#4ebd0a]"
              >
                <circle cx="9" cy="12" r="1" />
                <circle cx="15" cy="12" r="1" />
                <path d="M7.5 7.5c3.5-1 5.5-1 9 0" />
                <path d="M7.5 16.5c3.5 1 5.5 1 9 0" />
                <path d="M15.5 17c0 1 1.5 3 2 3 1.5 0 2.833-1.667 3.5-3 .667-1.667.5-5.833-1.5-11.5-1.457-1.015-3-1.34-4.5-1.5l-1 2.5" />
                <path d="M8.5 17c0 1-1.356 3-1.832 3-1.429 0-2.698-1.667-3.333-3-.635-1.667-.48-5.833 1.428-11.5C6.151 4.485 7.545 4.16 9 4l1 2.5" />
              </svg>
              <span>Discord</span>
            </a>
          </div>
        </ProjectSection>

        {/* Próximos Pasos */}
        <ProjectSection title={t("next_steps")}>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <p className="text-gray-200 leading-relaxed">{t("contract_upgrade")}</p>
            </div>
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4ebd0a] to-green-700 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  <path d="M5 3v4" />
                  <path d="M19 17v4" />
                  <path d="M3 5h4" />
                  <path d="M17 19h4" />
                </svg>
              </div>
            </div>
          </div>
        </ProjectSection>

        {/* Llamada a la acción */}
        <div className="mt-10">
          <Link
            href={process.env.NEXT_PUBLIC_BUY_CDT_URL || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-[#4ebd0a] to-green-600 hover:from-green-600 hover:to-[#4ebd0a] text-black font-bold py-4 px-6 rounded-xl text-center text-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-[#4ebd0a]/30"
          >
            {t("swap_wld_cdt")}
          </Link>
          <p className="text-center text-gray-400 mt-3 text-sm">{t("invest_future")}</p>
        </div>
      </div>
    </main>
  )
}
