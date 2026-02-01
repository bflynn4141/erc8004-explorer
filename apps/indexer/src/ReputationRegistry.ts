import { ponder } from "@/generated";
import { agent, feedback, agentStats, activity } from "../ponder.schema";

// Helper to decode bytes32 tag to string
function decodeTag(tag: `0x${string}`): string | null {
  if (tag === "0x0000000000000000000000000000000000000000000000000000000000000000") {
    return null;
  }
  try {
    // Remove trailing zeros and decode
    const hex = tag.replace(/0+$/, "");
    if (hex === "0x") return null;

    // Convert hex to string
    let str = "";
    for (let i = 2; i < hex.length; i += 2) {
      const code = parseInt(hex.substr(i, 2), 16);
      if (code === 0) break;
      str += String.fromCharCode(code);
    }
    return str || null;
  } catch {
    return tag; // Return raw hex if decoding fails
  }
}

// Handle new feedback
ponder.on("ReputationRegistry:NewFeedback", async ({ event, context }) => {
  const { agentId: tokenId, giver, value, tag1 } = event.args;
  const chainId = context.network.chainId;
  const agentKey = `${chainId}:${tokenId.toString()}`;
  const feedbackId = `${event.transaction.hash}:${event.log.logIndex}`;

  console.log(`[${chainId}] Feedback for agent #${tokenId}: ${value} from ${giver}`);

  // Get agent record for denormalization
  const agentRecord = await context.db.find(agent, { id: agentKey });

  if (!agentRecord) {
    console.warn(`[${chainId}] Feedback for unknown agent #${tokenId}`);
    // Still record the feedback even if agent not found
  }

  // Decode tag
  const decodedTag = decodeTag(tag1);

  // Insert feedback record
  await context.db.insert(feedback).values({
    id: feedbackId,
    agentId: agentKey,
    giver,
    value,
    tag1: decodedTag,
    createdAt: event.block.timestamp,
    txHash: event.transaction.hash,
    chainId,
  });

  // Update agent stats
  // First, get all feedback for this agent to calculate stats
  const allFeedback = await context.db.sql.query.feedback.findMany({
    where: (f, { eq }) => eq(f.agentId, agentKey),
  });

  const feedbackCount = allFeedback.length;
  const totalScore = allFeedback.reduce((sum, f) => sum + f.value, 0n);
  const averageScore = feedbackCount > 0 ? Number(totalScore) / feedbackCount : 0;
  const uniqueGivers = new Set(allFeedback.map(f => f.giver)).size;

  await context.db
    .insert(agentStats)
    .values({
      agentId: agentKey,
      feedbackCount,
      totalScore,
      averageScore,
      uniqueGivers,
      lastUpdated: event.block.timestamp,
    })
    .onConflictDoUpdate({
      feedbackCount,
      totalScore,
      averageScore,
      uniqueGivers,
      lastUpdated: event.block.timestamp,
    });

  // Record activity
  await context.db.insert(activity).values({
    id: feedbackId,
    type: "feedback",
    agentId: agentKey,
    agentName: agentRecord?.name ?? null,
    actor: giver,
    details: {
      value: value.toString(),
      tag: decodedTag,
    },
    chainId,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });
});
