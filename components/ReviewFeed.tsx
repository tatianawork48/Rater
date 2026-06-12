'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, SlidersHorizontal, RefreshCw, TrendingUp, X } from 'lucide-react'
import ReviewCard from './ReviewCard'
import type { Review } from '@/types'
import clsx from 'clsx'

type SortBy = 'recent' | 'highest' | 'lowest' | 'upvoted'

interface FeedData {
  reviews: Review[]
  total: number
  companies: string[]
  categories: string[]
  stats: {
    totalReviews: number
    totalCompanies: number
    averageRating: number
  }
}

const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'recent',  label: 'Most Recent' },
  { key: 'highest', label: 'Highest Score' },
  { key: 'lowest',  label: 'Lowest Score' },
  { key: 'upvoted', label: 'Most Upvoted' },
]

const RELATIONSHIP_OPTIONS = ['All', 'Client', 'Vendor', 'Partner', 'Employee']

const RATING_OPTIONS: { label: string; value: number }[] = [
  { label: 'All', value: 0 },
  { label: '5 stars', value: 5 },
  { label: '4 stars', value: 4 },
  { label: '3 stars', value: 3 },
  { label: '2 stars', value: 2 },
  { label: '1 star',  value: 1 },
]

const TIME_OPTIONS: { label: string; value: string }[] = [
  { label: 'All time',       value: 'all' },
  { label: 'Last 3 months',  value: '3m' },
  { label: 'Last 6 months',  value: '6m' },
  { label: 'Last year',      value: '1y' },
]

const JOB_ROLE_OPTIONS = ['All', 'CEO/Founder', 'Product Manager', 'Engineer', 'Sales', 'Marketing', 'Operations', 'Finance', 'Other']

const RECOMMENDATION_OPTIONS: { label: string; value: string }[] = [
  { label: 'All',                   value: 'all' },
  { label: 'Would work again',      value: 'yes' },
  { label: 'Would not recommend',   value: 'no' },
]

function getTimeCutoff(period: string): Date | null {
  const now = new Date()
  if (period === '3m') return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
  if (period === '6m') return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
  if (period === '1y') return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  return null
}

const JOB_ROLE_MAP: Record<string, string> = { 'CEO/Founder': 'CEO / Founder' }

