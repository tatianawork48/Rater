'use client'

import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

// Styled to match the dark theme without relying on the Tailwind typography
// plugin. Keeps the AI's markdown (bold, bullet/numbered lists, links) readable
// inside the chat bubble.
const components: Components = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-text-primary">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-purple-light underline hover:no-underline"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="px-1 py-0.5 rounded bg-bg-elevated border border-border text-xs font-mono">
      {children}
    </code>
  ),
  h1: ({ children }) => <h3 className="font-semibold text-base mb-2">{children}</h3>,
  h2: ({ children }) => <h3 className="font-semibold text-base mb-2">{children}</h3>,
  h3: ({ children }) => <h3 className="font-semibold text-sm mb-1.5">{children}</h3>,
}

export default function MarkdownMessage({ content }: { content: string }) {
  return <ReactMarkdown components={components}>{content}</ReactMarkdown>
}
