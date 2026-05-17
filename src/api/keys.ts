import { api } from '@/lib/http'
import type { Key, TariffDuration } from '@/types'

export async function getKey(keyId: number): Promise<Key> {
  return api.get(`api/keys/${keyId}`).json<Key>()
}

export async function enableKey(keyId: number): Promise<void> {
  await api.post(`api/keys/${keyId}/enable`)
}

export async function disableKey(keyId: number): Promise<void> {
  await api.post(`api/keys/${keyId}/disable`)
}

export async function extendKey(keyId: number, duration: TariffDuration): Promise<{ newExpiredDate: string }> {
  return api.post(`api/keys/${keyId}/extend`, { json: { duration } }).json<{ newExpiredDate: string }>()
}

export async function restoreKey(keyId: number): Promise<void> {
  await api.post(`api/keys/${keyId}/restore`)
}
