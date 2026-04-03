"use client"

export default function Logo({ 
  size = "default",
  showText = true 
}: { 
  size?: "default" | "small" | "large" | "favicon"
  showText?: boolean
}) {
  const sizes = {
    favicon: { icon: 32, text: "text-lg", gap: "gap-2" },
    small: { icon: 26, text: "text-lg", gap: "gap-2" },
    default: { icon: 32, text: "text-xl", gap: "gap-2.5" },
    large: { icon: 40, text: "text-2xl", gap: "gap-3" },
  }

  const { icon, text, gap } = sizes[size]

  return (
    <div className={`flex items-center ${gap} group cursor-pointer`}>
      <div className="relative">
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
        
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative transition-transform duration-300 group-hover:scale-105"
        >
          {/* Premium futuristic A mark - clean geometric design */}
          {/* Main outer A shape */}
          <path
            d="M16 2L30 28H24.5L21 21H11L7.5 28H2L16 2Z"
            fill="url(#altairaGradient)"
          />
          {/* Inner cut - creates the A crossbar void */}
          <path
            d="M16 9L20 17H12L16 9Z"
            fill="#050810"
          />
          {/* Subtle highlight line on left edge */}
          <path
            d="M16 2L7.5 28H2L16 2Z"
            fill="url(#altairaHighlight)"
            opacity="0.3"
          />
          
          <defs>
            {/* Electric blue gradient - deep to bright */}
            <linearGradient id="altairaGradient" x1="2" y1="28" x2="30" y2="2" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1d4ed8" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
            {/* Highlight gradient for dimension */}
            <linearGradient id="altairaHighlight" x1="2" y1="28" x2="16" y2="2" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {showText && (
        <span className={`${text} font-semibold tracking-tight`}>
          <span className="text-white">Altaira</span>
          <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">Labs</span>
        </span>
      )}
    </div>
  )
}
