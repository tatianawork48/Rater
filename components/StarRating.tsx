'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import clsx from 'clsx'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (rating: number) => void
}

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const effective = interactive ? (hovered || rating) : rating
  const iconSize = sizeMap[size]

  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={`Rating: ${rating} out of ${maxRating}`}>
      {Array.from({ length: maxRating }, (_, i) => {
        const value = i + 1
        const filled = value <= effective
        const partial = !filled && value <= effective + 0.5

        return (
          <button
            key={i}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={() => interactive && onChange?.(value)}
            onMouseEnter={() => interactive && setHovered(value)}
            onMouseLeave={() => interactive && setHovered(0)}
            className={clsx(
              'transition-transform duration-100',
              interactive && 'cursor-pointer hover:scale-110 focus:outline-none',
              !interactive && 'cursor-default'
            )}
            aria-label={interactive ? `Rate ${value} star${value > 1 ? 's' : ''}` : undefined}
          >
            <Star
              className={clsx(
                iconSize,
                'transition-colors duration-150',
                filled
                  ? 'fill-rating-gold text-rating-gold'
                  : partial
                  ? 'fill-rating-gold/50 text-rating-gold/50'
                  : 'fill-none text-text-muted'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

export function RatingBadge({ rating }: { rating: number }) {
  const color =
    rating >= 4
      ? 'bg-status-success/15 text-status-success border-status-success/30'
      : rating >= 3
      ? 'bg-rating-gold/15 text-rating-gold border-rating-gold/30'
      : 'bg-status-error/15 text-status-error border-status-error/30'

  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-sm font-semibold', color)}>
      <Star className="w-3 h-3 fill-current" />
      {rating.toFixed(1)}
    </span>
  )
}
