import { api } from '@/lib/http'
import type { User, KeySummary, OrderSummary, TransactionSummary } from '@/types'

export async function searchUsers(query: string, page = 1, pageSize = 20): Promise<User[]> {
  return api.get('api/users', { searchParams: { query, page, pageSize } }).json<User[]>()
}

export async function getUser(userId: number): Promise<User> {
  return api.get(`api/users/${userId}`).json<User>()
}

export async function getUserKeys(userId: number): Promise<KeySummary[]> {
  return api.get(`api/users/${userId}/keys`).json<KeySummary[]>()
}

export async function getUserOrders(userId: number, page = 1, pageSize = 20): Promise<OrderSummary[]> {
  return api.get(`api/users/${userId}/orders`, { searchParams: { page, pageSize } }).json<OrderSummary[]>()
}

export async function getUserTransactions(userId: number, page = 1, pageSize = 20): Promise<TransactionSummary[]> {
  return api.get(`api/users/${userId}/transactions`, { searchParams: { page, pageSize } }).json<TransactionSummary[]>()
}

export async function blockUser(userId: number): Promise<void> {
  await api.post(`api/users/${userId}/block`)
}

export async function unblockUser(userId: number): Promise<void> {
  await api.post(`api/users/${userId}/unblock`)
}

export async function grantAdmin(userId: number): Promise<void> {
  await api.post(`api/users/${userId}/grant-admin`)
}

export async function revokeAdmin(userId: number): Promise<void> {
  await api.post(`api/users/${userId}/revoke-admin`)
}

export async function resetTrial(userId: number): Promise<void> {
  await api.post(`api/users/${userId}/reset-trial`)
}
