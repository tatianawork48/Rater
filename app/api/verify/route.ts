import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MIRROR = 'https://testnet.mirrornode.hedera.com/api/v1'
const TOPIC_ID = process.env.HEDERA_TOPIC_ID ?? '0.0.9177253'

export interface VerifyResult {
  type: 'transaction' | 'message'
  raw: Record<string, unknown>
  message?: Record<string, unknown>  // decoded JSON from the HCS message
  hashscanUrl: string
}

function decodeMessage(b64: string): Record<string, unknown> | null {
  try {
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'))
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const input = searchParams.get('id') ?? searchParams.get('seq') ?? ''

  if (!input) {
    return NextResponse.json({ error: 'Provide ?id= (transaction ID) or ?seq= (sequence number)' }, { status: 400 })
  }

  // ── Sequence number lookup (integer) ──────────────────────────────────────
  if (/^\d+$/.test(input.trim())) {
    const seq = input.trim()
    const url = `${MIRROR}/topics/${TOPIC_ID}/messages?sequenceNumber=${seq}&limit=1`
    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json(
        { error: `Mirror node returned ${res.status} for sequence ${seq}` },
        { status: 404 }
      )
    }
    const data = await res.json()
    const msgs: unknown[] = data.messages ?? []
    if (msgs.length === 0) {
      return NextResponse.json({ error: `No message found with sequence number ${seq}` }, { status: 404 })
    }
    const raw = msgs[0] as Record<string, unknown>
    const b64 = typeof raw.message === 'string' ? raw.message : ''
    const decoded = decodeMessage(b64)
    return NextResponse.json({
      type: 'message',
      raw,
      message: decoded ?? undefined,
      hashscanUrl: `https://hashscan.io/testnet/topic/${TOPIC_ID}`,
    } satisfies VerifyResult)
  }

  // ── Transaction ID lookup ─────────────────────────────────────────────────
  // Normalise separators: both 0.0.X@Y.Z and 0-0-X-Y-Z forms are accepted by mirror node
  const txId = input.trim()
  const txUrl = `${MIRROR}/transactions/${encodeURIComponent(txId)}`
  const txRes = await fetch(txUrl)
  if (!txRes.ok) {
    return NextResponse.json(
      { error: `Transaction not found: ${txId}` },
      { status: 404 }
    )
  }
  const txData = await txRes.json()
  const txList: unknown[] = txData.transactions ?? [txData]
  const raw = (txList[0] ?? txData) as Record<string, unknown>

  // Attempt to retrieve the associated topic message via consensus_timestamp
  let decoded: Record<string, unknown> | null = null
  const ts = typeof raw.consensus_timestamp === 'string' ? raw.consensus_timestamp : ''
  if (ts) {
    const msgUrl = `${MIRROR}/topics/${TOPIC_ID}/messages?timestamp=${ts}&limit=1`
    const msgRes = await fetch(msgUrl)
    if (msgRes.ok) {
      const msgData = await msgRes.json()
      const msgs: unknown[] = msgData.messages ?? []
      if (msgs.length > 0) {
        const m = msgs[0] as Record<string, unknown>
        const b64 = typeof m.message === 'string' ? m.message : ''
        decoded = decodeMessage(b64)
      }
    }
  }

  return NextResponse.json({
    type: 'transaction',
    raw,
    message: decoded ?? undefined,
    hashscanUrl: `https://hashscan.io/testnet/transaction/${txId}`,
  } satisfies VerifyResult)
}
