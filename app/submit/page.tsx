'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Shield, ExternalLink, CheckCircle2, AlertCircle, ChevronRight, Check, X, Lock, Hash } from 'lucide-react'
import StarRating from '@/components/StarRating'
import type { CategoryRatings, RelationshipType, JobRole, SubmitReviewPayload } from '@/types'
import clsx from 'clsx'

const CATEGORIES = [
  'CRM / Enterprise Software', 'CRM / Marketing Automation', 'Cloud Infrastructure',
  'Payments / Fintech', 'Productivity / Collaboration', 'Design / Collaboration',
  'Business Communication', 'Developer Tools / Project Management',
  'Video Conferencing', 'Legal / Contract Management', 'Other',
]

const RELATIONSHIP_TYPES: RelationshipType[] = ['Client', 'Vendor', 'Partner', 'Employee']

const JOB_ROLES: JobRole[] = [
  'CEO / Founder', 'Product Manager', 'Engineer', 'Sales',
  'Marketing', 'Operations', 'Finance', 'Legal', 'Other',
]

const RELATIONSHIP_DESC: Record<RelationshipType, string> = {
  Client:   'You paid for their product or service',
  Vendor:   'They paid you for work or services',
  Partner:  'Reseller, integration, or co-sell relationship',
  Employee: 'You worked there (current or former)',
}

const CAT_LABELS: Record<keyof CategoryRatings, string> = {
  paymentContracts: 'Payment & Contracts',
  communication:   'Communication',
  deliveryQuality: 'Delivery & Quality',
  reliability:     'Reliability',
  wouldWorkAgain:  'Would Work Again',
}

const EMPTY_RATINGS: CategoryRatings = {
  paymentContracts: 0,
  communication: 0,
  deliveryQuality: 0,
  reliability: 0,
  wouldWorkAgain: false,
}

type Step = 'form' | 'confirm' | 'success'
type PayState = 'idle' | 'processing' | 'confirmed'

interface FormData {
  company: string
  category: string
  title: string
  content: string
  pros: string
  cons: string
  relationshipType: RelationshipType | ''
  jobRole: JobRole | ''
  categoryRatings: CategoryRatings
  reviewerAccountId: string
}

function calcRating(cr: CategoryRatings): number {
  const scores = [cr.paymentContracts, cr.communication, cr.deliveryQuality, cr.reliability, cr.wouldWorkAgain ? 5 : 1]
  if (scores.slice(0, 4).some(s => s === 0)) return 0
  return Math.round((scores.reduce((a, b) => a + b, 0) / 5) * 10) / 10
}

