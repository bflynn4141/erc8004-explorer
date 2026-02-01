import { createConfig } from "@ponder/core";
import { http } from "viem";

import IdentityRegistryAbi from "./abis/IdentityRegistry.json";
import ReputationRegistryAbi from "./abis/ReputationRegistry.json";

// Contract addresses (same across all EVM testnets)
const IDENTITY_REGISTRY = "0x7177a6867296406881E20d6647232314736Dd09A" as const;
const REPUTATION_REGISTRY = "0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322" as const;

export default createConfig({
  networks: {
    sepolia: {
      chainId: 11155111,
      transport: http(process.env.PONDER_RPC_URL_11155111),
    },
    baseSepolia: {
      chainId: 84532,
      transport: http(process.env.PONDER_RPC_URL_84532),
    },
  },
  contracts: {
    IdentityRegistry: {
      abi: IdentityRegistryAbi,
      address: IDENTITY_REGISTRY,
      network: {
        sepolia: {
          startBlock: 9376993, // Deployment block on Sepolia
        },
        // baseSepolia disabled until we verify deployment
      },
    },
    ReputationRegistry: {
      abi: ReputationRegistryAbi,
      address: REPUTATION_REGISTRY,
      network: {
        sepolia: {
          startBlock: 9376993, // Same deployment block
        },
        // baseSepolia disabled until we verify deployment
      },
    },
  },
});
