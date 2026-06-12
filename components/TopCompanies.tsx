'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Activity } from 'lucide-react'
import { computeTrustScore } from '@/lib/trust-score'
import type { Review } from '@/types'
import clsx from 'clsx'

const CAT_KEYS = ['paymentContracts', 'communication', 'deliveryQuality', 'reliability'] as const
const CAT_SHORT: Record<string, string> = {
  paymentContracts: 'Payment',
  communication: 'Comms',
  deliveryQuality: 'Delivery',
  reliability: 'Reliability',
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

interface CompanyEntry {
  name: string
  category: string
  score: number
  reviewCount: number
  isActive: boolean
  catAvgs: { key: string; label: string; avg: number }[]
  bestCat: { label: string; avg: number }
  worstCat: { label: string; avg: number }
}

const CATEGORY_COLORS: Record<string, string> = {
  'CRM / Enterprise Software':           'text-blue-400   bg-blue-400/10   border-blue-400/20',
  'CRM / Marketing Automation':          'text-blue-400   bg-blue-400/10   border-blue-400/20',
  'Cloud Infrastructure':                'text-sky-400    bg-sky-400/10    border-sky-400/20',
  'Payments / Fintech':                  'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  'Productivity / Collaboration':        'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20',
  'Design / Collaboration':              'text-pink-400   bg-pink-400/10   border-pink-400/20',
  'Business Communication':              'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  'Developer Tools / Project Management':'text-orange-400 bg-orange-400/10 border-orange-400/20',
  'Video Conferencing':                  'text-teal-400   bg-teal-400/10   border-teal-400/20',
  'Legal / Contract Management':         'text-rose-400   bg-rose-400/10   border-rose-400/20',
}

function rankBadgeClass(i: number) {
  if (i === 0) return 'bg-rating-gold/20 text-rating-gold border border-rating-gold/30'
  if (i === 1) return 'bg-text-muted/15 text-text-secondary border border-text-muted/20'
  if (i === 2) return 'bg-orange-900/20 text-orange-400 border border-orange-400/25'
  return 'bg-bg-elevated text-text-muted border border-border'
}

function scoreColor(s: number) {
  return s >= 4 ? 'text-status-success' : s >= 2.5 ? 'text-rating-gold' : 'text-status-error'
}

export default function TopCompanies() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetch('/api/reviews?limit=500')
      .then(r => r.json())
      .then(d => setReviews(d.reviews ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const leaderboard = useMemo<CompanyEntry[]>(() => {
    const now = Date.now()
    const byCompany = new Map<string, Review[]>()
    for (const r of reviews) {
      byCompany.set(r.company, [...(byCompany.get(r.company) ?? []), r])
    }

    return [...byCompany.entries()]
      .map(([name, rs]) => {
        const isActive = rs.some(r => now - new Date(r.timestamp).getTime() < NINETY_DAYS_MS)
        const catAvgs = CAT_KEYS.map(k => ({
          key: k,
          label: CAT_SHORT[k],
          avg: rs.reduce((s, r) => s + (r.categoryRatings?.[k] ?? 0), 0) / rs.length,
        }))
        const sorted = [...catAvgs].sort((a, b) => b.avg - a.avg)
        return {
          name,
          category: rs[0]?.category ?? '',
          score: computeTrustScore(rs),
          reviewCount: rs.length,
          isActive,
          catAvgs,
          bestCat: sorted[0],
          worstCat: sorted[sorted.length - 1],
        }
      })
      .sort((a, b) => b.score - a.score)
  }, [reviews])

  const visible = showAll ? leaderboard : leaderboard.slice(0, 5)

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl shimmer" />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map((c, i) => {
          const catColor = CATEGORY_COLORS[c.category] ?? 'text-text-muted bg-bg-elevated border-border'
          return (
            <Link
              key={c.name}
              href={`/company/${encodeURIComponent(c.name)}`}
              className="glass rounded-2xl p-4 hover:border-border-bright transition-all duration-200 hover:shadow-card-hover flex flex-col gap-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={clsx(
                      'w-7 h-5 flex items-center justify-center rounded text-[10px] font-bold tabular-nums shrink-0',
                      rankBadgeClass(i)
                    )}>
                      #{i + 1}
                    </span>
                    {c.isActive && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-status-success bg-status-success/10 border border-status-success/20 px-1.5 py-0.5 rounded-md">
                        <Activity className="w-2.5 h-2.5" />
                        Active
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-text-primary text-sm leading-tight">{c.name}</p>
                  <span className={clsx('inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded border font-medium', catColor)}>
                    {c.category}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <p className={clsx('text-3xl font-black tabular-nums leading-none', scoreColor(c.score))}>
                    {c.score.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    {c.reviewCount} review{c.reviewCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Mini category bars */}
              <div className="space-y-1.5">
                <MiniBar label={c.bestCat.label} value={c.bestCat.avg} isHigh />
                <MiniBar label={c.worstCat.label} value={c.worstCat.avg} isHigh={false} />
              </div>
            </Link>
          )
        })}
      </div>

      {leaderboard.length > 5 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full mt-3 py-2.5 rounded-xl glass border border-border hover:border-border-bright text-sm text-text-secondary hover:text-text-primary transition-all flex items-center justify-center gap-1.5"
        >
          {showAll ? (
            <><ChevronUp className="w-4 h-4" />Show less</>
          ) : (
            <><ChevronDown className="w-4 h-4" />View all {leaderboard.length} companies</>
          )}
        </button>
      )}
    </div>
  )
}

function MiniBar({ label, value, isHigh }: { label: string; value: number; isHigh: boolean }) {
  const pct = ((value - 1) / 4) * 100
  const barColor = isHigh
    ? 'bg-status-success'
    : value < 2.5 ? 'bg-status-error' : 'bg-rating-gold'

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-text-muted w-16 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-text-muted tabular-nums w-6 text-right">{value.toFixed(1)}</span>
      <span className={clsx('text-[10px] font-bold', isHigh ? 'text-status-success' : 'text-status-error')}>
        {isHigh ? '▲' : '▼'}
      </span>
    </div>
  )
}
