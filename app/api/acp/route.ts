import { NextResponse } from 'next/server'
import { getReviews, getTopicId } from '@/lib/store'
import type { ACPCompanyData } from '@/types'

export const runtime = 'nodejs'

// ACP-compatible endpoint for agent-to-agent reputation queries
// Spec: acp/reputation/v1
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')
  const format = searchParams.get('format') || 'full'

  const allReviews = getReviews()
  const topicId = getTopicId() || process.env.HEDERA_TOPIC_ID || '0.0.demo'

  if (company) {
    const companyReviews = allReviews.filter(
      (r) => r.company.toLowerCase() === company.toLowerCase()
    )

    if (companyReviews.length === 0) {
      return NextResponse.json(
        {
          schema: 'acp/reputation/v1',
          error: 'Company not found',
          company,
        },
        { status: 404 }
      )
    }

    const avgRating =
      companyReviews.reduce((s, r) => s + r.rating, 0) / companyReviews.length

    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    companyReviews.forEach((r) => {
      ratingBreakdown[r.rating] = (ratingBreakdown[r.rating] || 0) + 1
    })

    const sentiment = avgRating >= 4 ? 'positive' : avgRating >= 2.5 ? 'neutral' : 'negative'

    const response: ACPCompanyData = {
      schema: 'acp/reputation/v1',
      company: companyReviews[0].company,
      averageRating: Math.round(avgRating * 100) / 100,
      totalReviews: companyReviews.length,
      sentiment,
      ratingBreakdown,
      recentReviews: format === 'full' ? companyReviews.slice(0, 5) : [],
      hcsTopicId: topicId,
      network: 'testnet',
      lastUpdated: new Date().toISOString(),
    }

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'X-ACP-Schema': 'reputation/v1',
        'X-ACP-Platform': 'RATER',
        'X-ACP-Network': 'hedera-testnet',
      },
    })
  }

  // Return full platform index
  const companies = [...new Set(allReviews.map((r) => r.company))]
  const index = companies.map((name) => {
    const reviews = allReviews.filter((r) => r.company === name)
    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    return {
      company: name,
      averageRating: Math.round(avg * 100) / 100,
      totalReviews: reviews.length,
      sentiment: avg >= 4 ? 'positive' : avg >= 2.5 ? 'neutral' : 'negative',
      categories: [...new Set(reviews.map((r) => r.category))],
    }
  })

  const globalAvg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length

  return NextResponse.json({
    schema: 'acp/platform-index/v1',
    platform: 'RATER',
    description: 'Anonymous verified business review platform on Hedera',
    network: 'hedera-testnet',
    hcsTopicId: topicId,
    totalReviews: allReviews.length,
    totalCompanies: companies.length,
    globalAverageRating: Math.round(globalAvg * 100) / 100,
    companies: index,
    endpoints: {
      companyReputation: '/api/acp?company={name}',
      allReviews: '/api/reviews',
      submitReview: '/api/submit-review',
    },
    lastUpdated: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  let body: { companies?: string[]; query?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const allReviews = getReviews()
  const topicId = getTopicId() || process.env.HEDERA_TOPIC_ID || '0.0.demo'

  if (body.companies && Array.isArray(body.companies)) {
    const results = body.companies.map((name) => {
      const reviews = allReviews.filter(
        (r) => r.company.toLowerCase() === name.toLowerCase()
      )
      if (reviews.length === 0) return { company: name, error: 'not found' }

      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      return {
        company: reviews[0].company,
        averageRating: Math.round(avg * 100) / 100,
        totalReviews: reviews.length,
        sentiment: avg >= 4 ? 'positive' : avg >= 2.5 ? 'neutral' : 'negative',
      }
    })

    return NextResponse.json({
      schema: 'acp/batch-reputation/v1',
      results,
      hcsTopicId: topicId,
      network: 'testnet',
      timestamp: new Date().toISOString(),
    })
  }

  return NextResponse.json({ error: 'Provide companies array or company query param' }, { status: 400 })
}
