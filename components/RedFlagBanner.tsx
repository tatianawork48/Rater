'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import type { RedFlag } from '@/types'

export default function RedFlagBanner({ company }: { company: string }) {
  const [flags, setFlags] = useState<RedFlag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/red-flags?company=${encodeURIComponent(company)}`)
      .then(r => r.json())
      .then(d => setFlags(d.flags ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [company])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-text-muted py-1">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Analysing reviews for recurring issues…
      </div>
    )
  }

  if (flags.length === 0) return null

  return (
    <div className="rounded-2xl border border-status-error/30 bg-status-error/5 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-status-error shrink-0" />
        <p className="text-sm font-semibold text-status-error">Recurring complaints detected</p>
      </div>
      <div className="space-y-1.5">
        {flags.map((f, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-sm text-text-secondary"
          >
            <span className="text-base leading-none mt-px">{f.icon}</span>
            <span>
              <span className="font-medium text-text-primary">{f.count} reviewers</span>{' '}
              mention {f.theme}
              {f.severity === 'high' && (
                <span className="ml-1.5 text-[10px] font-bold text-status-error bg-status-error/10 border border-status-error/20 px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                  High
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
