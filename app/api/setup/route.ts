import { NextResponse } from 'next/server'
import { createReviewTopic } from '@/lib/hcs'
import { createNftCollection } from '@/lib/hts'
import { getTopicId, setTopicId, getNftTokenId, setNftTokenId } from '@/lib/store'

export const runtime = 'nodejs'

export async function GET() {
  const results: { topicId?: string; nftTokenId?: string; errors: string[] } = {
    errors: [],
  }

  // Create HCS topic if not exists
  if (!getTopicId()) {
    try {
      const topicId = await createReviewTopic()
      setTopicId(topicId)
      results.topicId = topicId
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.errors.push(`HCS topic creation failed: ${msg}`)
    }
  } else {
    results.topicId = getTopicId()!
  }

  // Create NFT collection if not exists
  if (!getNftTokenId()) {
    try {
      const nftTokenId = await createNftCollection()
      setNftTokenId(nftTokenId)
      results.nftTokenId = nftTokenId
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.errors.push(`NFT collection creation failed: ${msg}`)
    }
  } else {
    results.nftTokenId = getNftTokenId()!
  }

  return NextResponse.json({
    success: results.errors.length === 0,
    ...results,
    instructions:
      results.topicId && results.nftTokenId
        ? `Add to .env.local:\nHEDERA_TOPIC_ID=${results.topicId}\nHEDERA_NFT_TOKEN_ID=${results.nftTokenId}`
        : 'Setup incomplete, check errors',
  })
}
