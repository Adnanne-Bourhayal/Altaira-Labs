"use client"

import type React from "react"

import { useState, useRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

interface GlassmorphismButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: "primary" | "secondary" | "outline" | "accent" | "danger"
  size?: "sm" | "md" | "lg"
  href?: string
  disabled?: boolean
  type?: "button" | "submit" | "reset"
}

export default function GlassmorphismButton({
  children,
  onClick,
  className,
  variant = "primary",
  size = "md",
  href,
  disabled = false,
  type = "button",
}: GlassmorphismButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const buttonRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current) return

    const rect = buttonRef.current.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const variantClasses = {
    primary: isDark
      ? "bg-blue-600/30 backdrop-blur-md border border-blue-500/40 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]"
      : "bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    secondary: isDark
      ? "bg-purple-600/30 backdrop-blur-md border border-purple-500/40 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)]"
      : "bg-purple-500/20 backdrop-blur-md border border-purple-500/30 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]",
    outline: isDark
      ? "bg-white/10 backdrop-blur-md border border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]"
      : "bg-white/10 backdrop-blur-md border border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]",
    accent: isDark
      ? "bg-orange-600/30 backdrop-blur-md border border-orange-500/40 text-white shadow-[0_0_20px_rgba(249,115,22,0.5)]"
      : "bg-orange-500/20 backdrop-blur-md border border-orange-500/30 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]",
    danger: isDark
      ? "bg-red-600/30 backdrop-blur-md border border-red-500/40 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]"
      : "bg-red-500/20 backdrop-blur-md border border-red-500/30 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]",
  }

  const sizeClasses = {
    sm: "py-1.5 px-3 text-sm",
    md: "py-2.5 px-5 text-base",
    lg: "py-3 px-6 text-lg",
  }

  const Component = href ? "a" : "button"

  return (
    <Component
      href={href}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "relative overflow-hidden rounded-lg font-medium transition-all duration-300",
        "flex items-center justify-center",
        variantClasses[variant],
        sizeClasses[size],
        isHovered && !disabled && "scale-105",
        isPressed && !disabled && "scale-95",
        disabled && "opacity-60 cursor-not-allowed",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsPressed(false)
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseMove={handleMouseMove}
      ref={buttonRef}
      disabled={disabled}
      type={type}
    >
      {/* Highlight effect that follows mouse */}
      {isHovered && !disabled && (
        <div
          className="absolute w-32 h-32 rounded-full bg-white/20 pointer-events-none mix-blend-soft-light blur-xl transition-transform duration-500"
          style={{
            left: mousePosition.x - 64,
            top: mousePosition.y - 64,
            transform: `scale(${isPressed ? 1.5 : 1})`,
            opacity: isPressed ? 0.8 : 0.5,
          }}
        />
      )}

      {/* Button content */}
      <div className="relative z-10 flex items-center justify-center gap-2">{children}</div>
    </Component>
  )
}

