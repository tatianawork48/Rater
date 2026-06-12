export interface CategoryRatings {
  paymentContracts: number  // 1–5
  communication: number     // 1–5
  deliveryQuality: number   // 1–5
  reliability: number       // 1–5
  wouldWorkAgain: boolean
}

export type RelationshipType = 'Client' | 'Vendor' | 'Partner' | 'Employee'

export type JobRole = 'CEO / Founder' | 'Product Manager' | 'Engineer' | 'Sales' | 'Marketing' | 'Operations' | 'Finance' | 'Legal' | 'Other'

export interface Review {
  id: string
  company: string
  category: string
  // auto-calculated: avg of the 4 numeric scores + (wouldWorkAgain ? 5 : 1)
  rating: number
  title: string
  content: string
  pros: string
  cons: string
  relationshipType: RelationshipType
  jobRole?: JobRole
  categoryRatings: CategoryRatings
  timestamp: string
  reviewerHash: string
  hcsTopicId: string
  hcsTxId: string
  hcsSequenceNumber?: number
  nftSerial?: number
  nftTokenId?: string
  upvotes: number
  isVerified: boolean
}

export interface CompanyStats {
  name: string
  totalReviews: number
  averageRating: number
  categoryAverages: {
    paymentContracts: number
    communication: number
    deliveryQuality: number
    reliability: number
    wouldWorkAgainPct: number
  }
  ratingBreakdown: Record<number, number>
  sentiment: 'positive' | 'neutral' | 'negative'
  lastReviewTimestamp: string
  trend: 'improving' | 'stable' | 'declining'
}

export interface RedFlag {
  theme: string
  icon: string
  count: number
  severity: 'high' | 'medium'
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface SubmitReviewPayload {
  company: string
  category: string
  title: string
  content: string
  pros: string
  cons: string
  relationshipType: RelationshipType
  jobRole?: JobRole
  categoryRatings: CategoryRatings
  reviewerAccountId?: string
}

export interface ACPCompanyData {
  schema: 'acp/reputation/v1'
  company: string
  averageRating: number
  totalReviews: number
  sentiment: string
  ratingBreakdown: Record<number, number>
  recentReviews: Review[]
  hcsTopicId: string
  network: string
  lastUpdated: string
}

export interface HederaSetupResult {
  topicId: string
  nftTokenId: string
  message: string
}
