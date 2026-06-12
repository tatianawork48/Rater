import { NextResponse } from 'next/server'
import { getReviews } from '@/lib/store'
import { chatWithReviews } from '@/lib/gemini'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  let body: { message: string; history?: { role: 'user' | 'assistant'; content: string }[] }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { message, history = [] } = body

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 })
  }

  const reviews = getReviews()

  try {
    const response = await chatWithReviews(message.trim(), reviews, history)
    return NextResponse.json({
      message: response,
      reviewsInContext: reviews.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
