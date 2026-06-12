import { NextResponse } from 'next/server'
import { getReviews } from '@/lib/store'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const company = searchParams.get('company')
  const category = searchParams.get('category')
  const minRating = parseInt(searchParams.get('minRating') || '0', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  let reviews = getReviews()

  if (company) {
    reviews = reviews.filter(
      (r) => r.company.toLowerCase().includes(company.toLowerCase())
    )
  }

  if (category) {
    reviews = reviews.filter(
      (r) => r.category.toLowerCase() === category.toLowerCase()
    )
  }

  if (minRating > 0) {
    reviews = reviews.filter((r) => r.rating >= minRating)
  }

  const companies = [...new Set(getReviews().map((r) => r.company))].sort()
  const categories = [...new Set(getReviews().map((r) => r.category))].sort()

  const total = reviews.length
  const paginated = reviews.slice(offset, offset + limit)

  const allReviews = getReviews()
  const avgRating =
    allReviews.length > 0
      ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      : 0
  const verifiedCount = allReviews.filter(r => r.isVerified).length

  return NextResponse.json({
    reviews: paginated,
    total,
    companies,
    categories,
    stats: {
      totalReviews: allReviews.length,
      totalCompanies: companies.length,
      averageRating: Math.round(avgRating * 10) / 10,
      verifiedCount,
    },
  })
}
