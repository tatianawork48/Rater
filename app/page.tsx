import Link from 'next/link'
import { Shield, Zap, Lock, MessageSquare } from 'lucide-react'
import ReviewFeed from '@/components/ReviewFeed'
import StatsBar from '@/components/StatsBar'
import CompanySearch from '@/components/CompanySearch'
import TopCompanies from '@/components/TopCompanies'

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-brand-purple-light bg-brand-purple/10 border border-brand-purple/20 px-3 py-1.5 rounded-full mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"/>
          Powered by Hedera Consensus Service + Gemini AI
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4">
          <span className="gradient-text">Anonymous.</span><br/>
          <span className="text-text-primary">Verified. Trusted.</span>
        </h1>
        <p className="text-text-secondary text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          Submit blockchain-verified B2B reviews anonymously. Every review is stored immutably on Hedera and earns an NFT badge.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link href="/submit" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white font-semibold transition-all glow-purple">
            <Zap className="w-4 h-4"/>Write a Review
          </Link>
          <Link href="/chat" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl glass border border-border hover:border-border-bright text-text-primary font-semibold transition-all">
            <MessageSquare className="w-4 h-4"/>Ask AI
          </Link>
        </div>

        {/* Company search */}
        <CompanySearch/>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {[
          { icon: Shield, label: 'HCS Immutable Storage' },
          { icon: Lock,   label: 'Anonymous Reviewer IDs' },
          { icon: Zap,    label: 'NFT Review Badges' },
          { icon: Shield, label: 'Zero Fake Reviews' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs font-medium text-text-muted glass border border-border px-3 py-1.5 rounded-full">
            <Icon className="w-3 h-3 text-brand-purple-light"/>{label}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mb-10"><StatsBar/></div>

      {/* Why RATER? */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-text-primary text-center mb-6">
          Why RATER?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-status-success/10 border border-status-success/20 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-5 h-5 text-status-success"/>
            </div>
            <h3 className="font-semibold text-text-primary mb-2">Immutable</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Every review is permanently stored on Hedera and cannot be altered.
            </p>
          </div>
          <div className="glass rounded-2xl p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-5 h-5 text-brand-purple-light"/>
            </div>
            <h3 className="font-semibold text-text-primary mb-2">Anonymous</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Your identity is never revealed, only a cryptographic hash.
            </p>
          </div>
          <div className="glass rounded-2xl p-5 text-center">
            <div className="w-10 h-10 rounded-xl bg-rating-gold/10 border border-rating-gold/20 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-5 h-5 text-rating-gold"/>
            </div>
            <h3 className="font-semibold text-text-primary mb-2">Verified</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              Every review costs 1 HBAR to submit, making fake reviews economically unviable.
            </p>
          </div>
        </div>
      </div>

      {/* Top Trusted Companies */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-text-primary">
            Top Trusted Companies
            <span className="ml-2 text-sm font-normal text-text-muted">by Trust Score</span>
          </h2>
          <Link href="/compare" className="text-xs text-brand-purple-light hover:underline">
            Compare any two →
          </Link>
        </div>
        <TopCompanies/>
      </div>

      {/* Feed */}
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-5">
          Latest Reviews
          <span className="ml-2 text-sm font-normal text-text-muted">on Hedera Testnet</span>
        </h2>
        <ReviewFeed/>
      </div>
    </div>
  )
}
