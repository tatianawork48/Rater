import { NextResponse } from 'next/server'
import { getReviews } from '@/lib/store'
import { createGeminiClient } from '@/lib/gemini'
import { HumanMessage } from '@langchain/core/messages'

export const runtime = 'nodejs'

interface CompanyStats {
  name: string
  avgRating: number
  reviewCount: number
  catAvgs: {
    paymentContracts: number
    communication: number
    deliveryQuality: number
    reliability: number
  }
  wouldWorkAgainPct: number
  categories: string[]
  topRelationshipType: string
}

export interface CompareResult {
  companyA: CompanyStats
  companyB: CompanyStats
  summary: string
}

function getStats(company: string): CompanyStats | null {
  const reviews = getReviews().filter(
    r => r.company.toLowerCase() === company.toLowerCase()
  )
  if (reviews.length === 0) return null

  const catKeys = ['paymentContracts', 'communication', 'deliveryQuality', 'reliability'] as const
  const catAvgs = Object.fromEntries(
    catKeys.map(k => [
      k,
      Math.round((reviews.reduce((s, r) => s + (r.categoryRatings?.[k] ?? 0), 0) / reviews.length) * 10) / 10,
    ])
  ) as CompanyStats['catAvgs']

  const avgRating = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10

  const wouldWorkAgainPct = Math.round(
    (reviews.filter(r => r.categoryRatings?.wouldWorkAgain).length / reviews.length) * 100
  )

  const relCounts = reviews.reduce<Record<string, number>>((acc, r) => {
    acc[r.relationshipType] = (acc[r.relationshipType] || 0) + 1
    return acc
  }, {})
  const topRelationshipType = Object.entries(relCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Client'

  return {
    name: reviews[0].company,
    avgRating,
    reviewCount: reviews.length,
    catAvgs,
    wouldWorkAgainPct,
    categories: [...new Set(reviews.map(r => r.category))],
    topRelationshipType,
  }
}

async function generateComparison(a: CompanyStats, b: CompanyStats): Promise<string> {
  const llm = createGeminiClient()

  const prompt = `You are a B2B analyst comparing two companies based on verified anonymous reviews.

Company A: ${a.name}
- Trust Score: ${a.avgRating}/5.0 (${a.reviewCount} verified reviews)
- Payment & Contracts: ${a.catAvgs.paymentContracts}/5
- Communication: ${a.catAvgs.communication}/5
- Delivery & Quality: ${a.catAvgs.deliveryQuality}/5
- Reliability: ${a.catAvgs.reliability}/5
- Would Work Again: ${a.wouldWorkAgainPct}%
- Primary reviewer type: ${a.topRelationshipType}s
- Industries: ${a.categories.join(', ')}

Company B: ${b.name}
- Trust Score: ${b.avgRating}/5.0 (${b.reviewCount} verified reviews)
- Payment & Contracts: ${b.catAvgs.paymentContracts}/5
- Communication: ${b.catAvgs.communication}/5
- Delivery & Quality: ${b.catAvgs.deliveryQuality}/5
- Reliability: ${b.catAvgs.reliability}/5
- Would Work Again: ${b.wouldWorkAgainPct}%
- Primary reviewer type: ${b.topRelationshipType}s
- Industries: ${b.categories.join(', ')}

Write a concise 3-paragraph comparison:
1. Overall verdict — which scores higher overall and in which key areas (2 sentences)
2. The main strengths and weaknesses of each company relative to the other (2–3 sentences)
3. Recommendation — which type of buyer or use-case each company suits best (2 sentences)

Keep it factual, data-driven, and under 200 words total. Do not use markdown formatting.`

  try {
    const response = await llm.invoke([new HumanMessage(prompt)])
    return typeof response.content === 'string' ? response.content.trim() : 'Comparison unavailable.'
  } catch {
    return `${a.name} (${a.avgRating}/5.0, ${a.reviewCount} reviews) and ${b.name} (${b.avgRating}/5.0, ${b.reviewCount} reviews) both have verified reviews on the platform. Review their category scores above for a detailed breakdown.`
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const aName = searchParams.get('a') ?? ''
  const bName = searchParams.get('b') ?? ''

  if (!aName || !bName) {
    return NextResponse.json({ error: 'Provide both ?a= and ?b= company names' }, { status: 400 })
  }

  const statsA = getStats(aName)
  const statsB = getStats(bName)

  if (!statsA) return NextResponse.json({ error: `No reviews found for "${aName}"` }, { status: 404 })
  if (!statsB) return NextResponse.json({ error: `No reviews found for "${bName}"` }, { status: 404 })

  const summary = await generateComparison(statsA, statsB)

  return NextResponse.json({ companyA: statsA, companyB: statsB, summary } satisfies CompareResult)
}
