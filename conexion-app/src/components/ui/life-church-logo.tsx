import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "white" | "dark"
  size?: "sm" | "md" | "lg"
  showTeam?: boolean
  teamName?: string
  className?: string
}

export function LifeChurchLogo({
  variant = "white",
  size = "md",
  showTeam = true,
  teamName = "Conexión",
  className,
}: LogoProps) {
  const sizeMap = { sm: 28, md: 36, lg: 48 }
  const iconSize = sizeMap[size]
  const color = variant === "white" ? "#ffffff" : "#111111"

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Life Church icon: overlapping squares with "L" */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Back square (outline) */}
        <rect x="4" y="8" width="28" height="28" stroke={color} strokeWidth="2.5" fill="none" />
        {/* Front square (filled) */}
        <rect x="16" y="12" width="28" height="28" fill={color} />
        {/* "L" cutout in front square */}
        <rect x="22" y="18" width="8" height="16" fill={variant === "white" ? "#2563eb" : "#ffffff"} />
        <rect x="22" y="28" width="16" height="6" fill={variant === "white" ? "#2563eb" : "#ffffff"} />
      </svg>

      {/* Text */}
      <div className="flex flex-col leading-none">
        <span
          className="font-black tracking-wider uppercase"
          style={{
            color,
            fontSize: size === "sm" ? 11 : size === "md" ? 14 : 18,
            letterSpacing: "0.08em",
          }}
        >
          LIFE CHURCH
        </span>
        {showTeam && (
          <span
            className="font-semibold tracking-wide"
            style={{
              color,
              fontSize: size === "sm" ? 9 : size === "md" ? 11 : 14,
              opacity: 0.75,
              letterSpacing: "0.06em",
            }}
          >
            Equipo {teamName}
          </span>
        )}
      </div>
    </div>
  )
}
