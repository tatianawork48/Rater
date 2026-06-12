'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, ExternalLink, Shield, AlertCircle, Loader2, CheckCircle2, Hash } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import type { VerifyResult } from '@/app/api/verify/route'
import clsx from 'clsx'

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyInner />
    </Suspense>
  )
}

function VerifyInner() {
  const searchParams = useSearchParams()
  const [input, setInput]   = useState(searchParams.get('seq') ?? searchParams.get('id') ?? '')
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // Auto-lookup if query param provided
  useEffect(() => {
    const seq = searchParams.get('seq')
    const id  = searchParams.get('id')
    if (seq || id) lookup(seq ? `seq=${seq}` : `id=${encodeURIComponent(id!)}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function lookup(qs?: string) {
    const q = qs ?? (
      /^\d+$/.test(input.trim()) ? `seq=${input.trim()}` : `id=${encodeURIComponent(input.trim())}`
    )
    if (!q) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`/api/verify?${q}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Lookup failed')
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  const msg = result?.message as Record<string, unknown> | null | undefined

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-status-success bg-status-success/10 border border-status-success/20 px-3 py-1.5 rounded-full mb-4">
          <Shield className="w-3 h-3"/>On-chain Verification
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Verify a Review</h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          Paste a Hedera Transaction ID or topic sequence number to retrieve the original review data directly from Hedera Consensus Service.
        </p>
      </div>

      {/* Input */}
      <div className="glass rounded-2xl p-5 mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Transaction ID or Sequence Number
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"/>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookup()}
              placeholder="e.g. 5  or  0.0.9069262@1738000000.000000000"
              className="w-full bg-bg-elevated border border-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-purple/50 transition-colors font-mono"
            />
          </div>
          <button
            onClick={() => lookup()}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white font-medium text-sm transition-all glow-purple disabled:opacity-40 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
            Verify
          </button>
        </div>
        <div className="flex gap-4 mt-2 text-xs text-text-muted">
          <span>• Sequence number: an integer like <code className="text-brand-cyan">5</code></span>
          <span>• Transaction ID: <code className="text-brand-cyan">0.0.X@Y.Z</code></span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 glass border border-status-error/30 rounded-xl p-4 mb-6 text-sm text-status-error">
          <AlertCircle className="w-4 h-4 shrink-0"/>{error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Status bar */}
          <div className="glass rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-status-success"/>
              <div>
                <p className="font-semibold text-text-primary text-sm">
                  {result.type === 'message' ? 'HCS Message Found' : 'Transaction Found'}
                </p>
                <p className="text-xs text-text-muted">Hedera Testnet, Topic {process.env.NEXT_PUBLIC_TOPIC_ID ?? '0.0.9177253'}</p>
              </div>
            </div>
            <a
              href={result.hashscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-brand-purple-light hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5"/>View on HashScan
            </a>
          </div>

          {/* Decoded review */}
          {msg && (() => {
            const r = msg as Record<string, string>
            const rating = typeof msg.rating === 'number' ? msg.rating : parseFloat(r.rating ?? '0')
            return (
              <div className="glass rounded-2xl p-5 space-y-4">
                <p className="text-xs text-text-muted uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-status-success"/>Decoded Review Data
                </p>

                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-bold text-xl text-text-primary">{r.company ?? 'Unknown'}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {r.category && <span className="text-xs text-text-muted glass border border-border px-2 py-0.5 rounded-md">{r.category}</span>}
                      {r.relationshipType && <span className="text-xs text-brand-purple-light bg-brand-purple/10 border border-brand-purple/20 px-2 py-0.5 rounded-md">{r.relationshipType}</span>}
                    </div>
                  </div>
                  {!isNaN(rating) && rating > 0 && (
                    <div className="text-right">
                      <p className={clsx('text-4xl font-black tabular-nums',
                        rating >= 4 ? 'text-status-success' : rating >= 2.5 ? 'text-rating-gold' : 'text-status-error'
                      )}>
                        {rating.toFixed(1)}
                      </p>
                      <p className="text-xs text-text-muted">/ 5.0</p>
                    </div>
                  )}
                </div>

                {r.title && <p className="font-semibold text-text-primary">{r.title}</p>}
                {r.content && <p className="text-text-secondary text-sm leading-relaxed">{r.content}</p>}

                {(r.pros || r.cons) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {r.pros && (
                      <div className="bg-status-success/5 border border-status-success/15 rounded-xl p-3">
                        <p className="text-xs font-semibold text-status-success mb-1">Pros</p>
                        <p className="text-xs text-text-secondary">{r.pros}</p>
                      </div>
                    )}
                    {r.cons && (
                      <div className="bg-status-error/5 border border-status-error/15 rounded-xl p-3">
                        <p className="text-xs font-semibold text-status-error mb-1">Cons</p>
                        <p className="text-xs text-text-secondary">{r.cons}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {r.reviewerHash && (
                    <div className="flex justify-between bg-bg-elevated rounded-lg px-3 py-2">
                      <span className="text-text-muted">Reviewer</span>
                      <span className="font-mono text-text-secondary">{r.reviewerHash}</span>
                    </div>
                  )}
                  {r.timestamp && (
                    <div className="flex justify-between bg-bg-elevated rounded-lg px-3 py-2">
                      <span className="text-text-muted">Submitted</span>
                      <span className="text-text-secondary">
                        {format(new Date(r.timestamp), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  {r.platform && (
                    <div className="flex justify-between bg-bg-elevated rounded-lg px-3 py-2">
                      <span className="text-text-muted">Platform</span>
                      <span className="text-brand-purple-light">{r.platform}</span>
                    </div>
                  )}
                  {r.version && (
                    <div className="flex justify-between bg-bg-elevated rounded-lg px-3 py-2">
                      <span className="text-text-muted">Schema</span>
                      <span className="text-text-secondary">v{r.version}</span>
                    </div>
                  )}
                </div>

                {r.company && (
                  <Link
                    href={`/company/${encodeURIComponent(r.company)}`}
                    className="inline-flex items-center gap-2 text-sm text-brand-purple-light hover:underline"
                  >
                    View {r.company} company profile →
                  </Link>
                )}
              </div>
            )
          })()}

          {/* Raw on-chain data */}
          <details className="glass rounded-2xl overflow-hidden">
            <summary className="px-5 py-3.5 cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary flex items-center justify-between select-none">
              <span>Raw on-chain data</span>
              <span className="text-xs text-text-muted">click to expand</span>
            </summary>
            <div className="px-5 pb-5 border-t border-border">
              <pre className="text-xs text-brand-cyan font-mono leading-relaxed overflow-x-auto mt-3 whitespace-pre-wrap break-all">
                {JSON.stringify(result.raw, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}

      {/* Help */}
      {!result && !error && !loading && (
        <div className="glass rounded-2xl p-6 text-center text-sm text-text-muted">
          <Shield className="w-8 h-8 text-text-muted/50 mx-auto mb-3"/>
          <p className="font-medium text-text-secondary mb-1">How verification works</p>
          <p className="max-w-sm mx-auto leading-relaxed">
            Every review submitted through RATER is stored as a message on Hedera Consensus Service. Paste the sequence number from any review card, or a full transaction ID, to see the immutable on-chain record.
          </p>
        </div>
      )}
    </div>
  )
}
