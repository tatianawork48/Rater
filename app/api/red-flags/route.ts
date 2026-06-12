import { NextResponse } from 'next/server'
import { getReviews } from '@/lib/store'
import { createGeminiClient } from '@/lib/gemini'
import { HumanMessage } from '@langchain/core/messages'
import type { RedFlag } from '@/types'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const company = new URL(request.url).searchParams.get('company')
  if (!company) return NextResponse.json({ error: 'company param required' }, { status: 400 })

  const reviews = getReviews().filter(
    r => r.company.toLowerCase() === company.toLowerCase()
  )

  // Need at least 2 reviews for meaningful pattern detection
  if (reviews.length < 2) {
    return NextResponse.json({ flags: [], reviewCount: reviews.length })
  }

  const corpus = reviews.map((r, i) =>
    `Review ${i + 1} (${r.relationshipType}, ${r.rating}/5):\nCons: ${r.cons}\nContent: ${r.content.slice(0, 300)}`
  ).join('\n\n---\n\n')

  const prompt = `You are analysing B2B company reviews for "${company}" to detect recurring complaints.

${corpus}

Identify negative themes that appear in 2 or more of the above reviews. Common themes to check for:
- Late payments or payment disputes
- Poor communication or unresponsiveness
- Missed deadlines or late delivery
- Quality issues or undelivered work
- Poor customer support
- Contract issues or overpromising
- Pricing / billing problems
- High staff turnover or account management issues

Return ONLY a valid JSON object with this exact structure — no markdown, no explanation:
{"flags":[{"theme":"brief description","icon":"single emoji","count":number,"severity":"high"|"medium"}]}

Only include themes present in 2+ reviews. If none qualify, return {"flags":[]}.`

  try {
    const llm = createGeminiClient()
    const response = await llm.invoke([new HumanMessage(prompt)])
    const raw = typeof response.content === 'string' ? response.content.trim() : ''

    // Strip markdown code fences if Gemini wraps the JSON
    const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let parsed: { flags: RedFlag[] }
    try {
      parsed = JSON.parse(json)
    } catch {
      console.error('Red-flag JSON parse failed:', json)
      return NextResponse.json({ flags: [] })
    }

    const flags = (parsed.flags ?? []).filter(
      (f: RedFlag) => f.count >= 2 && f.theme && f.icon
    )
    return NextResponse.json({ flags, reviewCount: reviews.length })
  } catch (err) {
    console.error('Red-flag Gemini error:', err)
    return NextResponse.json({ flags: [] })
  }
}
