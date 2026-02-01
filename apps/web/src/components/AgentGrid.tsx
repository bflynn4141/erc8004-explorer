import type { Agent } from '../types'
import { AgentCard } from './AgentCard'

interface AgentGridProps {
  agents: Agent[]
  isLoading: boolean
  onAgentClick: (agent: Agent) => void
}

export function AgentGrid({ agents, isLoading, onAgentClick }: AgentGridProps) {
  if (isLoading) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Agent Directory
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-slate-800 rounded-lg border border-slate-700 p-4 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-slate-700 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-700 rounded w-24 mb-2" />
                  <div className="h-3 bg-slate-700 rounded w-16" />
                </div>
              </div>
              <div className="h-3 bg-slate-700 rounded w-full mb-2" />
              <div className="h-3 bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Agent Directory
        </h2>
        <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 text-center">
          <span className="text-4xl mb-4 block">🤖</span>
          <p className="text-slate-400">No agents found</p>
          <p className="text-sm text-slate-500 mt-1">
            Be the first to register an agent on ERC-8004!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-white mb-4">
        Agent Directory
        <span className="ml-2 text-sm font-normal text-slate-400">
          ({agents.length} agents)
        </span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onClick={() => onAgentClick(agent)}
          />
        ))}
      </div>
    </div>
  )
}
