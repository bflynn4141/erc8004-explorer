import type { GlobalStats } from '../types'

interface StatsBarProps {
  stats: GlobalStats | undefined
  isLoading: boolean
}

export function StatsBar({ stats, isLoading }: StatsBarProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-slate-800 rounded-lg p-4 animate-pulse"
          >
            <div className="h-4 bg-slate-700 rounded w-20 mb-2" />
            <div className="h-8 bg-slate-700 rounded w-16" />
          </div>
        ))}
      </div>
    )
  }

  const statItems = [
    {
      label: 'Total Agents',
      value: stats?.totalAgents ?? 0,
      icon: '🤖',
      color: 'text-primary-400',
    },
    {
      label: 'Total Feedback',
      value: stats?.totalFeedback ?? 0,
      icon: '⭐',
      color: 'text-yellow-400',
    },
    {
      label: 'Registered Today',
      value: stats?.agentsToday ?? 0,
      icon: '📈',
      color: 'text-green-400',
    },
    {
      label: 'Active Chains',
      value: stats?.chains.length ?? 0,
      icon: '⛓️',
      color: 'text-purple-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {statItems.map((item) => (
        <div
          key={item.label}
          className="bg-slate-800 rounded-lg p-4 border border-slate-700"
        >
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
          <p className={`text-2xl font-bold ${item.color}`}>
            {item.value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )
}
