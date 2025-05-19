"use client"

import { useTranslation } from "@/src/components/TranslationProvider"
import ProjectSection from "@/src/components/ProjectSection"
import RoadmapTimeline from "@/src/components/RoadmapTimeline"
import Image from "next/image"
import { useEffect, useState, useRef } from "react"

export default function ProyectoTriboPage() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Usar el nuevo enlace de swap directo en lugar de UNO
  const swapLink = process.env.NEXT_PUBLIC_BUY_CDT_URL || "https://app.uniswap.org/swap"

  useEffect(() => {
    setMounted(true)

    // Simular tiempo de carga para mostrar el spinner
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  // Efecto para observar qué sección está en el viewport
  useEffect(() => {
    if (!mounted) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.3 },
    )

    // Guardamos una copia de las referencias actuales para el cleanup
    const currentRefs = { ...sectionRefs.current }

    // Observar todas las secciones
    Object.values(currentRefs).forEach((ref) => ref && observer.observe(ref))

    return () => {
      // Usamos la copia guardada para el cleanup
      Object.values(currentRefs).forEach((ref) => ref && observer.unobserve(ref))
    }
  }, [mounted])

  // Función para registrar las referencias de las secciones
  const registerSectionRef = (id: string, ref: HTMLDivElement | null) => {
    if (ref) {
      sectionRefs.current[id] = ref
    }
  }

  if (!mounted) return null

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-tribo-green-DEFAULT to-tribo-green-hover opacity-75 blur"></div>
          <div className="relative h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-tribo-green-DEFAULT"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-b-2 border-t-2 border-white opacity-70 animate-spin animate-reverse"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white pb-24">
      {/* Fondo con efecto de partículas sutiles */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(78,189,10,0.1),transparent_70%)]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 relative z-10">
        {/* Encabezado con animación mejorada */}
        <div
          className="flex flex-col items-center justify-center mb-12 text-center"
          ref={(ref) => registerSectionRef("header", ref)}
          id="header"
        >
          <div className="relative mb-6 transform transition-all duration-700 hover:scale-105">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-tribo-green-DEFAULT/30 to-tribo-green-DEFAULT/10 blur-xl"></div>
            <Image
              src="/LOGO TRIBO.png"
              alt="TRIBO Logo"
              width={150}
              height={150}
              className="relative z-10 drop-shadow-[0_0_15px_rgba(78,189,10,0.5)]"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold mb-3 text-white">{t("project_tribo")}</h1>
          <p className="text-gray-300 max-w-2xl text-lg leading-relaxed">{t("project_tribo_subtitle")}</p>

          {/* Navegación rápida */}
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {["mission", "cdt", "roadmap", "community", "next_steps"].map((section) => (
              <button
                key={section}
                onClick={() => {
                  sectionRefs.current[section]?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  })
                }}
                className={`px-4 py-2 rounded-full text-sm transition-all duration-300 ${
                  activeSection === section
                    ? "bg-tribo-green-DEFAULT text-black font-medium shadow-lg shadow-tribo-green-DEFAULT/30"
                    : "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 hover:border-tribo-green-DEFAULT/50"
                }`}
              >
                {t(
                  section === "cdt"
                    ? "what_is_cdt"
                    : section === "mission"
                      ? "our_mission"
                      : section === "roadmap"
                        ? "our_roadmap"
                        : section === "community"
                          ? "join_tribe"
                          : "next_steps",
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Nuestra Misión - Mejorada con animación */}
        <div ref={(ref) => registerSectionRef("mission", ref)} id="mission" className="scroll-mt-16">
          <ProjectSection
            title={t("our_mission")}
            className="transform transition-all duration-500 hover:translate-y-[-5px]"
            titleClassName="text-tribo-green-DEFAULT text-2xl md:text-3xl"
          >
            <p className="text-white leading-relaxed text-lg">{t("mission_text")}</p>

            {/* Valores añadidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {[
                {
                  icon: (
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
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                  ),
                  title: t("transparency"),
                  desc: t("transparency_desc"),
                },
                {
                  icon: (
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
                    >
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                      <path d="M12 8v4l3 3"></path>
                    </svg>
                  ),
                  title: t("sustainability"),
                  desc: t("sustainability_desc"),
                },
                {
                  icon: (
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
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  ),
                  title: t("community"),
                  desc: t("community_desc"),
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-gray-800 p-5 rounded-xl border border-gray-700 transition-all duration-300 hover:border-tribo-green-DEFAULT hover:bg-gray-800/90 hover:shadow-[0_0_15px_rgba(78,189,10,0.2)]"
                >
                  <div className="w-12 h-12 rounded-full bg-tribo-green-DEFAULT/30 flex items-center justify-center mb-3 text-tribo-green-DEFAULT">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-300">{item.desc}</p>
                </div>
              ))}
            </div>
          </ProjectSection>
        </div>

        {/* Ilustración de cohete - Bebé TRIBO - Mejorada */}
        <div className="flex justify-center my-12">
          <div className="w-48 h-48 relative animate-bounce-slow">
            <div className="absolute -inset-4 bg-gradient-to-r from-tribo-green-DEFAULT/30 to-transparent rounded-full blur-xl animate-pulse"></div>
            <Image
              src="/BEBE TRIBO EN COHETE DESPEGUE.png"
              alt={t("baby_tribo_rocket")}
              width={200}
              height={200}
              className="drop-shadow-[0_0_12px_rgba(255,165,0,0.6)] relative z-10"
            />

            {/* Estrellas animadas alrededor */}
            <div className="absolute top-0 left-0 w-3 h-3 bg-yellow-300 rounded-full animate-ping opacity-70"></div>
            <div
              className="absolute bottom-10 right-0 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-70"
              style={{ animationDelay: "0.5s" }}
            ></div>
            <div
              className="absolute top-10 right-5 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-70"
              style={{ animationDelay: "1s" }}
            ></div>
          </div>
        </div>

        {/* ¿Qué es CDT? - Mejorada */}
        <div ref={(ref) => registerSectionRef("cdt", ref)} id="cdt" className="scroll-mt-16">
          <ProjectSection
            title={t("what_is_cdt")}
            className="transform transition-all duration-500 hover:translate-y-[-5px]"
            titleClassName="text-tribo-green-DEFAULT text-2xl md:text-3xl"
          >
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <p className="text-white whitespace-pre-line leading-relaxed text-lg">{t("cdt_description")}</p>

                {/* Características del token con mejor contraste */}
                <div className="mt-6 space-y-3">
                  {[
                    { label: t("staking"), value: "0.2% " + t("daily") + " (73% APY)" },
                    { label: t("monthly"), value: "6%" },
                    { label: t("blockchain"), value: "World Chain" },
                    { label: t("supply"), value: "100,000,000 CDT" },
                    {
                      /* Corregido a 100M */
                    },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700"
                    >
                      <span className="text-white font-medium">{item.label}</span>
                      <span className="text-tribo-green-DEFAULT font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-tribo-green-DEFAULT/40 to-transparent rounded-full blur-xl animate-pulse"></div>
                <Image
                  src="/TOKEN CDT.png"
                  alt="CDT Token"
                  width={180}
                  height={180}
                  className="rounded-full animate-float relative z-10"
                />
              </div>
            </div>
          </ProjectSection>
        </div>

        {/* Roadmap - Mejorado */}
        <div ref={(ref) => registerSectionRef("roadmap", ref)} id="roadmap" className="scroll-mt-16">
          <ProjectSection
            title={t("our_roadmap")}
            className="transform transition-all duration-500 hover:translate-y-[-5px]"
            titleClassName="text-tribo-green-DEFAULT text-2xl md:text-3xl"
          >
            <p className="text-white mb-6 text-lg">{t("roadmap_intro")}</p>

            {/* Timeline mejorado */}
            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-tribo-green-DEFAULT to-gray-800"></div>
              <RoadmapTimeline />
            </div>

            {/* Nuevo apartado para roadmaps completos - Mejorado */}
            <div className="mt-10 p-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 shadow-lg transform transition-all duration-500 hover:shadow-[0_0_25px_rgba(78,189,10,0.2)] hover:border-tribo-green-DEFAULT/30">
              <h3 className="text-2xl font-bold text-tribo-green-DEFAULT mb-4">{t("view_full_roadmap")}</h3>
              <p className="text-white mb-6 text-lg">{t("full_roadmap_description")}</p>
              <a
                href={process.env.NEXT_PUBLIC_WEBSITE_URL || "https://tribocdt.com"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-3 bg-tribo-green-DEFAULT hover:bg-tribo-green-hover text-black font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-tribo-green-DEFAULT/30"
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
                  className="transition-transform duration-300 group-hover:rotate-12"
                >
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                  <path d="M12 8v8" />
                  <path d="M8 12h8" />
                </svg>
                <span className="text-xl">tribocdt.com</span>
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
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M7 7h10v10" />
                  <path d="M7 17 17 7" />
                </svg>
              </a>
            </div>
          </ProjectSection>
        </div>

        {/* Espacio para el futuro mini mapa - Mejorado */}
        <div className="flex justify-center my-12">
          <div className="w-full h-64 bg-gray-800 rounded-xl border border-gray-700 flex items-center justify-center relative overflow-hidden group transition-all duration-300 hover:border-tribo-green-DEFAULT/30 hover:shadow-[0_0_25px_rgba(78,189,10,0.1)]">
            {/* Efecto de mapa de fondo */}
            <div className="absolute inset-0 opacity-30 bg-[url('/abstract-digital-pattern.png')] bg-cover bg-center"></div>

            {/* Puntos de mapa animados */}
            <div className="absolute w-3 h-3 bg-tribo-green-DEFAULT rounded-full top-1/4 left-1/4 animate-ping"></div>
            <div
              className="absolute w-3 h-3 bg-tribo-green-DEFAULT rounded-full top-1/3 right-1/3 animate-ping"
              style={{ animationDelay: "0.7s" }}
            ></div>
            <div
              className="absolute w-3 h-3 bg-tribo-green-DEFAULT rounded-full bottom-1/4 right-1/4 animate-ping"
              style={{ animationDelay: "1.3s" }}
            ></div>

            <div className="relative z-10 text-center p-6">
              <p className="text-white text-lg mb-2 font-medium">{t("countries_map_coming")}</p>
              <p className="text-tribo-green-DEFAULT text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {t("coming_soon")}
              </p>
            </div>
          </div>
        </div>

        {/* Comunidad TRIBO - Mejorada */}
        <div ref={(ref) => registerSectionRef("community", ref)} id="community" className="scroll-mt-16">
          <ProjectSection
            title={t("join_tribe")}
            className="transform transition-all duration-500 hover:translate-y-[-5px]"
            titleClassName="text-tribo-green-DEFAULT text-2xl md:text-3xl"
          >
            <p className="text-white mb-8 text-lg">{t("community_text")}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Telegram */}
              <a
                href={process.env.NEXT_PUBLIC_TELEGRAM_URL || "https://t.me/tribocdt"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg hover:shadow-tribo-green-DEFAULT/20 border border-gray-700 hover:border-tribo-green-DEFAULT/30"
              >
                <div className="w-16 h-16 rounded-full bg-[#0088cc]/20 flex items-center justify-center text-[#0088cc] group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m22 2-7 20-4-9-9-4Z" />
                    <path d="M22 2 11 13" />
                  </svg>
                </div>
                <span className="text-xl font-medium text-white">Telegram</span>
                <span className="text-sm text-gray-300 text-center">{t("telegram_desc")}</span>
                <div className="mt-2 px-4 py-2 rounded-full bg-tribo-green-DEFAULT text-black text-sm font-medium">
                  {t("join_now")}
                </div>
              </a>

              {/* Twitter */}
              <a
                href={process.env.NEXT_PUBLIC_TWITTER_URL || "https://twitter.com/tribocdt"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg hover:shadow-tribo-green-DEFAULT/20 border border-gray-700 hover:border-tribo-green-DEFAULT/30"
              >
                <div className="w-16 h-16 rounded-full bg-[#1DA1F2]/20 flex items-center justify-center text-[#1DA1F2] group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </div>
                <span className="text-xl font-medium text-white">Twitter</span>
                <span className="text-sm text-gray-300 text-center">{t("twitter_desc")}</span>
                <div className="mt-2 px-4 py-2 rounded-full bg-tribo-green-DEFAULT text-black text-sm font-medium">
                  {t("follow_now")}
                </div>
              </a>

              {/* Discord */}
              <a
                href={process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/tribocdt"}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl transition-all duration-300 transform hover:-translate-y-2 hover:shadow-lg hover:shadow-tribo-green-DEFAULT/20 border border-gray-700 hover:border-tribo-green-DEFAULT/30"
              >
                <div className="w-16 h-16 rounded-full bg-[#5865F2]/20 flex items-center justify-center text-[#5865F2] group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="9" cy="12" r="1" />
                    <circle cx="15" cy="12" r="1" />
                    <path d="M7.5 7.5c3.5-1 5.5-1 9 0" />
                    <path d="M7.5 16.5c3.5 1 5.5 1 9 0" />
                    <path d="M15.5 17c0 1 1.5 3 2 3 1.5 0 2.833-1.667 3.5-3 .667-1.667.5-5.833-1.5-11.5-1.457-1.015-3-1.34-4.5-1.5l-1 2.5" />
                    <path d="M8.5 17c0 1-1.356 3-1.832 3-1.429 0-2.698-1.667-3.333-3-.635-1.667-.48-5.833 1.428-11.5C6.151 4.485 7.545 4.16 9 4l1 2.5" />
                  </svg>
                </div>
                <span className="text-xl font-medium text-white">Discord</span>
                <span className="text-sm text-gray-300 text-center">{t("discord_desc")}</span>
                <div className="mt-2 px-4 py-2 rounded-full bg-tribo-green-DEFAULT text-black text-sm font-medium">
                  {t("join_now")}
                </div>
              </a>
            </div>

            {/* Contador de miembros mejorado */}
            <div className="mt-10 bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h4 className="text-xl font-semibold text-white mb-2">{t("growing_community")}</h4>
                  <p className="text-gray-300">{t("join_thousands")}</p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-tribo-green-DEFAULT">10K+</p>
                    <p className="text-sm text-white">{t("members")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-tribo-green-DEFAULT">50+</p>
                    <p className="text-sm text-white">{t("countries")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-tribo-green-DEFAULT">24/7</p>
                    <p className="text-sm text-white">{t("support")}</p>
                  </div>
                </div>
              </div>
            </div>
          </ProjectSection>
        </div>

        {/* Próximos Pasos - Mejorado */}
        <div ref={(ref) => registerSectionRef("next_steps", ref)} id="next_steps" className="scroll-mt-16">
          <ProjectSection
            title={t("next_steps")}
            className="transform transition-all duration-500 hover:translate-y-[-5px]"
            titleClassName="text-tribo-green-DEFAULT text-2xl md:text-3xl"
          >
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <p className="text-white leading-relaxed text-lg mb-6">{t("contract_upgrade")}</p>

                {/* Roadmap de próximos pasos mejorado */}
                <div className="space-y-4">
                  {[
                    {
                      title: t("q2_2025"),
                      desc: t("contract_redeploy"),
                      status: t("in_progress"),
                    },
                    {
                      title: t("q3_2025"),
                      desc: t("governance_platform"),
                      status: t("planned"),
                    },
                    {
                      title: t("q4_2025"),
                      desc: t("market_expansion"),
                      status: t("planned"),
                    },
                  ].map((item, i) => (
                    <div key={i} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center">
                      <div className="w-12 h-12 rounded-full bg-tribo-green-DEFAULT/30 flex items-center justify-center text-tribo-green-DEFAULT mr-4 flex-shrink-0">
                        <span className="font-bold">{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{item.title}</h4>
                        <p className="text-gray-300 text-sm">{item.desc}</p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === t("in_progress")
                            ? "bg-tribo-green-DEFAULT text-black"
                            : "bg-gray-700 text-white"
                        }`}
                      >
                        {item.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-tribo-green-DEFAULT to-green-600 flex items-center justify-center shadow-lg shadow-tribo-green-DEFAULT/20 transform transition-all duration-500 hover:rotate-12">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
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
        </div>

        {/* Llamada a la acción - Mejorada */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-tribo-green-DEFAULT/30 to-transparent rounded-xl blur-xl"></div>
          <div className="relative z-10 bg-gradient-to-br from-gray-900 to-black rounded-xl p-8 border border-tribo-green-DEFAULT/30 shadow-lg">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-3xl font-bold mb-4 text-tribo-green-DEFAULT">{t("ready_to_join")}</h2>
              <p className="text-white mb-8 max-w-2xl text-lg">{t("join_earn_daily")}</p>
              <a
                href={swapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-tribo-green-DEFAULT hover:bg-tribo-green-hover text-black font-bold py-4 px-8 rounded-xl text-center text-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-tribo-green-DEFAULT/30"
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
                  className="transition-transform duration-300 group-hover:rotate-12"
                >
                  <path d="M16 3h5v5"></path>
                  <path d="M4 20 21 3"></path>
                  <path d="M21 16v5h-5"></path>
                  <path d="M15 15 3 3"></path>
                </svg>
                {t("swap_wld_cdt")}
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
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M5 12h14"></path>
                  <path d="m12 5 7 7-7 7"></path>
                </svg>
              </a>
              <p className="text-center text-gray-300 mt-4 text-sm">{t("invest_future")}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
