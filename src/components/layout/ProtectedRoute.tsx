import { Navigate, Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getMe } from '@/api/auth'

export function ProtectedRoute() {
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
    staleTime: Infinity,
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-500">
        Загрузка...
      </div>
    )
  }

  if (!data) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
