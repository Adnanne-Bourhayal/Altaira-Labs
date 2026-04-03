"use client"

export default function Logo({ size = "default" }: { size?: "default" | "small" | "large" }) {
  const sizes = {
    small: { icon: 24, text: "text-lg" },
    default: { icon: 28, text: "text-xl" },
    large: { icon: 36, text: "text-2xl" },
  }

  const { icon, text } = sizes[size]

  return (
    <div className="flex items-center space-x-2 group cursor-pointer">
      <div className="relative">
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          {/* Minimal geometric A mark */}
          <path
            d="M14 3L26 25H21L18.5 20H9.5L7 25H2L14 3Z"
            fill="url(#logoGradient)"
          />
          <path
            d="M14 10L17.5 17H10.5L14 10Z"
            fill="#050810"
          />
          <defs>
            <linearGradient id="logoGradient" x1="2" y1="3" x2="26" y2="25" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span className={`${text} font-semibold tracking-tight text-white`}>
        Altaira<span className="text-blue-400">Labs</span>
      </span>
    </div>
  )
}
