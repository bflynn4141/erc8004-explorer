import { useAgentDetails } from '../hooks/useApi'
import type { Agent } from '../types'
import { getChainName, getEtherscanUrl, truncateAddress } from '../utils/chain'
import { formatDate, formatDistanceToNow } from '../utils/date'

interface AgentModalProps {
  agent: Agent
  onClose: () => void
}

export function AgentModal({ agent, onClose }: AgentModalProps) {
  const [chainId, agentId] = agent.id.split(':')
  const { data: details, isLoading } = useAgentDetails(parseInt(chainId), agentId)

  const agentData = details || agent
  const feedbackByTag = details?.feedbackByTag ?? []
  const recentFeedback = details?.recentFeedback ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400/20 to-primary-600/20 rounded-xl flex items-center justify-center overflow-hidden">
              {agentData.imageUri?.startsWith('http') ? (
                <img
                  src={agentData.imageUri}
                  alt={agentData.name || 'Agent'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.parentElement!.innerHTML = '🤖'
                  }}
                />
              ) : (
                <span className="text-3xl">🤖</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {agentData.name || `Agent #${agentData.agentId}`}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-300">
                  {getChainName(agentData.chainId)}
                </span>
                <span className="text-sm text-slate-400">
                  Token #{agentData.agentId}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-700 rounded w-full" />
              <div className="h-4 bg-slate-700 rounded w-3/4" />
              <div className="h-4 bg-slate-700 rounded w-1/2" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Description */}
              {agentData.description && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Description</h3>
                  <p className="text-white">{agentData.description}</p>
                </div>
              )}

              {/* Stats */}
              {agentData.stats && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Reputation</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-yellow-400">
                        {agentData.stats.averageScore.toFixed(1)}
                      </p>
                      <p className="text-xs text-slate-400">Avg Score</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-white">
                        {agentData.stats.feedbackCount}
                      </p>
                      <p className="text-xs text-slate-400">Total Reviews</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-white">
                        {agentData.stats.uniqueGivers}
                      </p>
                      <p className="text-xs text-slate-400">Unique Reviewers</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback by Tag */}
              {feedbackByTag.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Feedback by Category</h3>
                  <div className="flex flex-wrap gap-2">
                    {feedbackByTag.map((tag) => (
                      <div
                        key={tag.tag}
                        className="bg-slate-700/50 rounded-lg px-3 py-2 flex items-center gap-2"
                      >
                        <span className="text-white font-medium">{tag.tag}</span>
                        <span className="text-xs text-slate-400">
                          {tag.count} reviews • {tag.averageScore.toFixed(1)} avg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Feedback */}
              {recentFeedback.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Recent Feedback</h3>
                  <div className="space-y-2">
                    {recentFeedback.slice(0, 5).map((fb) => (
                      <div
                        key={fb.id}
                        className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm text-white">
                            <span className="text-primary-400">{truncateAddress(fb.giver)}</span>
                            {fb.tag && (
                              <span className="text-slate-400 ml-2">#{fb.tag}</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDistanceToNow(parseInt(fb.createdAt) * 1000)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-400">
                          <span>⭐</span>
                          <span className="font-semibold">{fb.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Details</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Owner</dt>
                    <dd className="text-white font-mono">
                      <a
                        href={getEtherscanUrl(agentData.chainId, agentData.owner, 'address')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:underline"
                      >
                        {truncateAddress(agentData.owner)}
                      </a>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Created</dt>
                    <dd className="text-white">
                      {formatDate(parseInt(agentData.createdAt) * 1000)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Registration Tx</dt>
                    <dd>
                      <a
                        href={getEtherscanUrl(agentData.chainId, agentData.txHash, 'tx')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:underline"
                      >
                        {truncateAddress(agentData.txHash)}
                      </a>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Metadata URI</dt>
                    <dd>
                      <a
                        href={agentData.agentUri.startsWith('ipfs://')
                          ? `https://ipfs.io/ipfs/${agentData.agentUri.replace('ipfs://', '')}`
                          : agentData.agentUri
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:underline break-all"
                      >
                        View metadata ↗
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Services */}
              {details?.services != null && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Services</h3>
                  <pre className="bg-slate-900 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto">
                    {JSON.stringify(details.services, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
          <a
            href={getEtherscanUrl(agentData.chainId, agentData.txHash, 'tx')}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white transition-colors"
          >
            View on Etherscan ↗
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg text-sm text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
