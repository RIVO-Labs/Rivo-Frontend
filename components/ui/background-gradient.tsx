"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

interface BackgroundGradientProps {
  className?: string
  containerClassName?: string
  animate?: boolean
}

export function BackgroundGradient({ className, containerClassName, animate = true }: BackgroundGradientProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setPosition({ x, y })
    setOpacity(1)
  }

  const handleMouseLeave = () => {
    setOpacity(0)
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container || !animate) return

    container.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [animate])

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", containerClassName)}>
      <div
        className={cn("pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300", className)}
        style={{
          opacity,
          background: animate
            ? `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(79, 70, 229, 0.15), transparent)`
            : "radial-gradient(600px circle at center, rgba(79, 70, 229, 0.15), transparent)",
        }}
      />
    </div>
  )
}
