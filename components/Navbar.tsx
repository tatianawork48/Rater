'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, MessageSquare, PlusCircle, Zap, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

const links = [
  { href: '/',        label: 'Feed',         icon: Shield },
  { href: '/submit',  label: 'Write Review', icon: PlusCircle },
  { href: '/chat',    label: 'AI Chat',      icon: MessageSquare },
  { href: '/verify',  label: 'Verify',       icon: CheckCircle2 },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-cyan flex items-center justify-center glow-purple">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text tracking-tight">RATER</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === href
                    ? 'bg-brand-purple/20 text-brand-purple-light border border-brand-purple/30'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Hedera badge */}
          <a
            href="https://hashscan.io/testnet"
            target="_blank"
            rel="noopener noreferrer"
            className="hedera-badge px-3 py-1.5 rounded-full text-xs font-medium text-brand-purple-light flex items-center gap-1.5 hover:bg-brand-purple/20 transition-colors"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
            Hedera Testnet
          </a>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden border-t border-border">
        <div className="flex">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                pathname === href ? 'text-brand-purple-light' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
