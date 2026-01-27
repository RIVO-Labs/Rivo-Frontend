import type React from "react"
import { cn } from "@/lib/utils"

interface AnimatedGradientTextProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedGradientText({ children, className }: AnimatedGradientTextProps) {
  return (
    <span
      className={cn(
        "inline-flex animate-background-shine bg-[linear-gradient(110deg,#482A6E,45%,#6B46C1,55%,#482A6E)] bg-[length:200%_100%] bg-clip-text text-transparent",
        className,
      )}
    >
      {children}
    </span>
  )
}
