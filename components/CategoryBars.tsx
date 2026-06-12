import type { CategoryRatings } from '@/types'
import clsx from 'clsx'

const CATEGORIES = [
  { key: 'paymentContracts', label: 'Payment & Contracts' },
  { key: 'communication',    label: 'Communication' },
  { key: 'deliveryQuality',  label: 'Delivery & Quality' },
  { key: 'reliability',      label: 'Reliability' },
] as const

type CatKey = (typeof CATEGORIES)[number]['key']

function barColor(score: number) {
  if (score >= 4) return 'bg-status-success'
  if (score >= 3) return 'bg-rating-gold'
  return 'bg-status-error'
}

// ── Compact strip used inside ReviewCard ──────────────────────────────────────
export function CategoryBarsCompact({ ratings }: { ratings: CategoryRatings }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      {CATEGORIES.map(({ key, label }) => {
        const score = ratings[key as CatKey]
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span className="text-[10px] text-text-muted w-20 shrink-0 truncate">{label}</span>
            <div className="flex-1 h-1 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className={clsx('h-full rounded-full transition-all', barColor(score))}
                style={{ width: `${(score / 5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-text-muted w-3 text-right tabular-nums">{score}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Full-size bars used on company profile page ───────────────────────────────
interface CategoryBarFullProps {
  label: string
  score: number
  count?: number  // number of reviews contributing
}

export function CategoryBarFull({ label, score, count }: CategoryBarFullProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary font-medium">{label}</span>
        <span className={clsx('font-bold tabular-nums',
          score >= 4 ? 'text-status-success' : score >= 3 ? 'text-rating-gold' : 'text-status-error'
        )}>
          {score.toFixed(1)}
          {count !== undefined && (
            <span className="text-text-muted font-normal text-xs ml-1">/ 5</span>
          )}
        </span>
      </div>
      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-700', barColor(score))}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ── Aggregated breakdown for company profile ──────────────────────────────────
export function CategoryBreakdown({
  ratings,
  wouldWorkAgainPct,
}: {
  ratings: Record<CatKey, number>
  wouldWorkAgainPct: number
}) {
  return (
    <div className="space-y-3">
      {CATEGORIES.map(({ key, label }) => (
        <CategoryBarFull key={key} label={label} score={ratings[key]} />
      ))}
      <div className="pt-1 flex items-center justify-between text-sm">
        <span className="text-text-secondary font-medium">Would Work Again</span>
        <span className={clsx('font-bold', wouldWorkAgainPct >= 60 ? 'text-status-success' : 'text-status-error')}>
          {wouldWorkAgainPct}%
        </span>
      </div>
    </div>
  )
}
