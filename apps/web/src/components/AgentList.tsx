import type { Agent } from '../types'
import { truncateAddress } from '../utils/chain'
import { formatDistanceToNow } from '../utils/date'

interface AgentListProps {
  agents: Agent[]
  isLoading: boolean
  onAgentClick: (agent: Agent) => void
}

// Format USDC amount from 6 decimal places
function formatUSDC(amount: string | undefined): string {
  if (!amount || amount === '0') return '$0'
  const value = parseFloat(amount) / 1e6
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`
  }
  if (value >= 1) {
    return `$${value.toFixed(0)}`
  }
  return `$${value.toFixed(2)}`
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-slate-700/50 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <th className="text-left px-4 py-3 w-[240px]">Agent</th>
              <th className="text-center px-2 py-3 w-[60px]">Chain</th>
              <th className="text-center px-2 py-3 w-[100px]">Status</th>
              <th className="text-center px-2 py-3 w-[80px]">Volume</th>
              <th className="text-center px-2 py-3 w-[50px]">Txs</th>
              <th className="text-center px-2 py-3 w-[60px]">Payers</th>
              <th className="text-center px-2 py-3 w-[70px]">Reviews</th>
              <th className="text-center px-2 py-3 w-[60px]">Score</th>
              <th className="text-right px-4 py-3 w-[90px]">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {agents.map((agent) => {
              const hasMetadata = Boolean(agent.name || agent.description)
              const hasVolume = (agent.volume?.txCount ?? 0) > 0
              const hasFeedback = (agent.stats?.feedbackCount ?? 0) > 0

              // Status logic: Production = has volume OR has feedback with metadata
              const isProduction = hasVolume || (hasMetadata && hasFeedback)
              const isActive = hasMetadata && !isProduction

              return (
                <tr
                  key={agent.id}
                  onClick={() => onAgentClick(agent)}
                  className="hover:bg-slate-700/30 cursor-pointer transition-colors"
                >
                  {/* Agent Name/ID */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
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
                        <div className="flex items-center gap-1.5">
                          <p className="text-white font-medium truncate max-w-[150px]">
                            {agent.name || `Agent #${agent.agentId}`}
                          </p>
                          {agent.hasX402 && (
                            <span className="text-xs px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded flex-shrink-0" title="Accepts x402 payments">
                              x402
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {truncateAddress(agent.owner)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Chain */}
                  <td className="px-2 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      agent.chainId === 1
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {agent.chainId === 1 ? 'ETH' : 'SEP'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-2 py-3 text-center">
                    {isProduction ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                        Production
                      </span>
                    ) : isActive ? (
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
                  </td>

                  {/* Volume */}
                  <td className="px-2 py-3 text-center">
                    <span className={`text-sm font-medium ${
                      hasVolume ? 'text-green-400' : 'text-slate-500'
                    }`}>
                      {formatUSDC(agent.volume?.totalVolume)}
                    </span>
                  </td>

                  {/* Transactions */}
                  <td className="px-2 py-3 text-center">
                    <span className={`text-sm ${
                      (agent.volume?.txCount ?? 0) > 0 ? 'text-white' : 'text-slate-500'
                    }`}>
                      {agent.volume?.txCount ?? 0}
                    </span>
                  </td>

                  {/* Unique Payers */}
                  <td className="px-2 py-3 text-center">
                    <span className={`text-sm ${
                      (agent.volume?.uniquePayers ?? 0) > 0 ? 'text-white' : 'text-slate-500'
                    }`}>
                      {agent.volume?.uniquePayers ?? 0}
                    </span>
                  </td>

                  {/* Reviews */}
                  <td className="px-2 py-3 text-center">
                    <span className={`text-sm ${
                      (agent.stats?.feedbackCount ?? 0) > 0 ? 'text-white' : 'text-slate-500'
                    }`}>
                      {agent.stats?.feedbackCount ?? 0}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="px-2 py-3 text-center">
                    {(agent.stats?.averageScore ?? 0) > 0 ? (
                      <span className="text-sm text-yellow-400 font-medium">
                        {agent.stats?.averageScore.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-slate-400">
                      {formatDistanceToNow(parseInt(agent.createdAt) * 1000)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
