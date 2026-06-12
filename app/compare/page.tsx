'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftRight, ArrowLeft, Loader2, BarChart3, Sparkles, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

export default function ComparePage() {
  return (
    <Suspense>
      <CompareInner />
    </Suspense>
  )
}

interface CompanyStats {
  name: string
  avgRating: number
  reviewCount: number
  catAvgs: {
    paymentContracts: number
    communication: number
    deliveryQuality: number
    reliability: number
  }
  wouldWorkAgainPct: number
  categories: string[]
  topRelationshipType: string
}

interface CompareResult {
  companyA: CompanyStats
  companyB: CompanyStats
  summary: string
}

function MirrorBars({
  label,
  valueA,
  valueB,
}: {
  label: string
  valueA: number
  valueB: number
}) {
  const winA = valueA > valueB
  const winB = valueB > valueA
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className={clsx('font-semibold tabular-nums', winA ? 'text-brand-purple-light' : 'text-text-muted')}>
          {valueA.toFixed(1)}
        </span>
        <span className="text-text-secondary text-center px-2">{label}</span>
        <span className={clsx('font-semibold tabular-nums', winB ? 'text-brand-cyan' : 'text-text-muted')}>
          {valueB.toFixed(1)}
        </span>
      </div>
      <div className="flex gap-1 h-2.5">
        <div className="flex-1 bg-bg-elevated rounded-l-full overflow-hidden flex justify-end">
          <div
            className={clsx('h-full rounded-l-full transition-all duration-700', winA ? 'bg-brand-purple' : 'bg-brand-purple/40')}
            style={{ width: `${(valueA / 5) * 100}%` }}
          />
        </div>
        <div className="w-px bg-border shrink-0" />
        <div className="flex-1 bg-bg-elevated rounded-r-full overflow-hidden">
          <div
            className={clsx('h-full rounded-r-full transition-all duration-700', winB ? 'bg-brand-cyan' : 'bg-brand-cyan/40')}
            style={{ width: `${(valueB / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function CompareInner() {
  const searchParams = useSearchParams()

  const [companies, setCompanies] = useState<string[]>([])
  const [selectedA, setSelectedA] = useState(searchParams.get('a') ?? '')
  const [selectedB, setSelectedB] = useState(searchParams.get('b') ?? '')
  const [result, setResult]       = useState<CompareResult | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  // Load company list
  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.json())
      .then(data => {
        const names = [...new Set((data.reviews as { company: string }[]).map(r => r.company))].sort() as string[]
        setCompanies(names)
      })
      .catch(() => {})
  }, [])

  // Auto-compare when both selected
  useEffect(() => {
    if (selectedA && selectedB && selectedA !== selectedB) {
      compare()
    } else {
      setResult(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedA, selectedB])

  async function compare() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`/api/compare?a=${encodeURIComponent(selectedA)}&b=${encodeURIComponent(selectedB)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Comparison failed')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed')
    } finally {
      setLoading(false)
    }
  }

  const ratingColor = (r: number) =>
    r >= 4 ? 'text-status-success' : r >= 2.5 ? 'text-rating-gold' : 'text-status-error'

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-secondary mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" />Back
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-brand-purple/15 border border-brand-purple/25">
            <ArrowLeftRight className="w-5 h-5 text-brand-purple-light" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Compare Companies</h1>
        </div>
        <p className="text-text-secondary text-sm">
          Side-by-side trust score comparison with AI-generated analysis.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div>
          <label className="block text-xs font-semibold text-brand-purple-light uppercase tracking-wider mb-2">
            Company A
          </label>
          <select
            value={selectedA}
            onChange={e => setSelectedA(e.target.value)}
            className="w-full bg-bg-elevated border border-brand-purple/30 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand-purple/60 transition-colors appearance-none cursor-pointer"
          >
            <option value="">Select a company…</option>
            {companies.filter(c => c !== selectedB).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-brand-cyan uppercase tracking-wider mb-2">
            Company B
          </label>
          <select
            value={selectedB}
            onChange={e => setSelectedB(e.target.value)}
            className="w-full bg-bg-elevated border border-brand-cyan/30 rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-brand-cyan/60 transition-colors appearance-none cursor-pointer"
          >
            <option value="">Select a company…</option>
            {companies.filter(c => c !== selectedA).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-20 text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin text-brand-purple-light" />
          <span>Generating AI comparison…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="glass border border-status-error/30 rounded-xl p-4 text-sm text-status-error mb-6">
          {error}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-5">
          {/* Score cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-2xl p-5 border-t-2 border-brand-purple/60">
              <Link
                href={`/company/${encodeURIComponent(result.companyA.name)}`}
                className="font-bold text-lg text-text-primary hover:text-brand-purple-light transition-colors block mb-1"
              >
                {result.companyA.name}
              </Link>
              <p className={clsx('text-5xl font-black tabular-nums my-2', ratingColor(result.companyA.avgRating))}>
                {result.companyA.avgRating.toFixed(1)}
              </p>
              <p className="text-xs text-text-muted mb-3">
                {result.companyA.reviewCount} review{result.companyA.reviewCount !== 1 ? 's' : ''}, out of 5.0
              </p>
              <span className="text-xs text-brand-purple-light bg-brand-purple/10 border border-brand-purple/20 px-2.5 py-1 rounded-lg">
                {result.companyA.wouldWorkAgainPct}% would work again
              </span>
            </div>

            <div className="glass rounded-2xl p-5 border-t-2 border-brand-cyan/60">
              <Link
                href={`/company/${encodeURIComponent(result.companyB.name)}`}
                className="font-bold text-lg text-text-primary hover:text-brand-cyan transition-colors block mb-1"
              >
                {result.companyB.name}
              </Link>
              <p className={clsx('text-5xl font-black tabular-nums my-2', ratingColor(result.companyB.avgRating))}>
                {result.companyB.avgRating.toFixed(1)}
              </p>
              <p className="text-xs text-text-muted mb-3">
                {result.companyB.reviewCount} review{result.companyB.reviewCount !== 1 ? 's' : ''}, out of 5.0
              </p>
              <span className="text-xs text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-2.5 py-1 rounded-lg">
                {result.companyB.wouldWorkAgainPct}% would work again
              </span>
            </div>
          </div>

          {/* Category comparison */}
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-5 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />Category Breakdown
            </p>

            <div className="space-y-4">
              {(
                [
                  { key: 'paymentContracts', label: 'Payment & Contracts' },
                  { key: 'communication',   label: 'Communication' },
                  { key: 'deliveryQuality', label: 'Delivery & Quality' },
                  { key: 'reliability',     label: 'Reliability' },
                ] as const
              ).map(({ key, label }) => (
                <MirrorBars
                  key={key}
                  label={label}
                  valueA={result.companyA.catAvgs[key]}
                  valueB={result.companyB.catAvgs[key]}
                />
              ))}

              {/* Would Work Again */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className={clsx('font-semibold tabular-nums',
                    result.companyA.wouldWorkAgainPct >= result.companyB.wouldWorkAgainPct ? 'text-brand-purple-light' : 'text-text-muted'
                  )}>
                    {result.companyA.wouldWorkAgainPct}%
                  </span>
                  <span className="text-text-secondary text-center px-2">Would Work Again</span>
                  <span className={clsx('font-semibold tabular-nums',
                    result.companyB.wouldWorkAgainPct >= result.companyA.wouldWorkAgainPct ? 'text-brand-cyan' : 'text-text-muted'
                  )}>
                    {result.companyB.wouldWorkAgainPct}%
                  </span>
                </div>
                <div className="flex gap-1 h-2.5">
                  <div className="flex-1 bg-bg-elevated rounded-l-full overflow-hidden flex justify-end">
                    <div
                      className="h-full rounded-l-full bg-status-success/60 transition-all duration-700"
                      style={{ width: `${result.companyA.wouldWorkAgainPct}%` }}
                    />
                  </div>
                  <div className="w-px bg-border shrink-0" />
                  <div className="flex-1 bg-bg-elevated rounded-r-full overflow-hidden">
                    <div
                      className="h-full rounded-r-full bg-status-success/60 transition-all duration-700"
                      style={{ width: `${result.companyB.wouldWorkAgainPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-5 pt-4 border-t border-border text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-2 bg-brand-purple rounded-full" />
                {result.companyA.name}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-2 bg-brand-cyan rounded-full" />
                {result.companyB.name}
              </span>
            </div>
          </div>

          {/* Gemini AI summary */}
          <div className="glass rounded-2xl p-5">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-purple-light" />AI Analysis
            </p>
            <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
              {result.summary}
            </div>
            <p className="text-xs text-text-muted mt-3 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-status-success" />
              Generated by Gemini from {result.companyA.reviewCount + result.companyB.reviewCount} verified on-chain reviews
            </p>
          </div>

          {/* View profile links */}
          <div className="grid grid-cols-2 gap-4">
            <Link
              href={`/company/${encodeURIComponent(result.companyA.name)}`}
              className="py-3 rounded-xl text-center text-sm font-medium glass border border-border hover:border-brand-purple/40 text-text-secondary hover:text-brand-purple-light transition-all"
            >
              View {result.companyA.name} profile →
            </Link>
            <Link
              href={`/company/${encodeURIComponent(result.companyB.name)}`}
              className="py-3 rounded-xl text-center text-sm font-medium glass border border-border hover:border-brand-cyan/40 text-text-secondary hover:text-brand-cyan transition-all"
            >
              View {result.companyB.name} profile →
            </Link>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && !error && (
        <div className="glass rounded-2xl p-12 text-center">
          <ArrowLeftRight className="w-10 h-10 text-text-muted/30 mx-auto mb-4" />
          <p className="font-semibold text-text-secondary mb-2">Select two companies to compare</p>
          <p className="text-sm text-text-muted max-w-sm mx-auto leading-relaxed">
            Choose any two companies from the dropdowns above to see side-by-side trust scores,
            category breakdowns, and AI-generated insights.
          </p>
        </div>
      )}
    </div>
  )
}
