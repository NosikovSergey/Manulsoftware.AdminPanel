import ky from 'ky'
import { api } from '@/lib/http'
import type { AdminMe } from '@/types'

// Отдельный инстанс без редиректа — для проверки сессии при старте
const baseUrl = import.meta.env.VITE_API_URL as string

export async function getMe(): Promise<AdminMe | null> {
  const response = await ky.get(`${baseUrl}/api/auth/me`, {
    credentials: 'include',
    throwHttpErrors: false,
  })
  if (!response.ok) return null
  return response.json<AdminMe>()
}

export async function login(login: string, password: string): Promise<AdminMe> {
  return api.post('api/auth/login', { json: { login, password } }).json<AdminMe>()
}

export async function logout(): Promise<void> {
  await api.post('api/auth/logout')
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post('api/auth/change-password', { json: { currentPassword, newPassword } })
}
