import type { Agent } from '../types'
import { truncateAddress } from '../utils/chain'
import { formatDistanceToNow } from '../utils/date'

interface AgentListProps {
  agents: Agent[]
  isLoading: boolean
  onAgentClick: (agent: Agent) => void
}

export function AgentList({ agents, isLoading, onAgentClick }: AgentListProps) {
  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-700">
              <div className="w-8 h-8 bg-slate-700 rounded" />
              <div className="flex-1">
                <div className="h-4 bg-slate-700 rounded w-32 mb-2" />
                <div className="h-3 bg-slate-700 rounded w-24" />
              </div>
              <div className="h-4 bg-slate-700 rounded w-16" />
              <div className="h-4 bg-slate-700 rounded w-12" />
              <div className="h-4 bg-slate-700 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
        <span className="text-4xl mb-4 block">🤖</span>
        <p className="text-slate-400">No agents found</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-700/50 text-xs font-medium text-slate-400 uppercase tracking-wider">
        <div className="col-span-4">Agent</div>
        <div className="col-span-1 text-center">Chain</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-1 text-center">Reviews</div>
        <div className="col-span-1 text-center">Score</div>
        <div className="col-span-1 text-center">Users</div>
        <div className="col-span-2 text-right">Created</div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-700">
        {agents.map((agent) => {
          const hasMetadata = Boolean(agent.name || agent.description)
          const isProduction = hasMetadata && (agent.stats?.feedbackCount ?? 0) > 0

          return (
            <div
              key={agent.id}
              onClick={() => onAgentClick(agent)}
              className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-slate-700/30 cursor-pointer transition-colors items-center"
            >
              {/* Agent Name/ID */}
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {agent.imageUri?.startsWith('http') ? (
                    <img
                      src={agent.imageUri}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="text-sm">🤖</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">
                    {agent.name || `Agent #${agent.agentId}`}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {truncateAddress(agent.owner)}
                  </p>
                </div>
              </div>

              {/* Chain */}
              <div className="col-span-1 text-center">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  agent.chainId === 1
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {agent.chainId === 1 ? 'ETH' : 'SEP'}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-2 text-center">
                {isProduction ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                    Production
                  </span>
                ) : hasMetadata ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-slate-500/20 text-slate-400">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    Test
                  </span>
                )}
              </div>

              {/* Reviews */}
              <div className="col-span-1 text-center">
                <span className={`text-sm ${
                  (agent.stats?.feedbackCount ?? 0) > 0
                    ? 'text-white font-medium'
                    : 'text-slate-500'
                }`}>
                  {agent.stats?.feedbackCount ?? 0}
                </span>
              </div>

              {/* Score */}
              <div className="col-span-1 text-center">
                {(agent.stats?.averageScore ?? 0) > 0 ? (
                  <span className="text-sm text-yellow-400 font-medium">
                    {agent.stats?.averageScore.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-sm text-slate-500">—</span>
                )}
              </div>

              {/* Users */}
              <div className="col-span-1 text-center">
                <span className={`text-sm ${
                  (agent.stats?.uniqueGivers ?? 0) > 0
                    ? 'text-white'
                    : 'text-slate-500'
                }`}>
                  {agent.stats?.uniqueGivers ?? 0}
                </span>
              </div>

              {/* Created */}
              <div className="col-span-2 text-right">
                <span className="text-xs text-slate-400">
                  {formatDistanceToNow(parseInt(agent.createdAt) * 1000)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