export default function SubmitPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [payState, setPayState] = useState<PayState>('idle')
  const [form, setForm] = useState<FormData>({
    company: '', category: '', title: '', content: '',
    pros: '', cons: '', relationshipType: '', jobRole: '',
    categoryRatings: EMPTY_RATINGS, reviewerAccountId: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{
    review: { id: string; company: string; rating: number }
    hedera: { topicId: string; txId: string; nftTokenId?: string; nftSerial?: number; explorerUrl: string }
  } | null>(null)
  const [submitError, setSubmitError] = useState('')

  const overallRating = calcRating(form.categoryRatings)

  function setRating(key: keyof CategoryRatings, value: number | boolean) {
    setForm(f => ({ ...f, categoryRatings: { ...f.categoryRatings, [key]: value } }))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.company.trim())         e.company = 'Company name is required'
    if (!form.category)               e.category = 'Category is required'
    if (!form.relationshipType)       e.relationshipType = 'Relationship type is required'
    if (form.categoryRatings.paymentContracts === 0) e.ratings = 'Please rate all 4 categories'
    else if (form.categoryRatings.communication === 0) e.ratings = 'Please rate all 4 categories'
    else if (form.categoryRatings.deliveryQuality === 0) e.ratings = 'Please rate all 4 categories'
    else if (form.categoryRatings.reliability === 0) e.ratings = 'Please rate all 4 categories'
    if (!form.title.trim())           e.title = 'Review title is required'
    if (form.content.trim().length < 50) e.content = 'Review must be at least 50 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleNext() {
    if (!validate()) return
    setStep('confirm')
    setPayState('idle')
  }

  async function handlePay() {
    setPayState('processing')
    setTimeout(async () => {
      setPayState('confirmed')
      await submitReview()
    }, 1800)
  }

  async function submitReview() {
    setSubmitting(true)
    setSubmitError('')
    try {
      const payload: SubmitReviewPayload = {
        company: form.company,
        category: form.category,
        title: form.title,
        content: form.content,
        pros: form.pros,
        cons: form.cons,
        relationshipType: form.relationshipType as RelationshipType,
        jobRole: form.jobRole || undefined,
        categoryRatings: form.categoryRatings,
        reviewerAccountId: form.reviewerAccountId || undefined,
      }
      const res = await fetch('/api/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setResult(data)
      setStep('success')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
      setPayState('idle')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Step indicator ─────────────────────────────────────────────────────────
  const StepIndicator = ({ current }: { current: Step }) => (
    <div className="flex items-center gap-2 text-xs text-text-muted mb-8">
      {[
        { id: 'form',    label: 'Write Review', num: 1 },
        { id: 'confirm', label: 'Confirm & Pay', num: 2 },
      ].map((s, i) => {
        const steps: Step[] = ['form', 'confirm', 'success']
        const done   = steps.indexOf(current) > steps.indexOf(s.id as Step)
        const active = current === s.id
        return (
          <div key={s.id} className="flex items-center gap-2">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-text-muted/40" />}
            <span className="flex items-center gap-1.5">
              <span className={clsx('w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                active  ? 'bg-brand-purple text-white'
                : done  ? 'bg-status-success/20 text-status-success border border-status-success/30'
                : 'bg-bg-elevated border border-border text-text-muted'
              )}>
                {done ? '✓' : s.num}
              </span>
              <span className={active ? 'text-text-secondary' : done ? 'text-status-success' : ''}>{s.label}</span>
            </span>
          </div>
        )
      })}
    </div>
  )

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step === 'success' && result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="glass rounded-2xl p-8 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-status-success/15 border border-status-success/30 flex items-center justify-center mx-auto nft-glow">
            <CheckCircle2 className="w-10 h-10 text-status-success" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">Review Submitted!</h1>
            <p className="text-text-secondary">
              Your anonymous review of <span className="text-text-primary font-semibold">{result.review.company}</span> is now on Hedera.
            </p>
          </div>
          {result.hedera.nftSerial && (
            <div className="hedera-badge rounded-2xl p-5 text-left space-y-3">
              <p className="text-brand-purple-light font-semibold flex items-center gap-2"><Zap className="w-4 h-4" />NFT Badge Minted</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><p className="text-text-muted mb-1">Token ID</p><p className="text-text-primary font-mono">{result.hedera.nftTokenId}</p></div>
                <div><p className="text-text-muted mb-1">Serial #</p><p className="text-text-primary font-mono font-bold text-base">#{result.hedera.nftSerial}</p></div>
              </div>
            </div>
          )}
          <div className="glass rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-text-muted">HCS Topic</span><span className="font-mono text-brand-cyan">{result.hedera.topicId}</span></div>
            <div className="flex justify-between gap-4"><span className="text-text-muted">Transaction</span><span className="font-mono text-brand-cyan text-xs truncate">{result.hedera.txId}</span></div>
            <div className="flex justify-between"><span className="text-text-muted">Network</span><span className="text-status-success">Hedera Testnet</span></div>
          </div>
          {result.hedera.txId && !result.hedera.txId.startsWith('failed') && (
            <a href={result.hedera.explorerUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-brand-purple-light hover:underline">
              <ExternalLink className="w-4 h-4" />View on HashScan
            </a>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => {
                setForm({ company:'',category:'',title:'',content:'',pros:'',cons:'',relationshipType:'',jobRole:'',categoryRatings:EMPTY_RATINGS,reviewerAccountId:'' })
                setPayState('idle')
                setStep('form')
                setResult(null)
              }}
              className="px-5 py-2.5 rounded-xl glass border border-border hover:border-border-bright text-text-primary font-medium transition-all"
            >
              Write Another
            </button>
            <button
              onClick={() => router.push(`/company/${encodeURIComponent(result.review.company)}`)}
              className="px-5 py-2.5 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white font-medium transition-all glow-purple"
            >
              View Company Profile
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Confirm & Pay screen ───────────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <StepIndicator current="confirm" />
        <div className="mb-6">
          <button onClick={() => setStep('form')} className="text-sm text-text-muted hover:text-text-secondary mb-4 flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 rotate-180" />Back to edit
          </button>
          <h1 className="text-2xl font-bold text-text-primary">Confirm &amp; Pay</h1>
          <p className="text-text-muted text-sm mt-1">Review will be stored immutably on Hedera Consensus Service.</p>
        </div>
        <div className="glass rounded-2xl p-6 space-y-4">
          {/* Review summary */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-xl text-text-primary">{form.company}</p>
              <p className="text-text-muted text-sm">{form.category} <span className="text-text-secondary">{form.relationshipType}</span></p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-rating-gold">{overallRating.toFixed(1)}</p>
              <p className="text-xs text-text-muted">overall</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(['paymentContracts','communication','deliveryQuality','reliability'] as const).map(k => (
              <div key={k} className="flex justify-between bg-bg-elevated rounded-lg px-3 py-2">
                <span className="text-text-muted">{CAT_LABELS[k]}</span>
                <span className="text-text-primary font-semibold">{form.categoryRatings[k]}/5</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3">
            <p className="font-semibold text-text-primary mb-1">{form.title}</p>
            <p className="text-text-secondary text-sm">{form.content}</p>
          </div>
          {(form.pros || form.cons) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {form.pros && <div className="bg-status-success/5 border border-status-success/15 rounded-lg p-2"><p className="text-status-success font-semibold mb-1">Pros</p><p className="text-text-secondary">{form.pros}</p></div>}
              {form.cons && <div className="bg-status-error/5 border border-status-error/15 rounded-lg p-2"><p className="text-status-error font-semibold mb-1">Cons</p><p className="text-text-secondary">{form.cons}</p></div>}
            </div>
          )}

          {/* Payment card */}
          <div className="hedera-badge rounded-2xl p-5 space-y-4 mt-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm font-medium">Review submission fee</p>
                <p className="text-xs text-text-muted mt-0.5">est. $0.07 USD</p>
              </div>
              <span className="text-4xl font-black text-brand-purple-light">1 HBAR</span>
            </div>
            <div className="border-t border-brand-purple/20 pt-3 grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-text-muted mb-1">Platform wallet</p>
                <p className="font-mono text-brand-cyan">0.0.9069262</p>
              </div>
              <div>
                <p className="text-text-muted mb-1">Network</p>
                <p className="text-status-success">Hedera Testnet</p>
              </div>
              <div>
                <p className="text-text-muted mb-1">NFT Badge</p>
                <p className="text-brand-purple-light">Minted on submit</p>
              </div>
            </div>
            <div className="text-left space-y-2 text-xs text-text-secondary">
              <p className="flex items-start gap-2">
                <Shield className="w-3.5 h-3.5 text-status-success shrink-0 mt-0.5" />
                Review stored immutably on Hedera Consensus Service
              </p>
              <p className="flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-brand-purple-light shrink-0 mt-0.5" />
                Fee deters spam. Every review represents genuine experience.
              </p>
              <p className="flex items-start gap-2">
                <Hash className="w-3.5 h-3.5 text-brand-cyan shrink-0 mt-0.5" />
                Your identity stays fully anonymous
              </p>
            </div>
          </div>

          {submitError && (
            <div className="flex items-center gap-2 bg-status-error/10 border border-status-error/20 rounded-xl p-3 text-sm text-status-error">
              <AlertCircle className="w-4 h-4 shrink-0" />{submitError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setStep('form')}
              disabled={payState !== 'idle' || submitting}
              className="flex-1 py-3 rounded-xl glass border border-border hover:border-border-bright text-text-primary font-medium transition-all disabled:opacity-50"
            >
              Back
            </button>
            {payState === 'idle' && (
              <button
                onClick={handlePay}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white font-semibold transition-all glow-purple disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4"/>Stake your credibility · 1 HBAR
              </button>
            )}
            {payState === 'processing' && (
              <button disabled className="flex-1 py-3 rounded-xl bg-brand-purple/40 text-white/60 font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing on Hedera
              </button>
            )}
            {payState === 'confirmed' && submitting && (
              <button disabled className="flex-1 py-3 rounded-xl bg-brand-purple/40 text-white/60 font-semibold flex items-center justify-center gap-2 cursor-not-allowed">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <StepIndicator current="form" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Write a Review</h1>
        <p className="text-text-muted text-sm mt-1">Your identity is anonymised. Review stored immutably on Hedera.</p>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Company <span className="text-status-error">*</span></label>
          <input type="text" value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} placeholder="e.g. Stripe, AWS, Notion" className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-purple/50 transition-colors"/>
          {errors.company && <p className="text-status-error text-xs mt-1">{errors.company}</p>}
        </div>

        {/* Relationship type */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Relationship Type <span className="text-status-error">*</span></label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {RELATIONSHIP_TYPES.map(rt => (
              <button key={rt} type="button" onClick={() => setForm(f => ({...f, relationshipType: rt}))}
                className={clsx('flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all',
                  form.relationshipType === rt ? 'bg-brand-purple/20 border-brand-purple/40 text-brand-purple-light' : 'bg-bg-elevated border-border text-text-secondary hover:border-border-bright'
                )}>
                <span className="font-semibold">{rt}</span>
                <span className="text-[9px] text-text-muted text-center leading-tight">{RELATIONSHIP_DESC[rt]}</span>
              </button>
            ))}
          </div>
          {errors.relationshipType && <p className="text-status-error text-xs mt-1">{errors.relationshipType}</p>}
        </div>

        {/* Job role */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Job Role <span className="text-text-muted font-normal">(optional)</span></label>
          <div className="flex flex-wrap gap-2">
            {JOB_ROLES.map(role => (
              <button key={role} type="button" onClick={() => setForm(f => ({...f, jobRole: f.jobRole === role ? '' : role}))}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  form.jobRole === role ? 'bg-brand-purple/20 border-brand-purple/40 text-brand-purple-light' : 'bg-bg-elevated border-border text-text-secondary hover:border-border-bright'
                )}>{role}</button>
            ))}
          </div>
        </div>

        {/* Industry category */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Industry Category <span className="text-status-error">*</span></label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button key={cat} type="button" onClick={() => setForm(f => ({...f, category: cat}))}
                className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  form.category === cat ? 'bg-brand-purple/20 border-brand-purple/40 text-brand-purple-light' : 'bg-bg-elevated border-border text-text-secondary hover:border-border-bright'
                )}>{cat}</button>
            ))}
          </div>
          {errors.category && <p className="text-status-error text-xs mt-1">{errors.category}</p>}
        </div>

        {/* Category ratings */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3">
            Category Ratings <span className="text-status-error">*</span>
            {overallRating > 0 && (
              <span className="ml-2 text-brand-purple-light font-normal">Overall: {overallRating.toFixed(1)} / 5.0</span>
            )}
          </label>
          <div className="space-y-3 bg-bg-elevated/50 rounded-xl p-4">
            {(['paymentContracts','communication','deliveryQuality','reliability'] as const).map(key => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-sm text-text-secondary w-44 shrink-0">{CAT_LABELS[key]}</span>
                <StarRating
                  rating={form.categoryRatings[key]}
                  interactive size="md"
                  onChange={v => setRating(key, v)}
                />
                <span className={clsx('text-sm font-semibold w-6 text-right tabular-nums',
                  form.categoryRatings[key] >= 4 ? 'text-status-success'
                  : form.categoryRatings[key] >= 3 ? 'text-rating-gold'
                  : form.categoryRatings[key] > 0 ? 'text-status-error'
                  : 'text-text-muted'
                )}>
                  {form.categoryRatings[key] > 0 ? form.categoryRatings[key] : ''}
                </span>
              </div>
            ))}

            {/* Would work again toggle */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/50">
              <span className="text-sm text-text-secondary">Would Work Again</span>
              <button
                type="button"
                onClick={() => setRating('wouldWorkAgain', !form.categoryRatings.wouldWorkAgain)}
                className={clsx('flex items-center gap-2 px-4 py-1.5 rounded-xl border font-medium text-sm transition-all',
                  form.categoryRatings.wouldWorkAgain
                    ? 'bg-status-success/15 border-status-success/30 text-status-success'
                    : 'bg-status-error/10 border-status-error/20 text-status-error'
                )}
              >
                {form.categoryRatings.wouldWorkAgain ? <><Check className="w-3.5 h-3.5"/>Yes</> : <><X className="w-3.5 h-3.5"/>No</>}
              </button>
            </div>
          </div>
          {errors.ratings && <p className="text-status-error text-xs mt-1">{errors.ratings}</p>}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Review Title <span className="text-status-error">*</span></label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="One-line summary of your experience" maxLength={120} className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-purple/50 transition-colors"/>
          {errors.title && <p className="text-status-error text-xs mt-1">{errors.title}</p>}
        </div>

        {/* Main review body */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Review <span className="text-status-error">*</span> <span className="text-text-muted font-normal">(min 50 chars)</span></label>
          <textarea value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} placeholder="Describe your experience in detail" rows={4} className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-purple/50 transition-colors resize-none"/>
          <div className="flex justify-between mt-1">
            {errors.content ? <p className="text-status-error text-xs">{errors.content}</p> : <span/>}
            <span className={clsx('text-xs tabular-nums', form.content.length >= 50 ? 'text-status-success' : 'text-text-muted')}>
              {form.content.length} / 50 min
            </span>
          </div>
        </div>

        {/* Pros / Cons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-status-success mb-1.5">Pros</label>
            <textarea value={form.pros} onChange={e => setForm(f => ({...f, pros: e.target.value}))} placeholder="What worked well?" rows={3} className="w-full bg-status-success/5 border border-status-success/20 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-status-success/40 transition-colors resize-none"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-status-error mb-1.5">Cons</label>
            <textarea value={form.cons} onChange={e => setForm(f => ({...f, cons: e.target.value}))} placeholder="What could be improved?" rows={3} className="w-full bg-status-error/5 border border-status-error/20 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-status-error/30 transition-colors resize-none"/>
          </div>
        </div>

        {/* Optional Hedera account */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">Hedera Account ID <span className="text-text-muted font-normal">(optional, for NFT delivery)</span></label>
          <input type="text" value={form.reviewerAccountId} onChange={e => setForm(f => ({...f, reviewerAccountId: e.target.value}))} placeholder="0.0.XXXXXX" className="w-full bg-bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-purple/50 transition-colors font-mono"/>
        </div>

        <button onClick={handleNext} className="w-full py-3 rounded-xl bg-brand-purple hover:bg-brand-purple-dark text-white font-semibold transition-all glow-purple flex items-center justify-center gap-2">
          Preview &amp; Confirm <ChevronRight className="w-4 h-4"/>
        </button>
      </div>
    </div>
  )
}
