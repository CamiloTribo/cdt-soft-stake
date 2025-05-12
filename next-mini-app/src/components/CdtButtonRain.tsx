"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"

interface CdtButtonRainProps {
  containerClassName?: string
}

const CdtButtonRain: React.FC<CdtButtonRainProps> = ({ containerClassName = "" }) => {
  const [tokens, setTokens] = useState<
    Array<{
      id: number
      x: number
      y: number
      size: number
      delay: number
      duration: number
      horizontalMovement: number
    }>
  >([])

  // Generar tokens cuando el componente se monta
  useEffect(() => {
    // Aumentar significativamente la cantidad de tokens (de 12 a 40)
    const newTokens = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // Posición horizontal aleatoria (%)
      y: -20 - Math.random() * 80, // Posiciones iniciales mucho más dispersas
      size: 8 + Math.random() * 10, // Tamaño aleatorio entre 8px y 18px
      delay: Math.random() * 2, // Retraso aleatorio reducido a máximo 2s para que aparezcan más rápido
      duration: 1.5 + Math.random() * 2, // Duración más corta entre 1.5s y 3.5s (más rápido)
      horizontalMovement: Math.random() * 40 - 20, // Movimiento horizontal aleatorio entre -20% y +20%
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
            animation: `cdtTokenFall${token.id % 3} ${token.duration}s linear infinite`,
            animationDelay: `${token.delay}s`,
          }}
        >
          <Image
            src="/TOKEN CDT.png"
            alt=""
            width={token.size}
            height={token.size}
            className="w-full h-full object-contain opacity-80"
          />
        </div>
      ))}

      <style jsx global>{`
        @keyframes cdtTokenFall0 {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(150%) translateX(15%) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes cdtTokenFall1 {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(150%) translateX(-15%) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes cdtTokenFall2 {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(150%) translateX(0%) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default CdtButtonRain
