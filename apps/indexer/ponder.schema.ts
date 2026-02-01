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

// Define relations
export const agentRelations = relations(agent, ({ many, one }) => ({
  feedback: many(feedback),
  stats: one(agentStats, {
    fields: [agent.id],
    references: [agentStats.agentId],
  }),
  activities: many(activity),
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
