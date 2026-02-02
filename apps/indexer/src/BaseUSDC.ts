import { ponder } from "@/generated";
import { payment, agentVolume, payeeLookup } from "../ponder.schema";
import { getFacilitatorInfo } from "./facilitators";

/**
 * Handle USDC Transfer events on Base from x402 facilitators
 *
 * Because we filter at the Ponder config level, we only receive events
 * where `from` is a known x402 facilitator address. This means every
 * transfer here is an x402 payment settlement.
 */
ponder.on("BaseUSDC:Transfer", async ({ event, context }) => {
  const { from, to, value } = event.args;
  const chainId = context.network.chainId; // 8453 for Base

  // Skip zero value transfers
  if (value === 0n) {
    return;
  }

  // Get facilitator info for logging
  const facilitator = getFacilitatorInfo(from);
  const facilitatorName = facilitator?.name || "Unknown";

  // Look up if the recipient is an agent's x402 payee
  const lookup = await context.db.find(payeeLookup, {
    payee: to.toLowerCase(),
  });

  // Create a unique payment ID
  const paymentId = `${event.transaction.hash}:${event.log.logIndex}`;

  // Log all x402 payments (even if not to a known agent)
  const amountUSDC = Number(value) / 1e6;
  console.log(
    `[x402] Payment via ${facilitatorName}: $${amountUSDC.toFixed(2)} USDC to ${to.slice(0, 10)}... ${
      lookup ? `(Agent: ${lookup.agentName || lookup.agentId})` : "(Unknown recipient)"
    }`
  );

  // If the recipient is not a known agent payee, we still record the payment
  // but without agent attribution (useful for ecosystem-wide stats)
  const agentId = lookup?.agentId || `unknown:${to.toLowerCase()}`;

  // Record the payment
  await context.db.insert(payment).values({
    id: paymentId,
    agentId,
    payee: to.toLowerCase(),
    facilitator: from.toLowerCase(), // This is the facilitator address
    facilitatorId: facilitator?.id || null,
    amount: value,
    chainId,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });

  // Update agent volume stats (only for known agents)
  if (lookup) {
    const existingVolume = await context.db.find(agentVolume, {
      agentId: lookup.agentId,
    });

    if (existingVolume) {
      await context.db.update(agentVolume, { agentId: lookup.agentId }).set({
        totalVolume: existingVolume.totalVolume + value,
        txCount: existingVolume.txCount + 1,
        lastPayment: event.block.timestamp,
      });
    } else {
      // Create new volume record
      await context.db.insert(agentVolume).values({
        agentId: lookup.agentId,
        totalVolume: value,
        txCount: 1,
        uniquePayers: 1, // Will be updated in API aggregation
        lastPayment: event.block.timestamp,
      });
    }
  }
});
