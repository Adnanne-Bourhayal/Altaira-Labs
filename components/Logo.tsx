"use client"

import Image from "next/image"

export default function Logo({
  size = "default",
  showText = true,
  variant = "white",
}: {
  size?: "default" | "small" | "large" | "favicon"
  showText?: boolean
  variant?: "white" | "blue"
  tone?: "light" | "dark"
}) {
  const sizes = {
    favicon: { width: 72, height: 9 },
    small: { width: 190, height: 24 },
    default: { width: 250, height: 32 },
    large: { width: 320, height: 41 },
  }

  const { width, height } = sizes[size]
  const src = variant === "blue" ? "/brand/logo-blue.png" : "/brand/logo-white.png"

  return (
    <div className="flex items-center">
      <Image
        src={src}
        alt="Altaira Labs"
        width={width}
        height={height}
        priority={size !== "small"}
        className="h-auto max-h-12 w-auto object-contain"
      />
      {!showText && <span className="sr-only">Altaira Labs</span>}
    </div>
  )
}
