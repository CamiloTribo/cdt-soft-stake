"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"

interface CdtButtonRainProps {
  containerClassName?: string
  // Ya no necesitamos isActive porque siempre estarán activos
}

const CdtButtonRain: React.FC<CdtButtonRainProps> = ({ containerClassName = "" }) => {
  const [tokens, setTokens] = useState<
    Array<{ id: number; x: number; y: number; size: number; delay: number; duration: number }>
  >([])

  // Generar tokens cuando el componente se monta
  useEffect(() => {
    // Generar 12 tokens con posiciones aleatorias (más tokens para mejor efecto)
    const newTokens = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // Posición horizontal aleatoria (%)
      y: -20 - Math.random() * 50, // Posiciones iniciales más dispersas
      size: 10 + Math.random() * 8, // Tamaño aleatorio entre 10px y 18px
      delay: Math.random() * 5, // Retraso aleatorio hasta 5s para que no empiecen todos a la vez
      duration: 4 + Math.random() * 3, // Duración aleatoria entre 4s y 7s (más lento)
    }))
    setTokens(newTokens)
  }, []) // Solo se ejecuta al montar el componente

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${containerClassName}`}>
      {tokens.map((token) => (
        <div
          key={token.id}
          className="absolute"
          style={{
            left: `${token.x}%`,
            top: `${token.y}%`,
            width: `${token.size}px`,
            height: `${token.size}px`,
            animation: `cdtTokenFall ${token.duration}s linear infinite`,
            animationDelay: `${token.delay}s`,
          }}
        >
          <Image
            src="/TOKEN CDT.png"
            alt=""
            width={token.size}
            height={token.size}
            className="w-full h-full object-contain opacity-70"
          />
        </div>
      ))}

      <style jsx global>{`
        @keyframes cdtTokenFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(120%) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default CdtButtonRain
