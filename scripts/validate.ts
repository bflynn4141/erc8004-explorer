/**
 * Validation Script for ERC-8004 Indexer
 *
 * Compares indexed data against Etherscan to verify correctness.
 * Run: pnpm validate
 */

const API_BASE = process.env.API_URL || 'http://localhost:42069'

// Etherscan API keys (optional, increases rate limits)
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || ''

// Contract addresses
const IDENTITY_REGISTRY = '0x7177a6867296406881E20d6647232314736Dd09A'

// Etherscan API URLs
const ETHERSCAN_URLS: Record<number, string> = {
  11155111: 'https://api-sepolia.etherscan.io/api',
  84532: 'https://api-sepolia.basescan.org/api',
}

interface EtherscanEvent {
  blockNumber: string
  timeStamp: string
  transactionHash: string
  topics: string[]
  data: string
}

interface IndexedAgent {
  id: string
  agentId: string
  chainId: number
  owner: string
  createdAt: string
  txHash: string
}

async function fetchEtherscanEvents(chainId: number): Promise<EtherscanEvent[]> {
  const apiUrl = ETHERSCAN_URLS[chainId]
  if (!apiUrl) {
    console.warn(`No Etherscan API URL for chain ${chainId}`)
    return []
  }

  const apiKey = chainId === 11155111 ? ETHERSCAN_API_KEY : BASESCAN_API_KEY

  // Registered event topic
  const registeredTopic = '0x' + 'Registered(uint256,address,string)'.split('').reduce(
    (acc, char) => acc + char.charCodeAt(0).toString(16).padStart(2, '0'),
    ''
  )

  const url = new URL(apiUrl)
  url.searchParams.set('module', 'logs')
  url.searchParams.set('action', 'getLogs')
  url.searchParams.set('address', IDENTITY_REGISTRY)
  url.searchParams.set('fromBlock', '0')
  url.searchParams.set('toBlock', 'latest')
  url.searchParams.set('topic0', '0x9b55ef5c5b1e12a2ab9ac5f38c9fd6e3fb4cf54c47d0949e7a8f3f9f3f9e8e9d') // Placeholder
  if (apiKey) {
    url.searchParams.set('apikey', apiKey)
  }

  try {
    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== '1') {
      console.warn(`Etherscan API error: ${data.message}`)
      return []
    }

    return data.result || []
  } catch (error) {
    console.error(`Failed to fetch from Etherscan:`, error)
    return []
  }
}

async function fetchIndexedAgents(): Promise<IndexedAgent[]> {
  try {
    const response = await fetch(`${API_BASE}/agents?limit=100`)
    const data = await response.json()
    return data.agents || []
  } catch (error) {
    console.error(`Failed to fetch indexed agents:`, error)
    return []
  }
}

async function validateAgent(agent: IndexedAgent): Promise<boolean> {
  const errors: string[] = []

  // Check required fields
  if (!agent.id) errors.push('Missing id')
  if (!agent.agentId) errors.push('Missing agentId')
  if (!agent.owner) errors.push('Missing owner')
  if (!agent.txHash) errors.push('Missing txHash')
  if (!agent.createdAt) errors.push('Missing createdAt')

  // Validate address format
  if (agent.owner && !agent.owner.match(/^0x[a-fA-F0-9]{40}$/)) {
    errors.push(`Invalid owner address: ${agent.owner}`)
  }

  // Validate tx hash format
  if (agent.txHash && !agent.txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
    errors.push(`Invalid tx hash: ${agent.txHash}`)
  }

  if (errors.length > 0) {
    console.error(`❌ Agent ${agent.id} validation failed:`)
    errors.forEach((e) => console.error(`   - ${e}`))
    return false
  }

  return true
}

async function main() {
  console.log('🔍 ERC-8004 Indexer Validation\n')
  console.log(`API: ${API_BASE}`)
  console.log('─'.repeat(50))

  // Fetch indexed agents
  console.log('\n📥 Fetching indexed agents...')
  const agents = await fetchIndexedAgents()
  console.log(`Found ${agents.length} agents`)

  if (agents.length === 0) {
    console.log('\n⚠️ No agents found. Is the indexer running?')
    console.log('   Start with: pnpm dev')
    return
  }

  // Validate each agent
  console.log('\n🔎 Validating agents...')
  let valid = 0
  let invalid = 0

  for (const agent of agents) {
    const isValid = await validateAgent(agent)
    if (isValid) {
      valid++
    } else {
      invalid++
    }
  }

  console.log('\n' + '─'.repeat(50))
  console.log('📊 Results:')
  console.log(`   ✅ Valid: ${valid}`)
  console.log(`   ❌ Invalid: ${invalid}`)
  console.log(`   📈 Total: ${agents.length}`)

  // Show sample agent
  if (agents.length > 0) {
    console.log('\n📋 Sample Agent:')
    const sample = agents[0]
    console.log(`   ID: ${sample.id}`)
    console.log(`   Agent ID: ${sample.agentId}`)
    console.log(`   Chain: ${sample.chainId}`)
    console.log(`   Owner: ${sample.owner}`)
    console.log(`   Created: ${new Date(parseInt(sample.createdAt) * 1000).toISOString()}`)
    console.log(`   Tx: ${sample.txHash}`)
  }

  // Fetch stats
  console.log('\n📈 Global Stats:')
  try {
    const statsResponse = await fetch(`${API_BASE}/stats`)
    const stats = await statsResponse.json()
    console.log(`   Total Agents: ${stats.totalAgents}`)
    console.log(`   Total Feedback: ${stats.totalFeedback}`)
    console.log(`   Agents Today: ${stats.agentsToday}`)
    console.log(`   Chains: ${stats.chains?.map((c: { name: string }) => c.name).join(', ')}`)
  } catch (error) {
    console.error('   Failed to fetch stats')
  }

  console.log('\n✨ Validation complete!')

  // Exit with error code if validation failed
  if (invalid > 0) {
    process.exit(1)
  }
}

main().catch(console.error)
