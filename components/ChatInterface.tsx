'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import type { ChatMessage } from '@/types'
import MarkdownMessage from './MarkdownMessage'

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm RATER AI, powered by Gemini. I have access to all blockchain-verified reviews on this platform. Ask me anything about company reputations, ratings, or specific reviews!",
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<string[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    fetch('/api/reviews')
      .then(r => r.json())
      .then(d => setCompanies(d.companies ?? []))
      .catch(() => {})
  }, [])

  const suggestions = useMemo(() => {
    if (companies.length < 2) {
      return [
        'Which company has the highest trust score?',
        'What are the most common complaints?',
        'Which companies are most recommended?',
        'What should I look for in a B2B vendor?',
      ]
    }
    const [a, b, c, d] = companies
    return [
      `What do reviewers say about ${a}?`,
      `How does ${a} compare to ${b}?`,
      c ? `Is ${c} recommended by most reviewers?` : 'Which company has the highest trust score?',
      d ? `What are the main complaints about ${d}?` : 'What are the most common complaints?',
      'Which companies are improving over time?',
      'Which company has the most consistent reviews?',
    ]
  }, [companies])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = {
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const history = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to get response')

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString(),
        },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
      {/* Header */}
      <div className="glass rounded-t-2xl p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center glow-purple">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-text-primary text-sm">RATER AI</h2>
            <p className="text-xs text-text-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success inline-block" />
              Powered by Gemini {loading ? 'thinking...' : 'online'}
            </p>
          </div>
        </div>
        <div className="text-xs text-text-muted hedera-badge px-2.5 py-1 rounded-full">
          On-chain data
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-surface/50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={clsx(
              'flex gap-3 max-w-[85%]',
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            )}
          >
            <div
              className={clsx(
                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1',
                msg.role === 'assistant'
                  ? 'bg-gradient-to-br from-brand-purple to-brand-cyan'
                  : 'bg-bg-elevated border border-border'
              )}
            >
              {msg.role === 'assistant' ? (
                <Bot className="w-4 h-4 text-white" />
              ) : (
                <User className="w-4 h-4 text-text-secondary" />
              )}
            </div>

            <div
              className={clsx(
                'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                msg.role === 'assistant'
                  ? 'glass text-text-primary rounded-tl-sm'
                  : 'bg-brand-purple/20 border border-brand-purple/30 text-text-primary rounded-tr-sm'
              )}
            >
              {msg.role === 'assistant' ? (
                <MarkdownMessage content={msg.content} />
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="glass rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 text-brand-purple-light animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 py-3 bg-bg-surface/50 border-t border-border">
          <p className="text-xs text-text-muted mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs px-3 py-1.5 rounded-full glass border border-border hover:border-brand-purple/40 hover:text-brand-purple-light text-text-secondary transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="glass rounded-b-2xl p-3 border-t border-border">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any company's reputation..."
            rows={1}
            className="flex-1 bg-bg-elevated border border-border rounded-xl px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-brand-purple/50 transition-colors max-h-32"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-brand-purple hover:bg-brand-purple-dark disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-purple shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-xs text-text-muted mt-1.5 ml-1">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
