import { onchainTable, relations } from "@ponder/core";

// Agent table - registered agents
export const agent = onchainTable("agent", (t) => ({
  // Primary key: chainId:agentId
  id: t.text().primaryKey(),
  agentId: t.bigint().notNull(),
  chainId: t.integer().notNull(),
  owner: t.text().notNull(),
  agentUri: t.text().notNull(),
  // Off-chain metadata
  name: t.text(),
  description: t.text(),
  imageUri: t.text(),
  services: t.json(),
  // x402 payment info (extracted from metadata)
  hasX402: t.boolean().default(false),
  x402Payee: t.text(), // Address that receives x402 payments
  x402Network: t.text(), // Network for payments (e.g., "base", "ethereum")
  // Status
  isActive: t.boolean().default(true),
  // Timestamps
  createdAt: t.bigint().notNull(),
  updatedAt: t.bigint(),
  // Transaction info
  txHash: t.text().notNull(),
}));

// Feedback table - reputation feedback
export const feedback = onchainTable("feedback", (t) => ({
  id: t.text().primaryKey(),
  agentId: t.text().notNull(), // FK to agent
  giver: t.text().notNull(),
  value: t.bigint().notNull(),
  tag1: t.text(),
  createdAt: t.bigint().notNull(),
  txHash: t.text().notNull(),
  chainId: t.integer().notNull(),
}));

// AgentStats table - aggregated reputation stats
export const agentStats = onchainTable("agent_stats", (t) => ({
  agentId: t.text().primaryKey(), // FK to agent
  feedbackCount: t.integer().default(0),
  totalScore: t.bigint().default(0n),
  averageScore: t.real().default(0),
  uniqueGivers: t.integer().default(0),
  lastUpdated: t.bigint(),
}));

// Activity table - activity feed
export const activity = onchainTable("activity", (t) => ({
  id: t.text().primaryKey(), // txHash:logIndex
  type: t.text().notNull(), // 'registered', 'feedback', 'transfer'
  agentId: t.text().notNull(), // FK to agent
  agentName: t.text(), // Denormalized for fast display
  actor: t.text().notNull(), // Address that triggered
  details: t.json(), // Type-specific data
  chainId: t.integer().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.text().notNull(),
}));

// Payment table - x402 USDC payments (on Base)
export const payment = onchainTable("payment", (t) => ({
  id: t.text().primaryKey(), // txHash:logIndex
  agentId: t.text().notNull(), // FK to agent or "unknown:{payee}" for unattributed
  payee: t.text().notNull(), // Recipient address (agent's x402Payee)
  facilitator: t.text().notNull(), // Facilitator address that settled the payment
  facilitatorId: t.text(), // Facilitator ID (coinbase, daydreams, thirdweb, etc.)
  amount: t.bigint().notNull(), // USDC amount (6 decimals)
  chainId: t.integer().notNull(), // 8453 for Base
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.text().notNull(),
}));

// PayeeLookup table - maps x402 payee addresses to agent IDs
// This enables O(1) lookup in event handlers (which can't use SQL WHERE)
export const payeeLookup = onchainTable("payee_lookup", (t) => ({
  payee: t.text().primaryKey(), // Lowercased payee address
  agentId: t.text().notNull(), // FK to agent
  agentName: t.text(), // Denormalized for logging
}));

// AgentVolume table - aggregated payment stats per agent
export const agentVolume = onchainTable("agent_volume", (t) => ({
  agentId: t.text().primaryKey(), // FK to agent
  totalVolume: t.bigint().default(0n), // Lifetime USDC volume (6 decimals)
  txCount: t.integer().default(0), // Total payment transactions
  uniquePayers: t.integer().default(0), // Unique payer addresses
  lastPayment: t.bigint(), // Timestamp of last payment
}));

// Define relations
export const agentRelations = relations(agent, ({ many, one }) => ({
  feedback: many(feedback),
  stats: one(agentStats, {
    fields: [agent.id],
    references: [agentStats.agentId],
  }),
  volume: one(agentVolume, {
    fields: [agent.id],
    references: [agentVolume.agentId],
  }),
  activities: many(activity),
}));

export const agentVolumeRelations = relations(agentVolume, ({ one }) => ({
  agent: one(agent, {
    fields: [agentVolume.agentId],
    references: [agent.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  agent: one(agent, {
    fields: [feedback.agentId],
    references: [agent.id],
  }),
}));

export const activityRelations = relations(activity, ({ one }) => ({
  agent: one(agent, {
    fields: [activity.agentId],
    references: [agent.id],
  }),
}));
