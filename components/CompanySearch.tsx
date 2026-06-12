'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Building2, ArrowRight } from 'lucide-react'
import clsx from 'clsx'

export default function CompanySearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [companies, setCompanies] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Fetch company list once on mount
  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.json())
      .then(d => setCompanies(d.companies ?? []))
      .catch(() => {})
  }, [])

  const suggestions = query.trim().length > 0
    ? companies.filter(c => c.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : companies.slice(0, 6)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function navigate(name: string) {
    setOpen(false)
    setQuery('')
    router.push(`/company/${encodeURIComponent(name)}`)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && suggestions.length > 0) navigate(suggestions[0])
    if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div ref={ref} className="relative w-full max-w-xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search a company, e.g. Stripe, AWS, Notion..."
          className="w-full bg-bg-surface border border-border rounded-2xl pl-10 pr-12 py-3.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-purple/50 transition-colors shadow-card"
        />
        <ArrowRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full mt-1.5 w-full glass rounded-2xl border border-border shadow-card-hover overflow-hidden z-50">
          {query.trim() === '' && (
            <p className="text-[10px] text-text-muted px-4 pt-3 pb-1 uppercase tracking-wider font-semibold">
              All companies
            </p>
          )}
          {suggestions.map((name, i) => (
            <button
              key={name}
              onClick={() => navigate(name)}
              className={clsx(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-bg-elevated transition-colors',
                i > 0 && 'border-t border-border/50'
              )}
            >
              <Building2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
              <span className="text-text-primary font-medium flex-1">{name}</span>
              <span className="text-[10px] text-text-muted">View profile →</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
