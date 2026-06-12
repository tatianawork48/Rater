'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

export default function ShareButton({ company }: { company: string }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/company/${encodeURIComponent(company)}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      className="text-xs px-2.5 py-1 rounded-full border font-medium flex items-center gap-1 transition-all text-text-muted bg-bg-elevated border-border hover:border-border-bright hover:text-text-secondary"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-status-success" />
          <span className="text-status-success">Link copied</span>
        </>
      ) : (
        <>
          <Share2 className="w-3 h-3" />
          Share
        </>
      )}
    </button>
  )
}
