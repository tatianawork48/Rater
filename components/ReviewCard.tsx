'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ExternalLink, ThumbsUp, Hash, CheckCircle, XCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import StarRating from './StarRating'
import { CategoryBarsCompact } from './CategoryBars'
import VerifiedBadge from './VerifiedBadge'
import type { Review } from '@/types'
import clsx from 'clsx'

const RELATIONSHIP_COLORS: Record<string, string> = {
  Client:   'text-brand-cyan   bg-brand-cyan/10   border-brand-cyan/25',
  Vendor:   'text-violet-400   bg-violet-400/10   border-violet-400/25',
  Partner:  'text-brand-purple-light bg-brand-purple/10 border-brand-purple/25',
  Employee: 'text-orange-400   bg-orange-400/10   border-orange-400/25',
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

interface ReviewCardProps {
  review: Review
  compact?: boolean
}

export default function ReviewCard({ review, compact = false }: ReviewCardProps) {
  const [upvotes, setUpvotes] = useState(review.upvotes)
  const [upvoted, setUpvoted] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const relationColor = RELATIONSHIP_COLORS[review.relationshipType] ?? 'text-text-secondary bg-bg-elevated border-border'
  const catColor      = CATEGORY_COLORS[review.category]             ?? 'text-text-muted bg-bg-elevated border-border'

  const ratingColor = review.rating >= 4 ? 'text-status-success'
    : review.rating >= 2.5 ? 'text-rating-gold'
    : 'text-status-error'

  // Real Hedera tx IDs have format <account>@<seconds>.<nanoseconds> (both all-digit segments)
  const isDemoTx = !review.hcsTxId || !/^\d+$/.test((review.hcsTxId.split('@')[1] ?? '').split('.')[0])
  const wwa = review.categoryRatings?.wouldWorkAgain

  return (
    <div className="glass rounded-2xl p-5 hover:border-border-bright transition-all duration-300 hover:shadow-card-hover">
      {/* ── Top row ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <Link
              href={`/company/${encodeURIComponent(review.company)}`}
              className="font-bold text-text-primary hover:text-brand-purple-light transition-colors"
            >
              {review.company}
            </Link>

            <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-md border font-medium', catColor)}>
              {review.category}
            </span>

            <span className={clsx('text-[10px] px-1.5 py-0.5 rounded-md border font-semibold', relationColor)}>
              {review.relationshipType}
            </span>

            {review.isVerified && <VerifiedBadge />}
          </div>

          <Link
            href={`/company/${encodeURIComponent(review.company)}`}
            className="font-semibold text-text-primary leading-snug hover:text-brand-purple-light transition-colors line-clamp-2"
          >
            {review.title}
          </Link>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={clsx('text-2xl font-bold tabular-nums', ratingColor)}>
            {review.rating.toFixed(1)}
          </span>
          <StarRating rating={Math.round(review.rating)} size="sm" />
        </div>
      </div>

      {/* ── Review body ─────────────────────────────────── */}
      {!compact && (
        <p className="text-text-secondary text-sm leading-relaxed mb-3 line-clamp-3">
          {review.content}
        </p>
      )}

      {/* ── Pros / Cons ─────────────────────────────────── */}
      {!compact && (review.pros || review.cons) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {review.pros && (
            <div className="flex items-start gap-1.5 bg-status-success/5 border border-status-success/15 rounded-xl p-2.5">
              <CheckCircle className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold text-status-success uppercase tracking-wide mb-0.5">Pros</p>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{review.pros}</p>
              </div>
            </div>
          )}
          {review.cons && (
            <div className="flex items-start gap-1.5 bg-status-error/5 border border-status-error/15 rounded-xl p-2.5">
              <XCircle className="w-3.5 h-3.5 text-status-error shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-semibold text-status-error uppercase tracking-wide mb-0.5">Cons</p>
                <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">{review.cons}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Category breakdown ──────────────────────────── */}
      {!compact && review.categoryRatings && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors mb-2 w-full text-left"
          >
            {expanded ? <ChevronUp className="w-3 h-3 shrink-0" /> : <ChevronDown className="w-3 h-3 shrink-0" />}
            <span>Category breakdown</span>
            <span className={clsx(
              'ml-1.5 flex items-center gap-1 font-semibold',
              wwa ? 'text-status-success' : 'text-status-error'
            )}>
              {wwa
                ? <><CheckCircle2 className="w-3.5 h-3.5" />Would work again</>
                : <><XCircle className="w-3.5 h-3.5" />Would not recommend</>
              }
            </span>
          </button>

          {expanded && (
            <div className="bg-bg-elevated/60 rounded-xl p-3">
              <CategoryBarsCompact ratings={review.categoryRatings} />
            </div>
          )}
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
        <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Hash className="w-3 h-3" />
            {review.reviewerHash}
          </span>
          {review.jobRole && (
            <span className="text-text-muted/70">{review.jobRole}</span>
          )}
          <span className="text-text-muted/70">{review.relationshipType}</span>
          <span>{format(new Date(review.timestamp), 'MMM d, yyyy')}</span>
        </div>

        <div className="flex items-center gap-2">
          {!isDemoTx && (
            <a
              href={`https://hashscan.io/testnet/transaction/${review.hcsTxId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-text-muted hover:text-brand-purple-light transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              HashScan
            </a>
          )}
          {review.nftSerial && (
            <span className="text-xs text-brand-purple-light bg-brand-purple/10 border border-brand-purple/20 px-1.5 py-0.5 rounded-md">
              NFT #{review.nftSerial}
            </span>
          )}
          <button
            onClick={() => { setUpvoted(v => !v); setUpvotes(v => v + (upvoted ? -1 : 1)) }}
            className={clsx(
              'flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-all',
              upvoted
                ? 'text-brand-purple-light bg-brand-purple/15 border-brand-purple/30'
                : 'text-text-muted border-border hover:border-border-bright hover:text-text-secondary'
            )}
          >
            <ThumbsUp className="w-3 h-3" />
            {upvotes}
          </button>
        </div>
      </div>
    </div>
  )
}
