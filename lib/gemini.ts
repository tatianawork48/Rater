import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai'
import type { Review } from '@/types'

// ── Google AI Studio (Gemini) client ──────────────────────────────────────────
// Uses the free-tier Gemini models. Get a key at https://aistudio.google.com/apikey
// Default model is overridable via GEMINI_MODEL (e.g. gemini-2.5-flash).

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

function getApiKey(): string {
  const key =
    process.env.GOOGLE_AI_STUDIO_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY
  if (!key) {
    throw new Error(
      'GOOGLE_AI_STUDIO_API_KEY (or GEMINI_API_KEY) must be set — get one at https://aistudio.google.com/apikey'
    )
  }
  return key
}

let _genAI: GoogleGenerativeAI | null = null
function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) _genAI = new GoogleGenerativeAI(getApiKey())
  return _genAI
}

const MODEL_IS_THINKING =
  /2\.5|gemini-3|thinking/i.test(MODEL)

// gemini-2.5 / 3.x models enable "thinking" by default, which silently consumes
// the output-token budget — long prompts hit MAX_TOKENS before any answer text
// is produced, truncating JSON and yielding empty results. These tasks are short
// and structured, so disable thinking. The field isn't in the SDK's typed
// GenerationConfig yet but the REST API accepts it, hence the cast.
function genConfig(cfg: GenerationConfig): GenerationConfig {
  if (!MODEL_IS_THINKING) return cfg
  return { ...cfg, thinkingConfig: { thinkingBudget: 0 } } as GenerationConfig
}

// Compatibility wrapper so callers (red-flags, compare routes) that do
// `llm.invoke([new HumanMessage(prompt)])` need zero changes.
// LangChain message objects expose _getType() → 'human' | 'system' | 'ai'
class LLMCompat {
  async invoke(
    messages: Array<{ _getType(): string; content: string | unknown[] }>
  ): Promise<{ content: string }> {
    // Gemini takes a single system instruction plus a turn-based contents array.
    let systemInstruction: string | undefined
    const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = []

    for (const m of messages) {
      const t = m._getType()
      const text =
        typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      if (t === 'system') {
        systemInstruction = systemInstruction ? `${systemInstruction}\n${text}` : text
      } else {
        contents.push({
          role: t === 'ai' ? 'model' : 'user',
          parts: [{ text }],
        })
      }
    }

    const model = getGenAI().getGenerativeModel({
      model: MODEL,
      ...(systemInstruction ? { systemInstruction } : {}),
    })

    const res = await model.generateContent({
      contents,
      generationConfig: genConfig({ maxOutputTokens: 1024, temperature: 0.7 }),
    })

    return { content: res.response.text() }
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

  // Gemini requires the chat history to begin with a 'user' turn (the system
  // prompt is passed separately as systemInstruction). The UI seeds an assistant
  // greeting, so drop any leading 'model' turns before handing history to Gemini.
  const geminiHistory = history.map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }))
  while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
    geminiHistory.shift()
  }

  try {
    const model = getGenAI().getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt,
    })
    const chat = model.startChat({
      history: geminiHistory,
      generationConfig: genConfig({ maxOutputTokens: 1024, temperature: 0.7 }),
    })
    const res = await chat.sendMessage(userMessage)
    return res.response.text()
  } catch (err) {
    console.error('Gemini error:', err)
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
    const model = getGenAI().getGenerativeModel({ model: MODEL })
    const res = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: genConfig({ maxOutputTokens: 10, temperature: 0 }),
    })
    const result = res.response.text().trim().toLowerCase()
    if (['positive', 'neutral', 'negative'].includes(result)) return result
    return 'neutral'
  } catch {
    const avg = companyReviews.reduce((s, r) => s + r.rating, 0) / companyReviews.length
    return avg >= 4 ? 'positive' : avg >= 2.5 ? 'neutral' : 'negative'
  }
}
