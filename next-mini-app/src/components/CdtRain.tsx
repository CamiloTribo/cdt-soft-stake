"use client"

import type React from "react"

interface CdtRainProps {
  count: number
  duration: number
}

const CdtRain: React.FC<CdtRainProps> = ({ count, duration }) => {
  // Estilo para el contenedor de la lluvia
  const cdtRainStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    overflow: "hidden",
    zIndex: 1000,
  } as React.CSSProperties

  // Función para crear tokens con más variedad y mejor animación
  const cdtTokenStyle = (index: number): React.CSSProperties => {
    // Usar el índice para crear variación en el tamaño
    const size = 25 + (index % 5) * 5 // Tamaños entre 25px y 45px

    // Posición inicial más distribuida
    const randomX = Math.random() * 100
    const randomDelay = Math.random() * (duration / 2)
    const randomDuration = duration * 0.8 + Math.random() * duration * 0.4
    const randomRotation = Math.random() * 360

    return {
      position: "absolute",
      top: "-10%",
      left: `${randomX}%`,
      width: `${size}px`,
      height: `${size}px`,
      backgroundImage: "url(/TOKEN CDT.png)",
      backgroundSize: "contain",
      backgroundRepeat: "no-repeat",
      animation: `cdtFall${index % 3} ${randomDuration}s ease-in-out forwards`,
      animationDelay: `${randomDelay}s`,
      transform: `rotate(${randomRotation}deg)`,
    } as React.CSSProperties
  }

  return (
    <div style={cdtRainStyle}>
      <style>
        {`
          @keyframes cdtFall0 {
            0% {
              transform: translateY(0) translateX(0) rotate(0deg);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            80% {
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) translateX(0) rotate(360deg);
              opacity: 0;
            }
          }

          @keyframes cdtFall1 {
            0% {
              transform: translateY(0) translateX(0) rotate(0deg);
              opacity: 0;
            }
            15% {
              opacity: 1;
            }
            75% {
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) translateX(0) rotate(-360deg);
              opacity: 0;
            }
          }

          @keyframes cdtFall2 {
            0% {
              transform: translateY(0) translateX(0) rotate(0deg);
              opacity: 0;
            }
            5% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) translateX(0) rotate(360deg);
              opacity: 0;
            }
          }
        `}
      </style>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} style={cdtTokenStyle(index)}></div>
      ))}
    </div>
  )
}

export default CdtRain
