/**
 * x402 Facilitator Addresses
 *
 * These are the known x402 facilitator addresses that settle payments on-chain.
 * By filtering USDC transfers to only those FROM these addresses, we dramatically
 * reduce the data volume from billions of transfers to just x402 payments.
 *
 * Source: https://github.com/Merit-Systems/x402scan/tree/main/packages/external/facilitators
 */

// Coinbase CDP Facilitator addresses on Base
// https://docs.cdp.coinbase.com/x402/welcome
export const COINBASE_FACILITATORS = [
  "0xdbdf3d8ed80f84c35d01c6c9f9271761bad90ba6",
  "0x9aae2b0d1b9dc55ac9bab9556f9a26cb64995fb9",
  "0x3a70788150c7645a21b95b7062ab1784d3cc2104",
  "0x708e57b6650a9a741ab39cae1969ea1d2d10eca1",
  "0xce82eeec8e98e443ec34fda3c3e999cbe4cb6ac2",
  "0x7f6d822467df2a85f792d4508c5722ade96be056",
  "0x001ddabba5782ee48842318bd9ff4008647c8d9c",
  "0x9c09faa49c4235a09677159ff14f17498ac48738",
  "0xcbb10c30a9a72fae9232f41cbbd566a097b4e03a",
  "0x9fb2714af0a84816f5c6322884f2907e33946b88",
  "0x47d8b3c9717e976f31025089384f23900750a5f4",
  "0x94701e1df9ae06642bf6027589b8e05dc7004813",
  "0x552300992857834c0ad41c8e1a6934a5e4a2e4ca",
  "0xd7469bf02d221968ab9f0c8b9351f55f8668ac4f",
  "0x88800e08e20b45c9b1f0480cf759b5bf2f05180c",
  "0x6831508455a716f987782a1ab41e204856055cc2",
  "0xdc8fbad54bf5151405de488f45acd555517e0958",
  "0x91d313853ad458addda56b35a7686e2f38ff3952",
  "0xadd5585c776b9b0ea77e9309c1299a40442d820f",
  "0x4ffeffa616a1460570d1eb0390e264d45a199e91",
  "0x8f5cb67b49555e614892b7233cfddebfb746e531",
  "0x67b9ce703d9ce658d7c4ac3c289cea112fe662af",
  "0x68a96f41ff1e9f2e7b591a931a4ad224e7c07863",
  "0x97acce27d5069544480bde0f04d9f47d7422a016",
  "0xa32ccda98ba7529705a059bd2d213da8de10d101",
] as const;

// Daydreams Facilitator
// https://facilitator.daydreams.systems
export const DAYDREAMS_FACILITATORS = [
  "0x279e08f711182c79ba6d09669127a426228a4653",
] as const;

// Thirdweb Facilitator
// https://portal.thirdweb.com/payments/x402/facilitator
export const THIRDWEB_FACILITATORS = [
  "0x80c08de1a05df2bd633cf520754e40fde3c794d3",
  "0xaaca1ba9d2627cbc0739ba69890c30f95de046e4",
  "0xa1822b21202a24669eaf9277723d180cd6dae874",
  "0xec10243b54df1a71254f58873b389b7ecece89c2",
  "0x052aaae3cad5c095850246f8ffb228354c56752a",
  "0x91ddea05f741b34b63a7548338c90fc152c8631f",
  "0xea52f2c6f6287f554f9b54c5417e1e431fe5710e",
  "0x3a5ca1c6aa6576ae9c1c0e7fa2b4883346bc5aa0",
  "0x7e20b62bf36554b704774afb0fcc0ae8f899213b",
  "0xd88a9a58806b895ff06744082c6a20b9d7184b0f",
] as const;

// OpenX402 Facilitator
// https://open.x402.host
export const OPENX402_FACILITATORS = [
  "0x97316fa4730bc7d3b295234f8e4d04a0a4c093e8",
  "0x97db9b5291a218fc77198c285cefdc943ef74917",
] as const;

// All Base facilitator addresses combined
// Used for filtering USDC Transfer events in Ponder config
export const ALL_BASE_FACILITATORS = [
  ...COINBASE_FACILITATORS,
  ...DAYDREAMS_FACILITATORS,
  ...THIRDWEB_FACILITATORS,
  ...OPENX402_FACILITATORS,
] as const;

// Facilitator metadata for attribution
export const FACILITATOR_METADATA: Record<string, { name: string; id: string }> = {
  // Coinbase
  ...Object.fromEntries(
    COINBASE_FACILITATORS.map((addr) => [addr.toLowerCase(), { name: "Coinbase", id: "coinbase" }])
  ),
  // Daydreams
  ...Object.fromEntries(
    DAYDREAMS_FACILITATORS.map((addr) => [addr.toLowerCase(), { name: "Daydreams", id: "daydreams" }])
  ),
  // Thirdweb
  ...Object.fromEntries(
    THIRDWEB_FACILITATORS.map((addr) => [addr.toLowerCase(), { name: "Thirdweb", id: "thirdweb" }])
  ),
  // OpenX402
  ...Object.fromEntries(
    OPENX402_FACILITATORS.map((addr) => [addr.toLowerCase(), { name: "OpenX402", id: "openx402" }])
  ),
};

// Helper to get facilitator info from address
export function getFacilitatorInfo(address: string): { name: string; id: string } | null {
  return FACILITATOR_METADATA[address.toLowerCase()] || null;
}