export default function ReviewFeed() {
  const [data, setData] = useState<FeedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<SortBy>('recent')

  const [relType, setRelType]           = useState('All')
  const [exactRating, setExactRating]   = useState(0)
  const [timePeriod, setTimePeriod]     = useState('all')
  const [jobRole, setJobRole]           = useState('All')
  const [recommendation, setRecommendation] = useState('all')

  const hasActiveFilters =
    relType !== 'All' || exactRating !== 0 || timePeriod !== 'all' || jobRole !== 'All' || recommendation !== 'all'

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('company', search)
      const res = await fetch(`/api/reviews?limit=500&${params}`)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchReviews, 300)
    return () => clearTimeout(t)
  }, [fetchReviews])

  const rawReviews = data?.reviews ?? []

  const reviews = useMemo(() => {
    let filtered = [...rawReviews]

    if (relType !== 'All') {
      filtered = filtered.filter(r => r.relationshipType === relType)
    }

    if (exactRating > 0) {
      filtered = filtered.filter(r => Math.round(r.rating) === exactRating)
    }

    if (timePeriod !== 'all') {
      const cutoff = getTimeCutoff(timePeriod)
      if (cutoff) filtered = filtered.filter(r => new Date(r.timestamp) >= cutoff)
    }

    if (jobRole !== 'All') {
      const actualRole = JOB_ROLE_MAP[jobRole] ?? jobRole
      filtered = filtered.filter(r => r.jobRole === actualRole)
    }

    if (recommendation !== 'all') {
      const wwa = recommendation === 'yes'
      filtered = filtered.filter(r => r.categoryRatings?.wouldWorkAgain === wwa)
    }

    switch (sortBy) {
      case 'recent':  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      case 'highest': return filtered.sort((a, b) => b.rating - a.rating)
      case 'lowest':  return filtered.sort((a, b) => a.rating - b.rating)
      case 'upvoted': return filtered.sort((a, b) => b.upvotes - a.upvotes)
    }
  }, [rawReviews, relType, exactRating, timePeriod, jobRole, recommendation, sortBy])

  function resetFilters() {
    setRelType('All')
    setExactRating(0)
    setTimePeriod('all')
    setJobRole('All')
    setRecommendation('all')
  }

  const pillClass = (active: boolean) => clsx(
    'text-xs px-3 py-1.5 rounded-lg border font-medium transition-all',
    active
      ? 'bg-brand-purple/20 border-brand-purple/40 text-brand-purple-light'
      : 'bg-bg-elevated border-border text-text-secondary hover:border-border-bright'
  )

  return (
    <div className="space-y-6">
      {/* Search, sort & filters */}
      <div className="glass rounded-2xl p-4 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="w-full bg-bg-elevated border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-purple/50 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={clsx(
              'flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all',
              showFilters || hasActiveFilters
                ? 'bg-brand-purple/20 border-brand-purple/40 text-brand-purple-light'
                : 'bg-bg-elevated border-border text-text-secondary hover:border-border-bright'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-brand-purple-light" />}
          </button>
          <button
            onClick={fetchReviews}
            disabled={loading}
            className="p-2.5 rounded-xl bg-bg-elevated border border-border text-text-secondary hover:border-border-bright transition-all disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>

        {/* Sort row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-muted shrink-0">Sort:</span>
          {SORT_OPTIONS.map(({ key, label }) => (
            <button key={key} onClick={() => setSortBy(key)} className={pillClass(sortBy === key)}>
              {label}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="pt-3 border-t border-border space-y-4">
            {hasActiveFilters && (
              <div className="flex justify-end">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
                >
                  <X className="w-3 h-3" />
                  Clear filters
                </button>
              </div>
            )}

            <div>
              <p className="text-xs text-text-muted mb-1.5 font-medium">Relationship Type</p>
              <div className="flex flex-wrap gap-1.5">
                {RELATIONSHIP_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => setRelType(opt)} className={pillClass(relType === opt)}>{opt}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-text-muted mb-1.5 font-medium">Rating</p>
              <div className="flex flex-wrap gap-1.5">
                {RATING_OPTIONS.map(({ label, value }) => (
                  <button key={label} onClick={() => setExactRating(value)} className={pillClass(exactRating === value)}>{label}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-text-muted mb-1.5 font-medium">Time Period</p>
              <div className="flex flex-wrap gap-1.5">
                {TIME_OPTIONS.map(({ label, value }) => (
                  <button key={label} onClick={() => setTimePeriod(value)} className={pillClass(timePeriod === value)}>{label}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-text-muted mb-1.5 font-medium">Job Role</p>
              <div className="flex flex-wrap gap-1.5">
                {JOB_ROLE_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => setJobRole(opt)} className={pillClass(jobRole === opt)}>{opt}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-text-muted mb-1.5 font-medium">Recommendation</p>
              <div className="flex flex-wrap gap-1.5">
                {RECOMMENDATION_OPTIONS.map(({ label, value }) => (
                  <button key={label} onClick={() => setRecommendation(value)} className={pillClass(recommendation === value)}>{label}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Count */}
      {data && (
        <div className="flex items-center justify-between text-sm text-text-muted">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} found
          </span>
          {data.stats && (
            <span>
              Platform avg:{' '}
              <span className="text-rating-gold font-semibold">
                ★ {data.stats.averageRating}
              </span>
            </span>
          )}
        </div>
      )}

      {/* Reviews */}
      {loading && !data && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl h-40 shimmer" />
          ))}
        </div>
      )}

      {!loading && reviews.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <Search className="w-8 h-8 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary font-medium">No reviews found</p>
          <p className="text-text-muted text-sm mt-1">
            Try adjusting your filters or{' '}
            <a href="/submit" className="text-brand-purple-light hover:underline">
              be the first to review
            </a>
          </p>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  )
}
