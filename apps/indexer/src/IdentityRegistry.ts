import { ponder } from "@/generated";
import { agent, activity, agentStats, agentVolume, payeeLookup } from "../ponder.schema";

// Type for x402 payment info extracted from metadata
interface X402Info {
  hasX402: boolean;
  payee?: string;
  network?: string;
}

// Helper to fetch off-chain metadata from IPFS, HTTPS, or data URIs
async function fetchMetadata(uri: string): Promise<{
  name?: string;
  description?: string;
  image?: string;
  services?: unknown;
  x402?: X402Info;
} | null> {
  try {
    let data: Record<string, unknown>;

    // Handle data URIs (base64 encoded JSON)
    if (uri.startsWith("data:application/json;base64,")) {
      const base64Data = uri.replace("data:application/json;base64,", "");
      const jsonString = Buffer.from(base64Data, "base64").toString("utf-8");
      data = JSON.parse(jsonString);
    } else {
      // Handle IPFS and HTTPS URIs
      let fetchUrl = uri;

      // Convert IPFS URI to HTTP gateway
      if (uri.startsWith("ipfs://")) {
        const cid = uri.replace("ipfs://", "");
        fetchUrl = `https://ipfs.io/ipfs/${cid}`;
      }

      // Validate it's a valid URL
      if (!fetchUrl.startsWith("http://") && !fetchUrl.startsWith("https://")) {
        console.warn(`Invalid metadata URI: ${uri}`);
        return null;
      }

      const response = await fetch(fetchUrl, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (!response.ok) {
        console.warn(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
        return null;
      }

      data = await response.json();
    }

    // Extract x402 payment info if present
    let x402Info: X402Info = { hasX402: false };
    if (data.x402Support === true || data.payments) {
      const x402Payment = data.payments?.find((p: { method?: string }) => p.method === "x402");
      if (x402Payment) {
        x402Info = {
          hasX402: true,
          payee: x402Payment.payee,
          network: x402Payment.network,
        };
      } else if (data.x402Support) {
        x402Info = { hasX402: true };
      }
    }

    return {
      name: data.name,
      description: data.description,
      image: data.image,
      services: data.services,
      x402: x402Info,
    };
  } catch (error) {
    console.error(`Error fetching metadata from ${uri}:`, error);
    return null;
  }
}

// Handle agent registration
ponder.on("IdentityRegistry:Registered", async ({ event, context }) => {
  const { agentId, owner, agentURI } = event.args;
  const chainId = context.network.chainId;
  const id = `${chainId}:${agentId.toString()}`;

  console.log(`[${chainId}] Registered agent #${agentId} by ${owner}`);

  // Fetch off-chain metadata
  const metadata = await fetchMetadata(agentURI);

  // Insert agent record
  await context.db.insert(agent).values({
    id,
    agentId,
    chainId,
    owner,
    agentUri: agentURI,
    name: metadata?.name ?? null,
    description: metadata?.description ?? null,
    imageUri: metadata?.image ?? null,
    services: metadata?.services ?? null,
    // x402 payment info
    hasX402: metadata?.x402?.hasX402 ?? false,
    x402Payee: metadata?.x402?.payee ?? null,
    x402Network: metadata?.x402?.network ?? null,
    isActive: true,
    createdAt: event.block.timestamp,
    txHash: event.transaction.hash,
  });

  // Initialize agent stats
  await context.db.insert(agentStats).values({
    agentId: id,
    feedbackCount: 0,
    totalScore: 0n,
    averageScore: 0,
    uniqueGivers: 0,
    lastUpdated: event.block.timestamp,
  }).onConflictDoNothing();

  // Initialize agent volume stats
  await context.db.insert(agentVolume).values({
    agentId: id,
    totalVolume: 0n,
    txCount: 0,
    uniquePayers: 0,
    lastPayment: null,
  }).onConflictDoNothing();

  // If agent has x402 payment info, add to payee lookup table
  if (metadata?.x402?.hasX402 && metadata.x402.payee) {
    await context.db.insert(payeeLookup).values({
      payee: metadata.x402.payee.toLowerCase(),
      agentId: id,
      agentName: metadata.name ?? null,
    }).onConflictDoNothing();
  }

  // Record activity
  await context.db.insert(activity).values({
    id: `${event.transaction.hash}:${event.log.logIndex}`,
    type: "registered",
    agentId: id,
    agentName: metadata?.name ?? null,
    actor: owner,
    details: {
      agentUri: agentURI,
      hasMetadata: metadata !== null,
    },
    chainId,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });
});

// Handle agent transfer (ownership change)
ponder.on("IdentityRegistry:Transfer", async ({ event, context }) => {
  const { from, to, tokenId } = event.args;
  const chainId = context.network.chainId;
  const id = `${chainId}:${tokenId.toString()}`;

  // Skip mint events (from = 0x0) - handled by Registered event
  if (from === "0x0000000000000000000000000000000000000000") {
    return;
  }

  console.log(`[${chainId}] Transfer agent #${tokenId} from ${from} to ${to}`);

  // Check if agent exists (might not if Registered event hasn't been processed yet)
  const agentRecord = await context.db.find(agent, { id });
  if (!agentRecord) {
    console.warn(`[${chainId}] Transfer for unknown agent #${tokenId}, skipping`);
    return;
  }

  // Update agent owner
  await context.db.update(agent, { id }).set({
    owner: to,
    updatedAt: event.block.timestamp,
  });

  // Record activity
  await context.db.insert(activity).values({
    id: `${event.transaction.hash}:${event.log.logIndex}`,
    type: "transfer",
    agentId: id,
    agentName: agentRecord?.name ?? null,
    actor: from,
    details: {
      from,
      to,
    },
    chainId,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  });
});
