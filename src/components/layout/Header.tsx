import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LogOut, KeyRound, ChevronDown } from 'lucide-react'
import { logout, getMe } from '@/api/auth'

export function Header() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data } = useQuery({ queryKey: ['me'], queryFn: getMe, staleTime: Infinity })

  async function handleLogout() {
    await logout()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-14 items-center justify-end border-b bg-white px-6 gap-4">
      <button
        onClick={() => navigate('/change-password')}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
      >
        <KeyRound className="h-4 w-4" />
        <span>{data?.name}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <LogOut className="h-4 w-4" />
        Выйти
      </button>
    </header>
  )
}
