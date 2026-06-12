import { Sparkles, Shield } from 'lucide-react'
import ChatInterface from '@/components/ChatInterface'

export default function ChatPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-brand-purple-light bg-brand-purple/10 border border-brand-purple/20 px-3 py-1.5 rounded-full mb-4">
          <Sparkles className="w-3 h-3" />
          Powered by Gemini 1.5 Flash
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Ask about any company
        </h1>
        <p className="text-text-secondary text-sm">
          RATER AI has access to all blockchain-verified reviews. Query company reputations, compare ratings, or explore trends.
        </p>

        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { icon: Shield, label: 'Verified data only' },
            { icon: Sparkles, label: 'Powered by Gemini' },
          ].map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 text-xs text-text-muted glass border border-border px-2.5 py-1 rounded-full"
            >
              <Icon className="w-3 h-3 text-brand-purple-light" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Chat */}
      <ChatInterface />

      {/* ACP notice */}
      <div className="mt-4 glass rounded-xl p-3 flex items-start gap-3 text-xs text-text-muted">
        <Shield className="w-4 h-4 text-brand-purple-light shrink-0 mt-0.5" />
        <span>
          RATER exposes an{' '}
          <a
            href="/api/acp"
            target="_blank"
            className="text-brand-purple-light hover:underline"
          >
            ACP-compatible endpoint
          </a>{' '}
          at <code className="text-brand-cyan font-mono">/api/acp</code> for agent-to-agent reputation queries.
        </span>
      </div>
    </div>
  )
}
