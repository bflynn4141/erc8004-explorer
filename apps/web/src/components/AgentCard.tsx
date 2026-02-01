import type { Agent } from '../types'
import { getChainName, truncateAddress } from '../utils/chain'
import { formatDate } from '../utils/date'

interface AgentCardProps {
  agent: Agent
  onClick: () => void
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const hasImage = agent.imageUri && agent.imageUri.startsWith('http')

  return (
    <div
      onClick={onClick}
      className="agent-card bg-slate-800 rounded-lg border border-slate-700 p-4 cursor-pointer hover:border-primary-500/50"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {hasImage ? (
            <img
              src={agent.imageUri!}
              alt={agent.name || 'Agent'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                e.currentTarget.parentElement!.innerHTML = '🤖'
              }}
            />
          ) : (
            <span className="text-2xl">🤖</span>
          )}
        </div>

        {/* Name & Chain */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate">
            {agent.name || `Agent #${agent.agentId}`}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">
              {getChainName(agent.chainId)}
            </span>
            <span className="text-xs text-slate-500">
              #{agent.agentId}
            </span>
          </div>
        </div>

        {/* Rating */}
        {agent.stats && agent.stats.feedbackCount > 0 && (
          <div className="text-right flex-shrink-0">
            <div className="flex items-center gap-1 text-yellow-400">
              <span>⭐</span>
              <span className="font-semibold">
                {agent.stats.averageScore.toFixed(1)}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {agent.stats.feedbackCount} reviews
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      {agent.description && (
        <p className="text-sm text-slate-400 line-clamp-2 mb-3">
          {agent.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-700">
        <span>Owner: {truncateAddress(agent.owner)}</span>
        <span>{formatDate(parseInt(agent.createdAt) * 1000)}</span>
      </div>
    </div>
  )
}
