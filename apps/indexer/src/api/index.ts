import { ponder } from "@/generated";
import { agent, agentStats, agentVolume, feedback, activity, payment } from "../../ponder.schema";
import { desc, eq, and, sql } from "@ponder/core";

// Base USDC contract address
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

// Fetch x402 payment data from Alchemy API on-demand
async function fetchPaymentData(payeeAddress: string): Promise<{
  totalVolume: string;
  txCount: number;
  uniquePayers: number;
  recentPayments: Array<{ from: string; amount: string; hash: string; timestamp: number }>;
} | null> {
  const alchemyUrl = process.env.PONDER_RPC_URL_8453;
  if (!alchemyUrl) return null;

  try {
    const response = await fetch(alchemyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "alchemy_getAssetTransfers",
        params: [{
          fromBlock: "0x0",
          toBlock: "latest",
          toAddress: payeeAddress,
          contractAddresses: [BASE_USDC],
          category: ["erc20"],
          maxCount: "0x64", // 100 max
        }],
        id: 1,
      }),
    });

    const data = await response.json();
    const transfers = data.result?.transfers || [];

    if (transfers.length === 0) {
      return { totalVolume: "0", txCount: 0, uniquePayers: 0, recentPayments: [] };
    }

    // Calculate stats
    const totalVolume = transfers.reduce((sum: number, t: { value: number }) => sum + (t.value || 0), 0);
    const uniquePayers = new Set(transfers.map((t: { from: string }) => t.from.toLowerCase())).size;

    // Format recent payments (USDC has 6 decimals, but Alchemy returns human-readable value)
    const recentPayments = transfers.slice(0, 10).map((t: { from: string; value: number; hash: string; blockNum: string }) => ({
      from: t.from,
      amount: (t.value * 1e6).toString(), // Convert to 6 decimal format
      hash: t.hash,
      timestamp: parseInt(t.blockNum, 16), // Block number as proxy for timestamp
    }));

    return {
      totalVolume: (totalVolume * 1e6).toString(), // Convert to 6 decimal format
      txCount: transfers.length,
      uniquePayers,
      recentPayments,
    };
  } catch (error) {
    console.error("Error fetching payment data from Alchemy:", error);
    return null;
  }
}

// GET /agents - List all agents with pagination
ponder.get("/agents", async (c) => {
  const { limit = "50", offset = "0", chainId, sort = "newest" } = c.req.query();

  const limitNum = Math.min(parseInt(limit), 100);
  const offsetNum = parseInt(offset);

  // Get agents with their stats using query builder
  let agentResults = await c.db.query.agent.findMany({
    limit: limitNum,
    offset: offsetNum,
    orderBy: (agent, { desc }) => [desc(agent.createdAt)],
    where: chainId ? (agent, { eq }) => eq(agent.chainId, parseInt(chainId)) : undefined,
  });

  // Get stats for all agents
  const agentIds = agentResults.map((a) => a.id);
  const statsResults = agentIds.length > 0
    ? await c.db.query.agentStats.findMany({
        where: (stats, { inArray }) => inArray(stats.agentId, agentIds),
      })
    : [];

  // Get volume for all agents
  const volumeResults = agentIds.length > 0
    ? await c.db.query.agentVolume.findMany({
        where: (vol, { inArray }) => inArray(vol.agentId, agentIds),
      })
    : [];

  // Create maps for quick lookup
  const statsMap = new Map(statsResults.map((s) => [s.agentId, s]));
  const volumeMap = new Map(volumeResults.map((v) => [v.agentId, v]));

  // Get total count
  const countResult = await c.db
    .select({ count: sql<number>`count(*)` })
    .from(agent);
  const total = countResult[0]?.count ?? 0;

  // Format response
  const agents = agentResults.map((a) => {
    const stats = statsMap.get(a.id);
    const volume = volumeMap.get(a.id);
    return {
      id: a.id,
      agentId: a.agentId.toString(),
      chainId: a.chainId,
      owner: a.owner,
      name: a.name,
      description: a.description,
      imageUri: a.imageUri,
      agentUri: a.agentUri,
      isActive: a.isActive,
      hasX402: a.hasX402,
      x402Payee: a.x402Payee,
      x402Network: a.x402Network,
      createdAt: a.createdAt.toString(),
      txHash: a.txHash,
      stats: stats
        ? {
            feedbackCount: stats.feedbackCount,
            averageScore: stats.averageScore,
            uniqueGivers: stats.uniqueGivers,
          }
        : null,
      volume: volume
        ? {
            totalVolume: volume.totalVolume?.toString() ?? "0",
            txCount: volume.txCount ?? 0,
            uniquePayers: volume.uniquePayers ?? 0,
            lastPayment: volume.lastPayment?.toString() ?? null,
          }
        : null,
    };
  });

  return c.json({
    agents,
    total,
    limit: limitNum,
    offset: offsetNum,
  });
});

