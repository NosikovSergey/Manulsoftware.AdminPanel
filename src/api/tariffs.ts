import { api } from '@/lib/http'
import type { Tariff } from '@/types'

export async function getTariffs(): Promise<Tariff[]> {
  return api.get('api/tariffs').json<Tariff[]>()
}

export async function updateTariff(
  id: number,
  patch: { price?: number; isEnabled?: boolean; isBestChoice?: boolean },
): Promise<Tariff> {
  return api.patch(`api/tariffs/${id}`, { json: patch }).json<Tariff>()
}
