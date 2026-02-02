import { ponder } from "@/generated";
import { payment, agentVolume, agent } from "../ponder.schema";
import { eq, sql } from "@ponder/core";

// Handle USDC Transfer events on Base
// We track payments TO agent payee addresses
ponder.on("BaseUSDC:Transfer", async ({ event, context }) => {
  const { from, to, value } = event.args;
  const chainId = context.network.chainId; // 8453 for Base

  // Skip zero value transfers
  if (value === 0n) {
    return;
  }

  // Look up if the recipient is an agent's x402 payee
  // We need to find agents where x402Payee matches the 'to' address
  const matchingAgents = await context.db
    .select()
    .from(agent)
    .where(eq(agent.x402Payee, to.toLowerCase()));

  // If no matching agent, this is not an x402 payment we care about
  if (matchingAgents.length === 0) {
    return;
  }

  // Get the first matching agent (payee addresses should be unique per agent)
  const targetAgent = matchingAgents[0];
  const paymentId = `${event.transaction.hash}:${event.log.logIndex}`;

  console.log(
    `[Base] x402 Payment: ${value} USDC from ${from} to ${to} (Agent: ${targetAgent.name || targetAgent.id})`
  );

  // Record the payment
  await context.db.insert(payment).values({
    id: paymentId,
    payee: to,
    payer: from,
    amount: value,
    chainId,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });

  // Update agent volume stats
  const existingVolume = await context.db.find(agentVolume, {
    agentId: targetAgent.id,
  });

  if (existingVolume) {
    // Get count of unique payers for this agent
    const uniquePayersResult = await context.db
      .select({ count: sql<number>`count(distinct ${payment.payer})` })
      .from(payment)
      .where(eq(payment.payee, to.toLowerCase()));

    const uniquePayers = uniquePayersResult[0]?.count ?? 0;

    await context.db.update(agentVolume, { agentId: targetAgent.id }).set({
      totalVolume: existingVolume.totalVolume + value,
      txCount: existingVolume.txCount + 1,
      uniquePayers,
      lastPayment: event.block.timestamp,
    });
  } else {
    // Create new volume record if it doesn't exist
    await context.db.insert(agentVolume).values({
      agentId: targetAgent.id,
      totalVolume: value,
      txCount: 1,
      uniquePayers: 1,
      lastPayment: event.block.timestamp,
    });
  }
});
