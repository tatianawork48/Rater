import {
  Client,
  PrivateKey,
  AccountId,
  Hbar,
} from '@hashgraph/sdk'

let _client: Client | null = null
let _privateKey: PrivateKey | null = null

function parsePrivateKey(raw: string): PrivateKey {
  // DER-encoded ECDSA keys start with the ASN.1 sequence prefix 3030 or 3041
  const isDerEcdsa = raw.startsWith('30')
  if (isDerEcdsa) {
    return PrivateKey.fromStringECDSA(raw)
  }
  // Raw 32-byte ECDSA hex (64 chars)
  if (raw.length === 64) {
    return PrivateKey.fromStringECDSA(raw)
  }
  // Fallback: let the SDK auto-detect (handles Ed25519 DER / raw)
  return PrivateKey.fromString(raw)
}

export function getHederaClient(): Client {
  if (_client) return _client

  const accountId = process.env.HEDERA_ACCOUNT_ID
  const privateKey = process.env.HEDERA_PRIVATE_KEY

  if (!accountId || !privateKey) {
    throw new Error('HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY must be set')
  }

  const pk = parsePrivateKey(privateKey)
  const client = Client.forTestnet()
  client.setOperator(AccountId.fromString(accountId), pk)
  client.setDefaultMaxTransactionFee(new Hbar(10))
  client.setDefaultMaxQueryPayment(new Hbar(5))

  _client = client
  return client
}

export function getOperatorKey(): PrivateKey {
  if (_privateKey) return _privateKey
  const privateKey = process.env.HEDERA_PRIVATE_KEY
  if (!privateKey) throw new Error('HEDERA_PRIVATE_KEY must be set')
  _privateKey = parsePrivateKey(privateKey)
  return _privateKey
}

export function getOperatorId(): AccountId {
  const accountId = process.env.HEDERA_ACCOUNT_ID
  if (!accountId) throw new Error('HEDERA_ACCOUNT_ID must be set')
  return AccountId.fromString(accountId)
}

export async function getMirrorNodeMessages(topicId: string): Promise<unknown[]> {
  try {
    const url = `https://testnet.mirrornode.hedera.com/api/v1/topics/${topicId}/messages?limit=100&order=desc`
    const res = await fetch(url, { next: { revalidate: 30 } })
    if (!res.ok) return []
    const data = await res.json()
    return (data.messages || []).map((m: { message: string; consensus_timestamp: string }) => {
      try {
        return JSON.parse(Buffer.from(m.message, 'base64').toString('utf-8'))
      } catch {
        return null
      }
    }).filter(Boolean)
  } catch {
    return []
  }
}
