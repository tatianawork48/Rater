import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { getTopicId, setTopicId, getNftTokenId, setNftTokenId, addReview } from '@/lib/store'
import { createReviewTopic, submitReviewToHCS } from '@/lib/hcs'
import { createNftCollection, mintReviewBadge } from '@/lib/hts'
import type { SubmitReviewPayload, Review, CategoryRatings } from '@/types'

export const runtime = 'nodejs'

function calcRating(cr: CategoryRatings): number {
  const scores = [cr.paymentContracts, cr.communication, cr.deliveryQuality, cr.reliability, cr.wouldWorkAgain ? 5 : 1]
  return Math.round((scores.reduce((a, b) => a + b, 0) / 5) * 10) / 10
}

function anonymise(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) { h = Math.imul(31, h) + seed.charCodeAt(i) | 0 }
  return `anon_${Math.abs(h).toString(16).padStart(8, '0')}`
}

export async function POST(request: Request) {
  let body: SubmitReviewPayload
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }) }

  const { company, category, title, content, pros, cons, relationshipType, jobRole, categoryRatings, reviewerAccountId } = body

  if (!company || !category || !title || !content || !relationshipType || !categoryRatings) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (content.trim().length < 50) {
    return NextResponse.json({ error: 'Review content must be at least 50 characters' }, { status: 400 })
  }
  const numericKeys = ['paymentContracts','communication','deliveryQuality','reliability'] as const
  for (const k of numericKeys) {
    if (categoryRatings[k] < 1 || categoryRatings[k] > 5) {
      return NextResponse.json({ error: `Invalid rating for ${k}` }, { status: 400 })
    }
  }

  const reviewId = uuidv4()
  const reviewerHash = anonymise(`${reviewerAccountId ?? ''}_${Date.now()}_${Math.random()}`)
  const rating = calcRating(categoryRatings)

  let topicId = getTopicId()
  let nftTokenId = getNftTokenId()
  let hcsTxId = 'pending'
  let hcsSequenceNumber: number | undefined
  let nftSerial: number | undefined

  try {
    if (!topicId) {
      topicId = await createReviewTopic()
      setTopicId(topicId)
    }
    const hcsResult = await submitReviewToHCS(topicId, {
      id: reviewId, company, category, rating, title, content, pros, cons,
      relationshipType, categoryRatings, timestamp: new Date().toISOString(),
      reviewerHash, version: '2.0', platform: 'RATER',
    })
    hcsTxId = hcsResult.txId
    hcsSequenceNumber = hcsResult.sequenceNumber
  } catch (err) {
    console.error('HCS submission failed:', err)
    hcsTxId = `failed-${Date.now()}`
    if (!topicId) topicId = '0.0.demo'
  }

  try {
    if (!nftTokenId) {
      nftTokenId = await createNftCollection()
      setNftTokenId(nftTokenId)
    }
    nftSerial = await mintReviewBadge(nftTokenId, {
      name: `RATER Review Badge #${reviewId.slice(0, 8)}`,
      description: `Verified anonymous review badge for ${company} on RATER`,
      company, rating, reviewId,
      timestamp: new Date().toISOString(),
      platform: 'RATER', network: 'testnet',
    })
  } catch (err) {
    console.error('NFT mint failed:', err)
  }

  const review: Review = {
    id: reviewId, company, category, rating, title, content,
    pros: pros ?? '', cons: cons ?? '',
    relationshipType, jobRole, categoryRatings,
    timestamp: new Date().toISOString(),
    reviewerHash, hcsTopicId: topicId,
    hcsTxId, hcsSequenceNumber,
    nftSerial, nftTokenId: nftTokenId ?? undefined,
    upvotes: 0,
    isVerified: !hcsTxId.startsWith('failed'),
  }

  addReview(review)

  return NextResponse.json({
    success: true,
    review,
    message: 'Review submitted to Hedera blockchain',
    hedera: {
      network: 'testnet', topicId, txId: hcsTxId,
      sequenceNumber: hcsSequenceNumber,
      nftTokenId, nftSerial,
      explorerUrl: `https://hashscan.io/testnet/transaction/${hcsTxId}`,
    },
  })
}
