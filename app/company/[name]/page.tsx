import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield, TrendingUp, TrendingDown, Minus, ArrowLeftRight } from 'lucide-react'
import { format } from 'date-fns'
import { getReviews } from '@/lib/store'
import { computeTrustScore } from '@/lib/trust-score'
import ReviewCard from '@/components/ReviewCard'
import { RatingBadge } from '@/components/StarRating'
import { CategoryBreakdown } from '@/components/CategoryBars'
import RedFlagBanner from '@/components/RedFlagBanner'
import AcpSection from '@/components/AcpSection'
import TrustScoreChart from '@/components/TrustScoreChart'
import ShareButton from '@/components/ShareButton'
import type { Review } from '@/types'

interface Props { params: { name: string } }

function computeTrend(reviews: Review[]): 'improving' | 'stable' | 'declining' {
  if (reviews.length < 2) return 'stable'
  const sorted = [...reviews].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const half = Math.ceil(sorted.length / 2)
  const early = sorted.slice(0, half)
  const recent = sorted.slice(half)
  const avgEarly  = early.reduce((s, r) => s + r.rating, 0) / early.length
  const avgRecent = recent.reduce((s, r) => s + r.rating, 0) / recent.length
  const diff = avgRecent - avgEarly
  if (diff > 0.3) return 'improving'
  if (diff < -0.3) return 'declining'
  return 'stable'
}

export default function CompanyPage({ params }: Props) {
  const companyName = decodeURIComponent(params.name)
  const allReviews  = getReviews()
  const reviews     = allReviews.filter(r => r.company.toLowerCase() === companyName.toLowerCase())

  if (reviews.length === 0) notFound()

  const company    = reviews[0].company
  const trustScore = computeTrustScore(reviews)
  const trend      = computeTrend(reviews)

  // Category averages
  const catKeys = ['paymentContracts', 'communication', 'deliveryQuality', 'reliability'] as const
  const catAvgs = Object.fromEntries(
    catKeys.map(k => [k, reviews.reduce((s, r) => s + (r.categoryRatings?.[k] ?? 0), 0) / reviews.length])
  ) as Record<typeof catKeys[number], number>

  const wouldWorkAgainPct = Math.round(
    (reviews.filter(r => r.categoryRatings?.wouldWorkAgain).length / reviews.length) * 100
  )

  // Rating breakdown
  const breakdown: Record<number, number> = {1:0,2:0,3:0,4:0,5:0}
  reviews.forEach(r => { breakdown[Math.round(r.rating)] = (breakdown[Math.round(r.rating)] || 0) + 1 })

  const sentiment    = trustScore >= 4 ? 'Positive' : trustScore >= 2.5 ? 'Neutral' : 'Negative'
  const sentimentCls = trustScore >= 4
    ? 'text-status-success bg-status-success/10 border-status-success/20'
    : trustScore >= 2.5
    ? 'text-rating-gold bg-rating-gold/10 border-rating-gold/20'
    : 'text-status-error bg-status-error/10 border-status-error/20'

  const ratingCls = trustScore >= 4 ? 'text-status-success'
    : trustScore >= 2.5 ? 'text-rating-gold' : 'text-status-error'

  const TrendIcon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus
  const trendCls  = trend === 'improving' ? 'text-status-success bg-status-success/10 border-status-success/20'
    : trend === 'declining' ? 'text-status-error bg-status-error/10 border-status-error/20'
    : 'text-text-muted bg-bg-elevated border-border'

  // Trust Score history: running score after each review by date
  const sortedByDate = [...reviews].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const historyPoints = sortedByDate.map((_, i) => ({
    label: format(new Date(sortedByDate[i].timestamp), 'MMM yyyy'),
    score: computeTrustScore(sortedByDate.slice(0, i + 1)),
  }))

  const categories = [...new Set(reviews.map(r => r.category))]
  const relationships = reviews.reduce<Record<string, number>>((acc, r) => {
    acc[r.relationshipType] = (acc[r.relationshipType] || 0) + 1
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4"/>All Reviews
      </Link>

      {/* ── Hero card ───────────────────────────────────────── */}
      <div className="glass rounded-2xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
          <div>
            <h1 className="text-3xl font-black text-text-primary mb-2">{company}</h1>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {categories.map(c => (
                <span key={c} className="text-xs px-2.5 py-1 rounded-full glass border border-border text-text-muted">{c}</span>
              ))}
            </div>
            {/* Reviewer mix */}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(relationships).map(([type, count]) => (
                <span key={type} className="text-xs text-text-muted">
                  <span className="text-text-secondary font-medium">{count}</span> {type}{count > 1 ? 's' : ''}
                </span>
              ))}
            </div>
          </div>

          {/* Trust score */}
          <div className="text-right">
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-1">Trust Score</p>
            <p className={`text-6xl font-black tabular-nums ${ratingCls}`}>{trustScore.toFixed(1)}</p>
            <p className="text-text-muted text-sm mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}, out of 5.0</p>
            <p className="text-text-muted text-xs mt-0.5">Weighted by recency, volume &amp; consistency</p>
          </div>
        </div>

        {/* Pills row */}
        <div className="flex flex-wrap gap-2 pb-5 border-b border-border">
          <RatingBadge rating={trustScore}/>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${sentimentCls}`}>
            {sentiment} Sentiment
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 ${trendCls}`}>
            <TrendIcon className="w-3 h-3"/>
            {trend === 'improving' ? 'Improving' : trend === 'declining' ? 'Declining' : 'Stable'}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 text-status-success bg-status-success/10 border-status-success/20">
            <Shield className="w-3 h-3"/>All verified on-chain
          </span>
          <Link
            href={`/compare?a=${encodeURIComponent(company)}`}
            className="text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20 hover:bg-brand-cyan/20 transition-colors"
          >
            <ArrowLeftRight className="w-3 h-3"/>Compare
          </Link>
          <ShareButton company={company} />
        </div>

        {/* Category breakdown + rating bars side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-3">Category Scores</p>
            <CategoryBreakdown ratings={catAvgs} wouldWorkAgainPct={wouldWorkAgainPct}/>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-3">Rating Distribution</p>
            <div className="space-y-2">
              {[5,4,3,2,1].map(star => {
                const count = breakdown[star] || 0
                const pct   = reviews.length > 0 ? (count / reviews.length) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="text-text-muted w-3 text-right">{star}</span>
                    <div className="flex-1 h-2 bg-bg-elevated rounded-full overflow-hidden">
                      <div className="h-full bg-rating-gold rounded-full transition-all duration-700" style={{ width: `${pct}%` }}/>
                    </div>
                    <span className="text-text-muted w-5 text-right tabular-nums">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Trust Score History ─────────────────────────────── */}
      {historyPoints.length >= 2 && (
        <div className="glass rounded-2xl p-6 mb-5">
          <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-4">Trust Score History</p>
          <TrustScoreChart points={historyPoints} />
        </div>
      )}

      {/* ── Red Flag Banner ─────────────────────────────────── */}
      <div className="mb-5">
        <RedFlagBanner company={company}/>
      </div>

      {/* ── ACP Section ─────────────────────────────────────── */}
      <AcpSection company={company} />

      {/* ── Reviews list ────────────────────────────────────── */}
      <h2 className="text-lg font-bold text-text-primary mb-4">
        All Reviews <span className="text-text-muted font-normal text-sm">({reviews.length})</span>
      </h2>
      <div className="space-y-4">
        {reviews.map(review => (
          <ReviewCard key={review.id} review={review}/>
        ))}
      </div>
    </div>
  )
}

export async function generateStaticParams() { return [] }
