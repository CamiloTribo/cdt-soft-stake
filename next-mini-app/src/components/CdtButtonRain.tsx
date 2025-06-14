"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"

interface CdtButtonRainProps {
  containerClassName?: string
}

// Optimizar el componente CdtButtonRain para mejor rendimiento

const CdtButtonRain: React.FC<CdtButtonRainProps> = ({ containerClassName = "" }) => {
  const [tokens, setTokens] = useState<
    Array<{
      id: number
      x: number
      y: number
      size: number
      delay: number
      duration: number
      type: number
    }>
  >([])

  // Generar tokens cuando el componente se monta - OPTIMIZADO
  useEffect(() => {
    // Crear una función para generar nuevos tokens
    const generateTokens = () => {
      // Reducir la cantidad de tokens para mejor rendimiento (50 en lugar de 80)
      return Array.from({ length: 50 }, (_, i) => ({
        id: i,
        // Distribuir los tokens por todo el ancho del botón
        x: Math.random() * 100,
        // Posiciones iniciales muy dispersas, algunos empezando desde arriba y otros ya en medio
        y: -20 - Math.random() * 100,
        // Tamaños más pequeños para que no se vean lentos
        size: 6 + Math.random() * 8,
        // Retrasos muy cortos para que aparezcan casi inmediatamente
        delay: Math.random() * 1,
        // Duración muy corta para que caigan muy rápido
        duration: 0.5 + Math.random() * 0.8,
        // Reducir tipos de animación para mejor rendimiento (3 en lugar de 5)
        type: Math.floor(Math.random() * 3),
      }))
    }

    // Generar tokens iniciales
    setTokens(generateTokens())

    // Regenerar tokens cada cierto tiempo para mantener el efecto constante
    // Aumentar el intervalo para mejor rendimiento (7 segundos en lugar de 5)
    const interval = setInterval(() => {
      setTokens(generateTokens())
    }, 7000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${containerClassName}`} aria-hidden="true">
      {tokens.map((token) => (
        <div
          key={token.id}
          className="absolute"
          style={{
            left: `${token.x}%`,
            top: `${token.y}%`,
            width: `${token.size}px`,
            height: `${token.size}px`,
            animation: `cdtTokenFall${token.type} ${token.duration}s linear infinite`,
            animationDelay: `${token.delay}s`,
            willChange: "transform",
          }}
        >
          <Image
            src="/TOKEN CDT.png"
            alt=""
            width={token.size}
            height={token.size}
            className="w-full h-full object-contain opacity-90"
          />
        </div>
      ))}

      <style jsx global>{`
        @keyframes cdtTokenFall0 {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.9;
          }
          100% {
            transform: translateY(200%) translateX(20%) rotate(360deg);
            opacity: 0.9;
          }
        }
        @keyframes cdtTokenFall1 {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.9;
          }
          100% {
            transform: translateY(200%) translateX(-20%) rotate(360deg);
            opacity: 0.9;
          }
        }
        @keyframes cdtTokenFall2 {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0.9;
          }
          100% {
            transform: translateY(200%) translateX(0%) rotate(360deg);
            opacity: 0.9;
          }
        }
      `}</style>
    </div>
  )
}

export default CdtButtonRain
