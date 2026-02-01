import { useQuery } from '@tanstack/react-query'
import type { Agent, AgentDetails, ActivityEvent, GlobalStats } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function fetchJson<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`)
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

interface AgentsResponse {
  agents: Agent[]
  total: number
  limit: number
  offset: number
}

interface AgentsParams {
  limit?: number
  offset?: number
  chainId?: number
  sort?: 'newest' | 'rating' | 'feedback'
}

export function useAgents(params: AgentsParams = {}) {
  const queryString = new URLSearchParams()
  if (params.limit) queryString.set('limit', params.limit.toString())
  if (params.offset) queryString.set('offset', params.offset.toString())
  if (params.chainId) queryString.set('chainId', params.chainId.toString())
  if (params.sort) queryString.set('sort', params.sort)

  const query = queryString.toString()
  const endpoint = `/agents${query ? `?${query}` : ''}`

  return useQuery({
    queryKey: ['agents', params],
    queryFn: () => fetchJson<AgentsResponse>(endpoint),
    refetchInterval: 10000, // Refresh every 10 seconds
  })
}

export function useAgentDetails(chainId: number, agentId: string) {
  return useQuery({
    queryKey: ['agent', chainId, agentId],
    queryFn: () => fetchJson<AgentDetails>(`/agents/${chainId}/${agentId}`),
    enabled: !!chainId && !!agentId,
  })
}

interface ActivityResponse {
  events: ActivityEvent[]
  limit: number
  offset: number
}

interface ActivityParams {
  limit?: number
  offset?: number
  type?: 'registered' | 'feedback' | 'transfer'
  chainId?: number
}

export function useActivity(params: ActivityParams = {}) {
  const queryString = new URLSearchParams()
  if (params.limit) queryString.set('limit', params.limit.toString())
  if (params.offset) queryString.set('offset', params.offset.toString())
  if (params.type) queryString.set('type', params.type)
  if (params.chainId) queryString.set('chainId', params.chainId.toString())

  const query = queryString.toString()
  const endpoint = `/activity${query ? `?${query}` : ''}`

  return useQuery({
    queryKey: ['activity', params],
    queryFn: () => fetchJson<ActivityResponse>(endpoint),
    refetchInterval: 5000, // Refresh every 5 seconds for real-time feel
  })
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => fetchJson<GlobalStats>('/stats'),
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}