// GET /agents/:chainId/:agentId - Get agent details
ponder.get("/agents/:chainId/:agentId", async (c) => {
  const { chainId, agentId } = c.req.param();
  const id = `${chainId}:${agentId}`;

  // Get agent
  const agentRecord = await c.db.query.agent.findFirst({
    where: eq(agent.id, id),
  });

  if (!agentRecord) {
    return c.json({ error: "Agent not found" }, 404);
  }

  // Get stats
  const stats = await c.db.query.agentStats.findFirst({
    where: eq(agentStats.agentId, id),
  });

  // Get volume from database (legacy)
  const dbVolume = await c.db.query.agentVolume.findFirst({
    where: eq(agentVolume.agentId, id),
  });

  // Fetch live payment data from Alchemy if agent has x402Payee
  let livePaymentData = null;
  if (agentRecord.x402Payee) {
    livePaymentData = await fetchPaymentData(agentRecord.x402Payee);
  }

  // Use live data if available, otherwise fall back to database
  const volume = livePaymentData || dbVolume;

  // Get recent feedback
  const recentFeedback = await c.db
    .select()
    .from(feedback)
    .where(eq(feedback.agentId, id))
    .orderBy(desc(feedback.createdAt))
    .limit(20);

  // Get feedback by tag
  const feedbackByTag = await c.db
    .select({
      tag: feedback.tag1,
      count: sql<number>`count(*)`,
      avgScore: sql<number>`avg(${feedback.value})`,
    })
    .from(feedback)
    .where(eq(feedback.agentId, id))
    .groupBy(feedback.tag1);

  return c.json({
    id: agentRecord.id,
    agentId: agentRecord.agentId.toString(),
    chainId: agentRecord.chainId,
    owner: agentRecord.owner,
    name: agentRecord.name,
    description: agentRecord.description,
    imageUri: agentRecord.imageUri,
    agentUri: agentRecord.agentUri,
    services: agentRecord.services,
    isActive: agentRecord.isActive,
    hasX402: agentRecord.hasX402,
    x402Payee: agentRecord.x402Payee,
    x402Network: agentRecord.x402Network,
    createdAt: agentRecord.createdAt.toString(),
    updatedAt: agentRecord.updatedAt?.toString(),
    txHash: agentRecord.txHash,
    stats: stats
      ? {
          feedbackCount: stats.feedbackCount,
          totalScore: stats.totalScore?.toString(),
          averageScore: stats.averageScore,
          uniqueGivers: stats.uniqueGivers,
          lastUpdated: stats.lastUpdated?.toString(),
        }
      : null,
    volume: volume
      ? {
          totalVolume: volume.totalVolume?.toString() ?? "0",
          txCount: volume.txCount ?? 0,
          uniquePayers: volume.uniquePayers ?? 0,
          lastPayment: volume.lastPayment?.toString() ?? null,
          recentPayments: livePaymentData?.recentPayments ?? [],
          isLive: !!livePaymentData, // Indicates data is from Alchemy API
        }
      : null,
    recentFeedback: recentFeedback.map((f) => ({
      id: f.id,
      giver: f.giver,
      value: f.value.toString(),
      tag: f.tag1,
      createdAt: f.createdAt.toString(),
      txHash: f.txHash,
    })),
    feedbackByTag: feedbackByTag.map((t) => ({
      tag: t.tag || "general",
      count: t.count,
      averageScore: t.avgScore,
    })),
  });
});

