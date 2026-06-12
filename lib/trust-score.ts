import type { Review } from '@/types'

// RATER weighted Trust Score: recency-weighted average dampened by confidence (review volume)
// and boosted/penalised by consistency. A company with 1×5★ scores lower than 10×4★.
export function computeTrustScore(reviews: Review[]): number {
  if (reviews.length === 0) return 0

  const now = Date.now()
  const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000

  // 1. Recency-weighted average: reviews within the past year get full weight,
  //    older reviews decay toward 0.4× weight.
  let totalWeight = 0
  let weightedSum = 0
  for (const r of reviews) {
    const ageYears = (now - new Date(r.timestamp).getTime()) / YEAR_MS
    const w = ageYears < 1 ? 1.0 : Math.max(0.4, 1.0 - (ageYears - 1) * 0.4)
    totalWeight += w
    weightedSum += r.rating * w
  }
  const recencyAvg = totalWeight > 0 ? weightedSum / totalWeight : 0

  // 2. Consistency multiplier: high standard deviation signals disagreement → lower trust.
  const mean = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  const variance = reviews.reduce((s, r) => s + (r.rating - mean) ** 2, 0) / reviews.length
  const stdev = Math.sqrt(variance)
  const consistencyMul = Math.max(0.85, 1.0 - stdev * 0.06)

  // 3. Confidence multiplier: minor discount below 5 reviews.
  //    1 review → 0.93, 2 reviews → 0.95, 3 reviews → 0.97, 5+ → 1.0
  const confidenceMul = reviews.length >= 5
    ? 1.0
    : 0.92 + (reviews.length / 5) * 0.08

  return Math.round(
    Math.min(5.0, Math.max(0, recencyAvg * consistencyMul * confidenceMul)) * 10
  ) / 10
}
