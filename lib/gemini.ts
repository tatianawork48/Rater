import Groq from 'groq-sdk'
import type { Review } from '@/types'

function getClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY! })
}

const MODEL = 'llama-3.3-70b-versatile'

// Compatibility wrapper so callers (red-flags, compare routes) that do
// `llm.invoke([new HumanMessage(prompt)])` need zero changes.
// LangChain message objects expose _getType() → 'human' | 'system' | 'ai'
class LLMCompat {
  async invoke(
    messages: Array<{ _getType(): string; content: string | unknown[] }>
  ): Promise<{ content: string }> {
    const mapped: Groq.Chat.ChatCompletionMessageParam[] = messages.map((m) => {
      const t = m._getType()
      const role =
        t === 'human' ? 'user' as const
        : t === 'ai'  ? 'assistant' as const
        :               'system' as const
      const content =
        typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      return { role, content }
    })

    const res = await getClient().chat.completions.create({
      model: MODEL,
      messages: mapped,
      max_tokens: 1024,
      temperature: 0.7,
    })

    return { content: res.choices[0]?.message?.content ?? '' }
  }
}

export function createGeminiClient(): LLMCompat {
  return new LLMCompat()
}

function buildReviewContext(reviews: Review[]): string {
  const companies = [...new Set(reviews.map((r) => r.company))]
  const summary = companies.map((company) => {
    const companyReviews = reviews.filter((r) => r.company === company)
    const avgRating =
      companyReviews.reduce((sum, r) => sum + r.rating, 0) / companyReviews.length
    return {
      company,
      avgRating: avgRating.toFixed(1),
      reviewCount: companyReviews.length,
      categories: [...new Set(companyReviews.map((r) => r.category))],
      recentTitles: companyReviews.slice(0, 3).map((r) => r.title),
    }
  })

  const recentDetailed = reviews.slice(0, 20).map((r) => ({
    company: r.company,
    rating: r.rating,
    title: r.title,
    content: r.content.slice(0, 200),
    category: r.category,
    timestamp: r.timestamp,
  }))

  return `COMPANY SUMMARIES:\n${JSON.stringify(summary, null, 2)}\n\nRECENT REVIEWS (detailed):\n${JSON.stringify(recentDetailed, null, 2)}`
}

export async function chatWithReviews(
  userMessage: string,
  reviews: Review[],
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  const context = buildReviewContext(reviews)

  const systemPrompt = `You are RATER AI — an intelligent assistant for the RATER platform, an anonymous verified business review platform built on the Hedera blockchain.

All reviews in RATER are cryptographically verified and stored immutably on Hedera Consensus Service (HCS). Reviewers receive NFT badges as proof of verified submission.

LIVE REVIEW DATABASE:
${context}

Your capabilities:
- Summarize company reputation and ratings
- Compare companies across categories
- Identify sentiment trends
- Answer questions about specific reviews
- Help users decide which companies to research

Formatting guidelines:
- Use ⭐ for ratings (e.g., ⭐⭐⭐⭐ for 4/5)
- Bold company names with **Company**
- Use bullet points for lists
- Keep responses concise but informative
- Always cite the verified review count when making rating claims`

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ]

  try {
    const res = await getClient().chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    })
    const text = res.choices[0]?.message?.content ?? ''
    return text
  } catch (err) {
    console.error('Groq error:', err)
    throw new Error('AI chat service unavailable. Please try again.')
  }
}

export async function generateCompanySentiment(
  company: string,
  reviews: Review[]
): Promise<string> {
  const companyReviews = reviews.filter(
    (r) => r.company.toLowerCase() === company.toLowerCase()
  )

  if (companyReviews.length === 0) return 'neutral'

  const prompt = `Based on these reviews for ${company}, classify the overall sentiment as exactly one word: "positive", "neutral", or "negative".

Reviews: ${JSON.stringify(companyReviews.map((r) => ({ rating: r.rating, title: r.title })))}

Respond with only: positive, neutral, or negative`

  try {
    const res = await getClient().chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10,
      temperature: 0,
    })
    const result = (res.choices[0]?.message?.content ?? '').trim().toLowerCase()
    if (['positive', 'neutral', 'negative'].includes(result)) return result
    return 'neutral'
  } catch {
    const avg = companyReviews.reduce((s, r) => s + r.rating, 0) / companyReviews.length
    return avg >= 4 ? 'positive' : avg >= 2.5 ? 'neutral' : 'negative'
  }
}
