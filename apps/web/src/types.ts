export interface Agent {
  id: string
  agentId: string
  chainId: number
  owner: string
  name: string | null
  description: string | null
  imageUri: string | null
  agentUri: string
  isActive: boolean
  hasX402: boolean
  createdAt: string
  txHash: string
  stats: AgentStats | null
  volume: AgentVolume | null
}

export interface AgentStats {
  feedbackCount: number
  averageScore: number
  uniqueGivers: number
}

export interface AgentVolume {
  totalVolume: string // USDC in 6 decimals
  txCount: number
  uniquePayers: number
  lastPayment: string | null
}

export interface AgentDetails extends Agent {
  services: unknown
  updatedAt: string | null
  recentFeedback: Feedback[]
  feedbackByTag: FeedbackByTag[]
}

export interface Feedback {
  id: string
  giver: string
  value: string
  tag: string | null
  createdAt: string
  txHash: string
}

export interface FeedbackByTag {
  tag: string
  count: number
  averageScore: number
}

export interface ActivityEvent {
  id: string
  type: 'registered' | 'feedback' | 'transfer'
  agentId: string
  agentName: string | null
  actor: string
  details: {
    agentUri?: string
    hasMetadata?: boolean
    value?: string
    tag?: string
    from?: string
    to?: string
  }
  chainId: number
  blockNumber: string
  timestamp: string
  txHash: string
}

export interface GlobalStats {
  totalAgents: number
  totalFeedback: number
  totalVolume: string // USDC in 6 decimals
  totalPayments: number
  x402Agents: number
  agentsToday: number
  chains: ChainStats[]
}

export interface ChainStats {
  chainId: number
  name: string
  agentCount: number
}
