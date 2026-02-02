import { createConfig } from "@ponder/core";
import { http } from "viem";

import IdentityRegistryAbi from "./abis/IdentityRegistry.json";
import ReputationRegistryAbi from "./abis/ReputationRegistry.json";
import ERC20Abi from "./abis/ERC20.json";
import { ALL_BASE_FACILITATORS } from "./src/facilitators";

// Mainnet contract addresses (0x8004 vanity addresses)
const MAINNET_IDENTITY_REGISTRY = "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432" as const;
const MAINNET_REPUTATION_REGISTRY = "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63" as const;

// Testnet contract addresses (legacy addresses)
const TESTNET_IDENTITY_REGISTRY = "0x7177a6867296406881E20d6647232314736Dd09A" as const;
const TESTNET_REPUTATION_REGISTRY = "0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322" as const;

// USDC contract address on Base
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

export default createConfig({
  networks: {
    mainnet: {
      chainId: 1,
      transport: http(process.env.PONDER_RPC_URL_1),
    },
    sepolia: {
      chainId: 11155111,
      transport: http(process.env.PONDER_RPC_URL_11155111),
    },
    // Base network for x402 payment tracking
    base: {
      chainId: 8453,
      transport: http(process.env.PONDER_RPC_URL_8453),
    },
  },
  contracts: {
    IdentityRegistry: {
      abi: IdentityRegistryAbi,
      network: {
        mainnet: {
          address: MAINNET_IDENTITY_REGISTRY,
          startBlock: 24339871, // Deployed Jan 29, 2026
        },
        sepolia: {
          address: TESTNET_IDENTITY_REGISTRY,
          startBlock: 9376993,
        },
      },
    },
    ReputationRegistry: {
      abi: ReputationRegistryAbi,
      network: {
        mainnet: {
          address: MAINNET_REPUTATION_REGISTRY,
          startBlock: 24339871, // Deployed Jan 29, 2026
        },
        sepolia: {
          address: TESTNET_REPUTATION_REGISTRY,
          startBlock: 9376993,
        },
      },
    },
    // USDC on Base - filtered to only x402 facilitator transfers
    // This dramatically reduces data volume by only tracking payments settled
    // by known x402 facilitators (Coinbase, Daydreams, Thirdweb, OpenX402)
    BaseUSDC: {
      abi: ERC20Abi,
      address: BASE_USDC,
      network: "base",
      // Start from when x402 launched (May 2025)
      startBlock: 30000000,
      // Filter to only Transfer events FROM facilitator addresses
      // This reduces billions of USDC transfers to just x402 payments
      filter: {
        event: "Transfer",
        args: {
          from: ALL_BASE_FACILITATORS as unknown as readonly `0x${string}`[],
        },
      },
    },
  },
});
