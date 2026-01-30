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
}

export function RatingHistogram({ data }: RatingHistogramProps) {
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
    <div className="w-full">
      {/* Stats */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Média</p>
          <p className="text-2xl font-bold" style={{ color: getBarColor(averageRating) }}>
            {averageRating.toFixed(1)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{totalReviews}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 0, bottom: 0, left: 28 }}
          >
            <XAxis type="number" hide domain={[0, maxCount]} />
            <YAxis
              type="category"
              dataKey="rating"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => value.toFixed(1)}
              width={24}
            />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              barSize={10}
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
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1">
          <div className="h-4 w-12 bg-muted rounded animate-pulse" />
          <div className="h-8 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-1 text-right">
          <div className="h-4 w-10 bg-muted rounded animate-pulse ml-auto" />
          <div className="h-8 w-12 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="h-32 bg-muted rounded animate-pulse" />
    </div>
  )
}
