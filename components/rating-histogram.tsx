"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface RatingHistogramProps {
  data: { rating: number; count: number }[]
  title?: string
}

export function RatingHistogram({ data, title }: RatingHistogramProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)
  
  const getBarColor = (rating: number) => {
    if (rating >= 4.5) return "hsl(142, 76%, 36%)" // emerald
    if (rating >= 3.5) return "hsl(84, 81%, 44%)" // lime
    if (rating >= 2.5) return "hsl(48, 96%, 53%)" // yellow
    if (rating >= 1.5) return "hsl(25, 95%, 53%)" // orange
    return "hsl(0, 84%, 60%)" // red
  }

  const totalReviews = data.reduce((sum, d) => sum + d.count, 0)
  const averageRating =
    totalReviews > 0
      ? data.reduce((sum, d) => sum + d.rating * d.count, 0) / totalReviews
      : 0

  return (
    <div className="w-full space-y-4">
      {/* Header with Title and Stats */}
      <div className="flex items-center justify-between gap-4">
        {title && <h3 className="text-sm font-medium">{title}</h3>}
        <div className="flex items-baseline gap-2 text-xs sm:text-sm">
          <span className="text-lg sm:text-xl font-bold leading-none" style={{ color: getBarColor(averageRating) }}>
            {averageRating.toFixed(1)}
          </span>
          <span className="font-medium text-muted-foreground">média</span>
          <span className="text-muted-foreground ml-1">•</span>
          <span className="font-medium text-foreground ml-1">{totalReviews}</span>
          <span className="text-muted-foreground">logs</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-14">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          >
            <XAxis
              dataKey="rating"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => value.toFixed(1)}
              interval={0}
              height={15}
            />
            <YAxis type="number" hide domain={[0, maxCount]} />
            <Bar
              dataKey="count"
              radius={[2, 2, 0, 0]}
              barSize={24}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.rating)}
                  opacity={entry.count > 0 ? 1 : 0.2}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// Skeleton for loading
export function RatingHistogramSkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="h-6 w-24 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-14 bg-muted rounded animate-pulse" />
    </div>
  )
}
