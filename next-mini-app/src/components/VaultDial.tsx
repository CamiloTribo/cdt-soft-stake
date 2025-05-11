"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"

interface VaultDialProps {
  onUnlockAction: () => void
}

export default function VaultDial({ onUnlockAction }: VaultDialProps) {
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const dialRef = useRef<HTMLDivElement>(null)
  const centerX = useRef(0)
  const centerY = useRef(0)
  const unlockSound = useRef<HTMLAudioElement | null>(null)

  // Calcular el ángulo basado en la posición del mouse/touch
  const calculateAngle = useCallback((clientX: number, clientY: number) => {
    const deltaX = clientX - centerX.current
    const deltaY = clientY - centerY.current
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
    angle = (angle + 90) % 360 // Ajustar para que 0 grados sea arriba
    if (angle < 0) angle += 360
    return angle
  }, [])

  // Efecto de CDT saliendo del centro
  const showCDTEffect = useCallback(() => {
    // Crear elementos CDT y animarlos
    const container = document.createElement("div")
    container.className = "cdt-container"
    document.body.appendChild(container)

    // Crear 20 tokens CDT
    for (let i = 0; i < 20; i++) {
      const cdt = document.createElement("div")
      cdt.className = "cdt-token"

      // Posición aleatoria
      const angle = Math.random() * 360
      const distance = 50 + Math.random() * 150
      const delay = Math.random() * 0.5

      cdt.style.setProperty("--angle", `${angle}deg`)
      cdt.style.setProperty("--distance", `${distance}px`)
      cdt.style.setProperty("--delay", `${delay}s`)

      container.appendChild(cdt)
    }

    // Eliminar después de la animación
    setTimeout(() => {
      document.body.removeChild(container)
    }, 2000)
  }, [])

  // Función de desbloqueo - SIMPLIFICADA
  const unlock = useCallback(() => {
    setIsUnlocked(true)

    // Reproducir sonido
    if (unlockSound.current) {
      unlockSound.current.play().catch((e) => console.error("Error playing sound:", e))
    }

    // Efecto de CDT saliendo del centro
    showCDTEffect()

    // Llamar a la función de desbloqueo después de un breve delay
    setTimeout(() => {
      onUnlockAction()
    }, 1500) // Delay para que primero se vea la animación
  }, [onUnlockAction, showCDTEffect])

  // Inicializar el sonido
  useEffect(() => {
    unlockSound.current = new Audio("/sounds/vault-unlock.mp3")

    // Calcular el centro del dial
    if (dialRef.current) {
      const rect = dialRef.current.getBoundingClientRect()
      centerX.current = rect.left + rect.width / 2
      centerY.current = rect.top + rect.height / 2
    }

    // Mostrar el hint de movimiento durante 3 segundos
    const timer = setTimeout(() => {
      setShowHint(false)
    }, 3000)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  // Recalcular el centro si cambia el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      if (dialRef.current) {
        const rect = dialRef.current.getBoundingClientRect()
        centerX.current = rect.left + rect.width / 2
        centerY.current = rect.top + rect.height / 2
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Manejar el inicio del arrastre
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isUnlocked) return
    setIsDragging(true)
    setShowHint(false)
    const angle = calculateAngle(e.clientX, e.clientY)
    setRotation(angle)
  }

  // Manejar eventos táctiles
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isUnlocked) return
    setIsDragging(true)
    setShowHint(false)
    const touch = e.touches[0]
    const angle = calculateAngle(touch.clientX, touch.clientY)
    setRotation(angle)
  }

  // Configurar los event listeners para el arrastre
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || isUnlocked) return
      const angle = calculateAngle(e.clientX, e.clientY)
      setRotation(angle)

      // Verificar si ha girado lo suficiente para desbloquear (270 grados)
      if (angle > 270) {
        unlock()
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || isUnlocked) return
      e.preventDefault() // Prevenir scroll
      const touch = e.touches[0]
      const angle = calculateAngle(touch.clientX, touch.clientY)
      setRotation(angle)

      // Verificar si ha girado lo suficiente para desbloquear (270 grados)
      if (angle > 270) {
        unlock()
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("touchmove", handleTouchMove, { passive: false })
    window.addEventListener("touchend", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleMouseUp)
    }
  }, [isDragging, isUnlocked, calculateAngle, unlock])

  return (
    <div className="vault-dial-container">
      {/* Hint de movimiento */}
      {showHint && (
        <div className="dial-hint">
          <div className="dial-arrow left"></div>
          <div className="dial-arrow right"></div>
        </div>
      )}

      {/* Dial giratorio */}
      <div
        ref={dialRef}
        className={`vault-dial ${isUnlocked ? "unlocked" : ""} ${showHint ? "hint-animation" : ""}`}
        style={{ transform: `rotate(${rotation}deg)` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <Image src="/vault-dial.png" alt="TRIBO Vault Dial" width={300} height={300} priority />
      </div>

      {/* Efecto de desbloqueo */}
      {isUnlocked && <div className="unlock-effect"></div>}

      <style jsx>{`
        .vault-dial-container {
          position: relative;
          width: 300px;
          height: 300px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
          touch-action: none;
        }
        
        .vault-dial {
          cursor: grab;
          transition: transform 0.1s ease-out;
          will-change: transform;
        }
        
        .vault-dial.unlocked {
          cursor: default;
          animation: unlockPulse 0.5s ease-out;
        }
        
        .vault-dial.hint-animation {
          animation: hintRotation 3s ease-in-out infinite;
        }
        
        .unlock-effect {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(78, 189, 10, 0.8) 0%, rgba(78, 189, 10, 0) 70%);
          animation: expandEffect 1.5s ease-out forwards;
          pointer-events: none;
        }
        
        .dial-hint {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        
        .dial-arrow {
          position: absolute;
          width: 40px;
          height: 40px;
          border-top: 4px solid rgba(255, 255, 255, 0.7);
          border-right: 4px solid rgba(255, 255, 255, 0.7);
          opacity: 0;
        }
        
        .dial-arrow.left {
          top: 50%;
          left: -20px;
          transform: translateY(-50%) rotate(-135deg);
          animation: arrowFade 1.5s ease-in-out infinite;
        }
        
        .dial-arrow.right {
          top: 50%;
          right: -20px;
          transform: translateY(-50%) rotate(45deg);
          animation: arrowFade 1.5s ease-in-out infinite 0.75s;
        }
        
        @keyframes hintRotation {
          0% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
          100% { transform: rotate(-10deg); }
        }
        
        @keyframes unlockPulse {
          0% { transform: rotate(${rotation}deg) scale(1); }
          50% { transform: rotate(${rotation}deg) scale(1.1); }
          100% { transform: rotate(${rotation}deg) scale(1); }
        }
        
        @keyframes expandEffect {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: scale(2); }
        }
        
        @keyframes arrowFade {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      <style jsx global>{`
        /* Estilos para el efecto de CDT */
        .cdt-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1000;
        }
        
        .cdt-token {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 30px;
          height: 30px;
          background-image: url('/TOKEN CDT.png');
          background-size: contain;
          background-repeat: no-repeat;
          transform: translate(-50%, -50%);
          animation: cdtFly calc(1s + var(--delay)) cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards;
          animation-delay: var(--delay);
          opacity: 0;
        }
        
        @keyframes cdtFly {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: 
              translate(
                calc(-50% + (cos(var(--angle)) * var(--distance))), 
                calc(-50% + (sin(var(--angle)) * var(--distance)))
              ) 
              scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
