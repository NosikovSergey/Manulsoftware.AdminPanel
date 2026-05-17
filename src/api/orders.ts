import { api } from '@/lib/http'
import type { Order } from '@/types'

export async function getOrder(orderId: string): Promise<Order> {
  return api.get(`api/orders/${orderId}`).json<Order>()
}

export async function cancelAndRefundOrder(orderId: string): Promise<void> {
  await api.post(`api/orders/${orderId}/cancel-and-refund`)
}

export async function refundOrder(orderId: string): Promise<void> {
  await api.post(`api/orders/${orderId}/refund`)
}
