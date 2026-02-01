// Chain ID to name mapping
const CHAIN_NAMES: Record<number, string> = {
  11155111: 'Sepolia',
  84532: 'Base Sepolia',
}

// Chain ID to Etherscan base URL
const ETHERSCAN_URLS: Record<number, string> = {
  11155111: 'https://sepolia.etherscan.io',
  84532: 'https://sepolia.basescan.org',
}

export function getChainName(chainId: number): string {
  return CHAIN_NAMES[chainId] || `Chain ${chainId}`
}

export function getEtherscanUrl(
  chainId: number,
  hash: string,
  type: 'tx' | 'address' | 'token' = 'tx'
): string {
  const base = ETHERSCAN_URLS[chainId] || 'https://etherscan.io'
  return `${base}/${type}/${hash}`
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return ''
  if (address.length <= chars * 2 + 2) return address
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}
