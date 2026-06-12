import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicId,
} from '@hashgraph/sdk'
import { getHederaClient, getOperatorKey } from './hedera'

export async function createReviewTopic(): Promise<string> {
  const client = getHederaClient()
  const operatorKey = getOperatorKey()

  const tx = new TopicCreateTransaction()
    .setTopicMemo('RATER - Anonymous Verified Business Reviews')
    .setAdminKey(operatorKey)
    .setSubmitKey(operatorKey)
    .freezeWith(client)

  const signed = await tx.sign(operatorKey)
  const response = await signed.execute(client)
  const receipt = await response.getReceipt(client)

  if (!receipt.topicId) throw new Error('Failed to create HCS topic')
  return receipt.topicId.toString()
}

export interface HCSSubmitResult {
  txId: string
  sequenceNumber: number
}

export async function submitReviewToHCS(
  topicId: string,
  review: object
): Promise<HCSSubmitResult> {
  const client = getHederaClient()
  const operatorKey = getOperatorKey()

  const tx = new TopicMessageSubmitTransaction({
    topicId: TopicId.fromString(topicId),
    message: JSON.stringify(review),
  }).freezeWith(client)

  const signed = await tx.sign(operatorKey)
  const response = await signed.execute(client)
  const receipt = await response.getReceipt(client)

  return {
    txId: response.transactionId.toString(),
    sequenceNumber: receipt.topicSequenceNumber
      ? receipt.topicSequenceNumber.toNumber()
      : 0,
  }
}
