import { ponder } from "@/generated";
import { payment, agentVolume, payeeLookup } from "../ponder.schema";

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
  // Using the payeeLookup table which is keyed by payee address
  const lookup = await context.db.find(payeeLookup, {
    payee: to.toLowerCase(),
  });

  // If no matching agent, this is not an x402 payment we care about
  if (!lookup) {
    return;
  }

  const paymentId = `${event.transaction.hash}:${event.log.logIndex}`;

  console.log(
    `[Base] x402 Payment: ${value} USDC from ${from} to ${to} (Agent: ${lookup.agentName || lookup.agentId})`
  );

  // Record the payment
  await context.db.insert(payment).values({
    id: paymentId,
    agentId: lookup.agentId,
    payee: to.toLowerCase(),
    payer: from.toLowerCase(),
    amount: value,
    chainId,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });

  // Update agent volume stats
  const existingVolume = await context.db.find(agentVolume, {
    agentId: lookup.agentId,
  });

  if (existingVolume) {
    await context.db.update(agentVolume, { agentId: lookup.agentId }).set({
      totalVolume: existingVolume.totalVolume + value,
      txCount: existingVolume.txCount + 1,
      // Note: We can't count unique payers here without SQL, so we'll update it separately in a cron or API
      lastPayment: event.block.timestamp,
    });
  } else {
    // Create new volume record if it doesn't exist (shouldn't happen if agent was indexed)
    await context.db.insert(agentVolume).values({
      agentId: lookup.agentId,
      totalVolume: value,
      txCount: 1,
      uniquePayers: 1,
      lastPayment: event.block.timestamp,
    });
  }
});
