import { api } from '@/lib/http'
import type { Transaction } from '@/types'

export async function getTransaction(transactionId: string): Promise<Transaction> {
  return api.get(`api/transactions/${transactionId}`).json<Transaction>()
}

export async function rollbackTransaction(transactionId: string): Promise<void> {
  await api.post(`api/transactions/${transactionId}/rollback`)
}
