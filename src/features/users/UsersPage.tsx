import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { searchUsers } from '@/api/users'
import { useDebounce } from '@/hooks/useDebounce'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatFullName, formatDate, formatAmount } from '@/lib/formatters'
import { USER_STATUS_LABEL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { UserStatus } from '@/types'

const STATUS_VARIANT: Record<UserStatus, 'success' | 'error'> = {
  active: 'success',
  banned: 'error',
}

export function UsersPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query.trim(), 300)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Пользователи</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Telegram ID, username или имя"
          className="w-full rounded-md border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-gray-300"
        />
      </div>

      {isLoading && (
        <p className="text-sm text-gray-400">Загрузка...</p>
      )}

      {isError && (
        <p className="text-sm text-red-600">Не удалось загрузить результаты</p>
      )}

      {data && data.length === 0 && (
        <p className="text-sm text-gray-400">Ничего не найдено</p>
      )}

      {data && data.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Telegram ID</TableHead>
                <TableHead>Баланс</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Дата регистрации</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigate(`/users/${user.id}`)}
                >
                  <TableCell className="font-medium">
                    {formatFullName(user.firstName, user.lastName)}
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {user.username ? `@${user.username}` : '—'}
                  </TableCell>
                  <TableCell className="tabular-nums text-gray-500">
                    {user.id}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'tabular-nums font-medium',
                      user.balance < 0 ? 'text-red-600' : 'text-gray-900',
                    )}
                  >
                    {formatAmount(user.balance)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[user.status]}>
                      {USER_STATUS_LABEL[user.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatDate(user.dateJoined)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
