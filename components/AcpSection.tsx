'use client'

import { useState } from 'react'
import { ExternalLink, Code2, Loader2, Bot, ChevronDown, ChevronUp } from 'lucide-react'

interface Props { company: string }

export default function AcpSection({ company }: Props) {
  const [json, setJson] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleQuery() {
    if (json !== null) { setJson(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/acp?company=${encodeURIComponent(company)}`)
      const data = await res.json()
      setJson(JSON.stringify(data, null, 2))
    } catch {
      setJson('{ "error": "Failed to fetch" }')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-5 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-brand-purple/15 border border-brand-purple/25 shrink-0 mt-0.5">
            <Bot className="w-4 h-4 text-brand-purple-light" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary leading-tight mb-1">
              This profile is AI-agent readable
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed max-w-sm">
              Other AI agents can query RATER reputation data automatically via our open API.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`/api/acp?company=${encodeURIComponent(company)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-brand-purple-light transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />Raw API
          </a>
          <button
            onClick={handleQuery}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-brand-purple/15 border border-brand-purple/30 text-brand-purple-light hover:bg-brand-purple/25 transition-all disabled:opacity-60"
          >
            {loading ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />Loading</>
            ) : json !== null ? (
              <><ChevronUp className="w-3.5 h-3.5" />Hide response</>
            ) : (
              <><Code2 className="w-3.5 h-3.5" />Try Live Query</>
            )}
          </button>
        </div>
      </div>

      {json !== null && (
        <div className="mt-4 bg-bg-elevated/80 border border-border rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-border bg-bg-elevated">
            <span className="text-xs text-text-muted font-mono truncate">
              GET /api/acp?company={encodeURIComponent(company)}
            </span>
            <span className="text-xs text-status-success font-medium ml-2 shrink-0">200 OK</span>
          </div>
          <pre className="text-xs text-brand-cyan font-mono leading-relaxed p-4 overflow-x-auto max-h-80 whitespace-pre-wrap break-all">
            {json}
          </pre>
        </div>
      )}
    </div>
  )
}
