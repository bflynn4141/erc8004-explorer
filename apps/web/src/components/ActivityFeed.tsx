import type { ActivityEvent } from '../types'
import { formatDistanceToNow } from '../utils/date'
import { truncateAddress, getChainName, getEtherscanUrl } from '../utils/chain'

interface ActivityFeedProps {
  events: ActivityEvent[]
  isLoading: boolean
  onAgentClick: (agentId: string) => void
}

export function ActivityFeed({ events, isLoading, onAgentClick }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Activity Feed
        </h2>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-1" />
              <div className="h-3 bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'registered':
        return '🟢'
      case 'feedback':
        return '⭐'
      case 'transfer':
        return '🔄'
      default:
        return '📝'
    }
  }

  const getEventDescription = (event: ActivityEvent) => {
    const agentName = event.agentName || `Agent #${event.agentId.split(':')[1]}`

    switch (event.type) {
      case 'registered':
        return (
          <>
            <span className="font-medium text-white">{agentName}</span>
            <span className="text-slate-400"> registered by </span>
            <span className="text-primary-400">{truncateAddress(event.actor)}</span>
          </>
        )
      case 'feedback':
        return (
          <>
            <span className="font-medium text-white">{agentName}</span>
            <span className="text-slate-400"> received </span>
            <span className="text-yellow-400">{event.details.value}</span>
            <span className="text-slate-400"> from </span>
            <span className="text-primary-400">{truncateAddress(event.actor)}</span>
          </>
        )
      case 'transfer':
        return (
          <>
            <span className="font-medium text-white">{agentName}</span>
            <span className="text-slate-400"> transferred to </span>
            <span className="text-primary-400">{truncateAddress(event.details.to!)}</span>
          </>
        )
      default:
        return <span className="text-slate-400">Unknown event</span>
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        Activity Feed
      </h2>

      {events.length === 0 ? (
        <p className="text-slate-500 text-sm">No recent activity</p>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {events.map((event) => (
            <div
              key={event.id}
              className="activity-item group cursor-pointer p-2 -mx-2 rounded hover:bg-slate-700/50 transition-colors"
              onClick={() => onAgentClick(event.agentId)}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm">{getEventIcon(event.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug">
                    {getEventDescription(event)}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{formatDistanceToNow(parseInt(event.timestamp) * 1000)}</span>
                    <span>•</span>
                    <span>{getChainName(event.chainId)}</span>
                    <a
                      href={getEtherscanUrl(event.chainId, event.txHash, 'tx')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-400 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      tx ↗
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