// GET /activity - Get recent activity
ponder.get("/activity", async (c) => {
  const { limit = "50", offset = "0", type, chainId } = c.req.query();

  const limitNum = Math.min(parseInt(limit), 100);
  const offsetNum = parseInt(offset);

  let query = c.db
    .select()
    .from(activity)
    .orderBy(desc(activity.timestamp))
    .limit(limitNum)
    .offset(offsetNum);

  // Filter by type
  if (type) {
    query = query.where(eq(activity.type, type));
  }

  // Filter by chain
  if (chainId) {
    query = query.where(eq(activity.chainId, parseInt(chainId)));
  }

  const results = await query;

  return c.json({
    events: results.map((e) => ({
      id: e.id,
      type: e.type,
      agentId: e.agentId,
      agentName: e.agentName,
      actor: e.actor,
      details: e.details,
      chainId: e.chainId,
      blockNumber: e.blockNumber.toString(),
      timestamp: e.timestamp.toString(),
      txHash: e.txHash,
    })),
    limit: limitNum,
    offset: offsetNum,
  });
});

// GET /stats - Get global statistics
ponder.get("/stats", async (c) => {
  // Total agents
  const totalAgentsResult = await c.db
    .select({ count: sql<number>`count(*)` })
    .from(agent);
  const totalAgents = totalAgentsResult[0]?.count ?? 0;

  // Total feedback
  const totalFeedbackResult = await c.db
    .select({ count: sql<number>`count(*)` })
    .from(feedback);
  const totalFeedback = totalFeedbackResult[0]?.count ?? 0;

  // Total x402 volume (USDC with 6 decimals)
  const totalVolumeResult = await c.db
    .select({ total: sql<string>`coalesce(sum(${agentVolume.totalVolume}), 0)` })
    .from(agentVolume);
  const totalVolume = totalVolumeResult[0]?.total ?? "0";

  // Total payment transactions
  const totalPaymentsResult = await c.db
    .select({ count: sql<number>`count(*)` })
    .from(payment);
  const totalPayments = totalPaymentsResult[0]?.count ?? 0;

  // Agents with x402 support
  const x402AgentsResult = await c.db
    .select({ count: sql<number>`count(*)` })
    .from(agent)
    .where(eq(agent.hasX402, true));
  const x402Agents = x402AgentsResult[0]?.count ?? 0;

  // Agents registered in last 24 hours
  const oneDayAgo = BigInt(Math.floor(Date.now() / 1000) - 86400);
  const agentsTodayResult = await c.db
    .select({ count: sql<number>`count(*)` })
    .from(agent)
    .where(sql`${agent.createdAt} > ${oneDayAgo}`);
  const agentsToday = agentsTodayResult[0]?.count ?? 0;

  // Agents by chain
  const agentsByChain = await c.db
    .select({
      chainId: agent.chainId,
      count: sql<number>`count(*)`,
    })
    .from(agent)
    .groupBy(agent.chainId);

  // Chain name mapping
  const chainNames: Record<number, string> = {
    1: "ethereum",
    11155111: "sepolia",
    84532: "base-sepolia",
  };

  return c.json({
    totalAgents,
    totalFeedback,
    totalVolume, // USDC in 6 decimals (divide by 1e6 for USD)
    totalPayments,
    x402Agents,
    agentsToday,
    chains: agentsByChain.map((c) => ({
      chainId: c.chainId,
      name: chainNames[c.chainId] || `chain-${c.chainId}`,
      agentCount: c.count,
    })),
  });
});
