"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingInputProps {
  value: number
  onChange: (value: number) => void
  size?: "sm" | "md" | "lg"
  readonly?: boolean
}

export function RatingInput({
  value,
  onChange,
  size = "md",
  readonly = false,
}: RatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }
  
  const gapClasses = {
    sm: "gap-0.5",
    md: "gap-1",
    lg: "gap-1.5",
  }

  const displayValue = hoverValue ?? value
  
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-emerald-500"
    if (rating >= 3.5) return "text-lime-500"
    if (rating >= 2.5) return "text-yellow-500"
    if (rating >= 1.5) return "text-orange-500"
    return "text-red-500"
  }

  const handleClick = (starIndex: number, isHalf: boolean) => {
    if (readonly) return
    const newValue = isHalf ? starIndex + 0.5 : starIndex + 1
    onChange(newValue)
  }

  const handleMouseMove = (
    e: React.MouseEvent<HTMLButtonElement>,
    starIndex: number
  ) => {
    if (readonly) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const isHalf = x < rect.width / 2
    setHoverValue(isHalf ? starIndex + 0.5 : starIndex + 1)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn("flex items-center", gapClasses[size])}
        onMouseLeave={() => !readonly && setHoverValue(null)}
      >
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const fillPercentage = Math.min(
            Math.max((displayValue - starIndex) * 100, 0),
            100
          )

          return (
            <button
              key={starIndex}
              type="button"
              disabled={readonly}
              className={cn(
                "relative transition-transform",
                !readonly && "hover:scale-110 cursor-pointer",
                readonly && "cursor-default"
              )}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const isHalf = x < rect.width / 2
                handleClick(starIndex, isHalf)
              }}
              onMouseMove={(e) => handleMouseMove(e, starIndex)}
            >
              {/* Background star (empty) */}
              <Star
                className={cn(
                  sizeClasses[size],
                  "text-muted-foreground/30",
                  "stroke-current fill-current"
                )}
              />
              {/* Foreground star (filled) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage}%` }}
              >
                <Star
                  className={cn(
                    sizeClasses[size],
                    getRatingColor(displayValue),
                    "stroke-current fill-current"
                  )}
                />
              </div>
            </button>
          )
        })}
      </div>
      <span
        className={cn(
          "font-bold tabular-nums",
          size === "sm" && "text-sm",
          size === "md" && "text-lg",
          size === "lg" && "text-2xl",
          getRatingColor(displayValue)
        )}
      >
        {displayValue.toFixed(1)}
      </span>
    </div>
  )
}

// Read-only display version
export function RatingDisplay({
  value,
  size = "sm",
}: {
  value: number
  size?: "sm" | "md" | "lg"
}) {
  return <RatingInput value={value} onChange={() => {}} size={size} readonly />
}
