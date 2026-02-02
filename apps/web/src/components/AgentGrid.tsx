import { useState } from 'react'
import type { Agent } from '../types'
import { AgentCard } from './AgentCard'
import { AgentList } from './AgentList'

interface AgentGridProps {
  agents: Agent[]
  isLoading: boolean
  onAgentClick: (agent: Agent) => void
}

type ViewMode = 'grid' | 'list'

export function AgentGrid({ agents, isLoading, onAgentClick }: AgentGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list') // Default to list for metrics visibility

  const ViewToggle = () => (
    <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
      <button
        onClick={() => setViewMode('list')}
        className={`p-1.5 rounded transition-colors ${
          viewMode === 'list'
            ? 'bg-slate-600 text-white'
            : 'text-slate-400 hover:text-white'
        }`}
        title="List view"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>
      <button
        onClick={() => setViewMode('grid')}
        className={`p-1.5 rounded transition-colors ${
          viewMode === 'grid'
            ? 'bg-slate-600 text-white'
            : 'text-slate-400 hover:text-white'
        }`}
        title="Grid view"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
    </div>
  )

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Agent Directory</h2>
          <ViewToggle />
        </div>
        {viewMode === 'list' ? (
          <AgentList agents={[]} isLoading={true} onAgentClick={onAgentClick} />
        ) : (
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
        )}
      </div>
    )
  }

  if (agents.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Agent Directory</h2>
          <ViewToggle />
        </div>
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Agent Directory
          <span className="ml-2 text-sm font-normal text-slate-400">
            ({agents.length} agents)
          </span>
        </h2>
        <ViewToggle />
      </div>

      {viewMode === 'list' ? (
        <AgentList agents={agents} isLoading={false} onAgentClick={onAgentClick} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => onAgentClick(agent)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
