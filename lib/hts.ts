import {
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenType,
  TokenSupplyType,
  TokenId,
  TransferTransaction,
  AccountId,
  NftId,
  Hbar,
} from '@hashgraph/sdk'
import { getHederaClient, getOperatorKey, getOperatorId } from './hedera'

export async function createNftCollection(): Promise<string> {
  const client = getHederaClient()
  const operatorKey = getOperatorKey()
  const operatorId = getOperatorId()

  const tx = new TokenCreateTransaction()
    .setTokenName('RATER Review Badge')
    .setTokenSymbol('RATERBADGE')
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(operatorId)
    .setAdminKey(operatorKey)
    .setSupplyKey(operatorKey)
    .setMaxTransactionFee(new Hbar(50))
    .freezeWith(client)

  const signed = await tx.sign(operatorKey)
  const response = await signed.execute(client)
  const receipt = await response.getReceipt(client)

  if (!receipt.tokenId) throw new Error('Failed to create NFT collection')
  return receipt.tokenId.toString()
}

export interface NftMetadata {
  name: string
  description: string
  company: string
  rating: number
  reviewId: string
  timestamp: string
  platform: string
  network: string
}

export async function mintReviewBadge(
  tokenId: string,
  metadata: NftMetadata
): Promise<number> {
  const client = getHederaClient()
  const operatorKey = getOperatorKey()

  const shortMeta = `RATER-review-${metadata.timestamp}`
  const tx = new TokenMintTransaction()
    .setTokenId(TokenId.fromString(tokenId))
    .addMetadata(Buffer.from(shortMeta))
    .freezeWith(client)

  const signed = await tx.sign(operatorKey)
  const response = await signed.execute(client)
  const receipt = await response.getReceipt(client)

  if (!receipt.serials || receipt.serials.length === 0) {
    throw new Error('Failed to mint NFT')
  }
  return receipt.serials[0].toNumber()
}

export async function transferNftBadge(
  tokenId: string,
  serial: number,
  recipientAccountId: string
): Promise<string> {
  const client = getHederaClient()
  const operatorKey = getOperatorKey()
  const operatorId = getOperatorId()

  const tx = new TransferTransaction()
    .addNftTransfer(
      new NftId(TokenId.fromString(tokenId), serial),
      operatorId,
      AccountId.fromString(recipientAccountId)
    )
    .freezeWith(client)

  const signed = await tx.sign(operatorKey)
  const response = await signed.execute(client)
  const receipt = await response.getReceipt(client)
  void receipt
  return response.transactionId.toString()
}
