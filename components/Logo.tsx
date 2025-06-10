"use client"

import Link from "next/link"

export default function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-3 group">
      {/* Logo Icon - Constellation/Neural Network inspired */}
      <div className="relative w-10 h-10 flex items-center justify-center">
        {/* Main constellation pattern */}
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          className="transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-12"
        >
          {/* Background glow */}
          <defs>
            <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
            </radialGradient>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>

          {/* Glow background */}
          <circle cx="20" cy="20" r="18" fill="url(#logoGlow)" />

          {/* Neural network nodes */}
          <circle cx="20" cy="8" r="2" fill="url(#logoGradient)" />
          <circle cx="12" cy="16" r="1.5" fill="url(#logoGradient)" />
          <circle cx="28" cy="16" r="1.5" fill="url(#logoGradient)" />
          <circle cx="8" cy="28" r="1.5" fill="url(#logoGradient)" />
          <circle cx="20" cy="32" r="2" fill="url(#logoGradient)" />
          <circle cx="32" cy="28" r="1.5" fill="url(#logoGradient)" />
          <circle cx="20" cy="20" r="2.5" fill="url(#logoGradient)" />

          {/* Connection lines */}
          <line x1="20" y1="8" x2="20" y2="20" stroke="url(#logoGradient)" strokeWidth="1" opacity="0.6" />
          <line x1="12" y1="16" x2="20" y2="20" stroke="url(#logoGradient)" strokeWidth="1" opacity="0.6" />
          <line x1="28" y1="16" x2="20" y2="20" stroke="url(#logoGradient)" strokeWidth="1" opacity="0.6" />
          <line x1="8" y1="28" x2="20" y2="20" stroke="url(#logoGradient)" strokeWidth="1" opacity="0.6" />
          <line x1="20" y1="32" x2="20" y2="20" stroke="url(#logoGradient)" strokeWidth="1" opacity="0.6" />
          <line x1="32" y1="28" x2="20" y2="20" stroke="url(#logoGradient)" strokeWidth="1" opacity="0.6" />

          {/* Orbital rings */}
          <circle cx="20" cy="20" r="12" fill="none" stroke="url(#logoGradient)" strokeWidth="0.5" opacity="0.3" />
          <circle cx="20" cy="20" r="16" fill="none" stroke="url(#logoGradient)" strokeWidth="0.3" opacity="0.2" />
        </svg>

        {/* Animated particles */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full animate-ping"
              style={{
                left: `${20 + Math.cos((i * 120 * Math.PI) / 180) * 15}px`,
                top: `${20 + Math.sin((i * 120 * Math.PI) / 180) * 15}px`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Company Name */}
      <div className="flex flex-col">
        <span className="text-xl font-semibold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
          Altaira Labs
        </span>
        <span className="text-xs text-slate-400 -mt-0.5 font-medium tracking-wide">AI & AUTOMATION</span>
      </div>
    </Link>
  )
}
