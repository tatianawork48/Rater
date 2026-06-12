'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Building2, Star, Shield } from 'lucide-react'

interface Stats {
  totalReviews: number
  totalCompanies: number
  averageRating: number
  verifiedCount: number
}

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/reviews')
      .then((r) => r.json())
      .then((d) => setStats(d.stats))
      .catch(() => {})
  }, [])

  const verifiedPct = stats
    ? `${Math.round((stats.verifiedCount / stats.totalReviews) * 100)}%`
    : null

  const items = [
    {
      label: 'Total Reviews',
      value: stats?.totalReviews.toLocaleString() ?? null,
      icon: BarChart3,
      color: 'text-brand-purple-light',
      bg: 'bg-brand-purple/10',
    },
    {
      label: 'Companies Rated',
      value: stats?.totalCompanies.toLocaleString() ?? null,
      icon: Building2,
      color: 'text-brand-cyan',
      bg: 'bg-brand-cyan/10',
    },
    {
      label: 'Platform Rating',
      value: stats ? `★ ${stats.averageRating}` : null,
      icon: Star,
      color: 'text-rating-gold',
      bg: 'bg-rating-gold/10',
    },
    {
      label: 'On-Chain Verified',
      value: verifiedPct,
      icon: Shield,
      color: 'text-status-success',
      bg: 'bg-status-success/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="glass rounded-2xl p-4 flex items-center gap-3"
        >
          <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <div>
            {value !== null ? (
              <p className="text-lg font-bold text-text-primary tabular-nums">{value}</p>
            ) : (
              <div className="h-6 w-10 rounded-md shimmer mb-0.5" />
            )}
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
