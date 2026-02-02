import { useState, useMemo } from 'react'
import { useAgents, useActivity, useStats } from './hooks/useApi'
import { Layout } from './components/Layout'
import { StatsBar } from './components/StatsBar'
import { ActivityFeed } from './components/ActivityFeed'
import { AgentGrid } from './components/AgentGrid'
import { AgentModal } from './components/AgentModal'
import type { Agent } from './types'

type StatusFilter = 'all' | 'production' | 'active' | 'test'

function App() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [chainFilter, setChainFilter] = useState<number | undefined>()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'feedback'>('newest')

  const { data: stats, isLoading: statsLoading } = useStats()
  const { data: agentsData, isLoading: agentsLoading } = useAgents({
    chainId: chainFilter,
    sort: sortBy,
  })
  const { data: activityData, isLoading: activityLoading } = useActivity()

  // Filter agents by status client-side
  const filteredAgents = useMemo(() => {
    if (!agentsData?.agents) return []

    return agentsData.agents.filter((agent) => {
      if (statusFilter === 'all') return true

      const hasMetadata = Boolean(agent.name || agent.description)
      const hasFeedback = (agent.stats?.feedbackCount ?? 0) > 0
      const hasVolume = (agent.volume?.txCount ?? 0) > 0

      // Production = has volume OR (has metadata + feedback)
      const isProduction = hasVolume || (hasMetadata && hasFeedback)

      switch (statusFilter) {
        case 'production':
          return isProduction
        case 'active':
          return hasMetadata && !isProduction
        case 'test':
          return !hasMetadata
        default:
          return true
      }
    })
  }, [agentsData?.agents, statusFilter])

  return (
    <Layout>
      {/* Stats Bar */}
      <StatsBar stats={stats} isLoading={statsLoading} />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Chain:</label>
          <select
            value={chainFilter ?? ''}
            onChange={(e) => setChainFilter(e.target.value ? parseInt(e.target.value) : undefined)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Chains</option>
            <option value="1">Ethereum</option>
            <option value="11155111">Sepolia</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Agents</option>
            <option value="production">Production</option>
            <option value="active">Active (no feedback)</option>
            <option value="test">Test (no metadata)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">Newest</option>
            <option value="rating">Highest Rated</option>
            <option value="feedback">Most Feedback</option>
          </select>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Activity Feed - Sidebar */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <ActivityFeed
            events={activityData?.events ?? []}
            isLoading={activityLoading}
            onAgentClick={(agentId) => {
              const agent = agentsData?.agents.find((a) => a.id === agentId)
              if (agent) setSelectedAgent(agent)
            }}
          />
        </div>

        {/* Agent Directory - Main */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <AgentGrid
            agents={filteredAgents}
            isLoading={agentsLoading}
            onAgentClick={setSelectedAgent}
          />
        </div>
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </Layout>
  )
}

export default App
