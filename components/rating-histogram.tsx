'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Rectangle,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface RatingHistogramProps {
  data: { rating: number; count: number }[];
  title?: string;
  /* The currently selected rating filter (if any) */
  selectedRating?: number | null;
  /* Callback when a bar is clicked */
  onRatingClick?: (rating: number) => void;
}

export function RatingHistogram({
  data,
  title,
  selectedRating,
  onRatingClick,
}: RatingHistogramProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getBarColor = (rating: number) => {
    if (rating >= 4.5) return 'hsl(142, 76%, 36%)'; // emerald
    if (rating >= 3.5) return 'hsl(84, 81%, 44%)'; // lime
    if (rating >= 2.5) return 'hsl(48, 96%, 53%)'; // yellow
    if (rating >= 1.5) return 'hsl(25, 95%, 53%)'; // orange
    return 'hsl(0, 84%, 60%)'; // red
  };

  const totalReviews = data.reduce((sum, d) => sum + d.count, 0);
  const averageRating =
    totalReviews > 0
      ? data.reduce((sum, d) => sum + d.rating * d.count, 0) / totalReviews
      : 0;

  const getBarOpacity = (rating: number, count: number) => {
    if (hoveredRating !== null) {
      return rating === hoveredRating ? 1 : 0.3;
    }
    if (selectedRating !== undefined && selectedRating !== null) {
      return rating === selectedRating ? 1 : 0.3;
    }
    return count > 0 ? 1 : 0.3;
  };

  return (
    <div className="w-full space-y-4">
      {/* Header with Title and Stats */}
      <div className="flex items-center justify-between gap-4">
        {title && <h3 className="text-sm font-medium">{title}</h3>}
        <div className="flex items-baseline gap-2 text-xs sm:text-sm">
          <span
            className="text-lg sm:text-xl font-bold leading-none"
            style={{ color: getBarColor(averageRating) }}
          >
            {averageRating.toFixed(1)}
          </span>
          <span className="font-medium text-muted-foreground">média</span>
          <span className="text-muted-foreground ml-1">•</span>
          <span className="font-medium text-foreground ml-1">
            {totalReviews}
          </span>
          <span className="text-muted-foreground">logs</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-14 [&_*]:outline-none focus:outline-none" tabIndex={-1}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            onMouseLeave={() => setHoveredRating(null)}
            style={{ outline: 'none' }}
          >
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const formattedValue = Number.isInteger(data.rating)
                    ? data.rating
                    : data.rating.toFixed(1);
                  return (
                    <div className="rounded-lg border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-sm">
                      <span className="font-medium">{formattedValue}:</span>{' '}
                      {data.count} logs
                    </div>
                  );
                }
                return null;
              }}
            />
            <XAxis
              dataKey="rating"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) =>
                Number.isInteger(value) ? value : value.toFixed(1)
              }
              interval={0}
              height={15}
            />
            <YAxis type="number" hide domain={[0, maxCount]} />
            <Bar
              dataKey="count"
              radius={[2, 2, 0, 0]}
              barSize={24}
              cursor="pointer"
              onMouseEnter={(data: any) =>
                setHoveredRating(data?.rating ?? null)
              }
              onClick={(data: any) => {
                if (data?.rating !== undefined) {
                  onRatingClick?.(data.rating);
                }
              }}
              style={{ outline: 'none' }}
              shape={(props: any) => {
                const { rating, count } = props.payload;
                return (
                  <Rectangle
                    {...props}
                    fill={getBarColor(rating)}
                    opacity={getBarOpacity(rating, count)}
                    cursor="pointer"
                    style={{ outline: 'none' }}
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Skeleton for loading
export function RatingHistogramSkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-end gap-2">
          <Skeleton className="h-6 w-8" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <Skeleton className="h-14 w-full rounded-md" />
    </div>
  );
}
