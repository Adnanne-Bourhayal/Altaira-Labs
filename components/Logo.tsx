"use client"

export default function Logo({ size = "default" }: { size?: "default" | "small" | "large" }) {
  const sizes = {
    small: { icon: 28, text: "text-lg" },
    default: { icon: 32, text: "text-xl" },
    large: { icon: 40, text: "text-2xl" },
  }

  const { icon, text } = sizes[size]

  return (
    <div className="flex items-center space-x-2.5 group cursor-pointer">
      <div className="relative">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-110"
        >
          {/* Outer ring */}
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="url(#logoGrad)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.6"
          />
          {/* Inner geometric shape - abstract A */}
          <path
            d="M16 6L24 24H20L18 19H14L12 24H8L16 6Z"
            fill="url(#logoGrad)"
          />
          {/* Center dot */}
          <circle cx="16" cy="15" r="2" fill="white" opacity="0.9" />
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className={`${text} font-semibold tracking-tight`}>
        <span className="text-white">Altaira</span>
        <span className="text-blue-400">Labs</span>
      </div>
    </div>
  )
}
