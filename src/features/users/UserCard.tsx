import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getUser,
  getUserKeys,
  getUserOrders,
  getUserTransactions,
  blockUser,
  unblockUser,
  grantAdmin,
  revokeAdmin,
  resetTrial,
} from '@/api/users'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatFullName,
  formatDate,
  formatDateTime,
  formatAmount,
  TARIFF_DURATION_LABEL,
} from '@/lib/formatters'
import {
  USER_STATUS_LABEL,
  KEY_STATUS_LABEL,
  KEY_STATUS_VARIANT,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_VARIANT,
  TRANSACTION_TYPE_LABEL,
  TRANSACTION_STATUS_LABEL,
} from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { TransactionVisualType } from '@/types'

function transactionAmountSign(type: TransactionVisualType): '+' | '−' {
  return type === 'deposit' || type === 'refund' ? '+' : '−'
}

export function UserCard() {
  const { userId } = useParams<{ userId: string }>()
  const numericUserId = Number(userId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirmDialog()

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['user', numericUserId],
    queryFn: () => getUser(numericUserId),
  })

  usePageTitle(user ? formatFullName(user.firstName, user.lastName) : undefined)

  const invalidateUser = () =>
    queryClient.invalidateQueries({ queryKey: ['user', numericUserId] })

  const blockMutation = useMutation({ mutationFn: () => blockUser(numericUserId), onSuccess: invalidateUser })
  const unblockMutation = useMutation({ mutationFn: () => unblockUser(numericUserId), onSuccess: invalidateUser })
  const grantAdminMutation = useMutation({ mutationFn: () => grantAdmin(numericUserId), onSuccess: invalidateUser })
  const revokeAdminMutation = useMutation({ mutationFn: () => revokeAdmin(numericUserId), onSuccess: invalidateUser })
  const resetTrialMutation = useMutation({ mutationFn: () => resetTrial(numericUserId), onSuccess: invalidateUser })

  const { data: keys, isLoading: keysLoading } = useQuery({
    queryKey: ['user-keys', numericUserId],
    queryFn: () => getUserKeys(numericUserId),
  })

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['user-orders', numericUserId],
    queryFn: () => getUserOrders(numericUserId),
  })

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['user-transactions', numericUserId],
    queryFn: () => getUserTransactions(numericUserId),
  })

  async function handleBlock() {
    const ok = await confirm(
      'Пользователь будет заблокирован и не сможет взаимодействовать с ботом. Активные ключи продолжат работать.',
    )
    if (!ok) return
    await blockMutation.mutateAsync()
  }

  async function handleUnblock() {
    const ok = await confirm('Пользователь будет разблокирован.')
    if (!ok) return
    await unblockMutation.mutateAsync()
  }

  async function handleGrantAdmin() {
    const ok = await confirm('Пользователь получит права администратора в боте.')
    if (!ok) return
    await grantAdminMutation.mutateAsync()
  }

  async function handleRevokeAdmin() {
    const ok = await confirm('Права администратора в боте будут отозваны.')
    if (!ok) return
    await revokeAdminMutation.mutateAsync()
  }

  async function handleResetTrial() {
    const ok = await confirm(
      'Пробный период будет сброшен — пользователь снова увидит кнопку «Попробовать бесплатно».',
    )
    if (!ok) return
    await resetTrialMutation.mutateAsync()
  }

  if (isLoading) {
    return <div className="text-sm text-gray-400">Загрузка...</div>
  }

  if (isError || !user) {
    return <div className="text-sm text-red-600">Пользователь не найден</div>
  }

  const anyActionPending =
    blockMutation.isPending ||
    unblockMutation.isPending ||
    grantAdminMutation.isPending ||
    revokeAdminMutation.isPending ||
    resetTrialMutation.isPending

  return (
    <div className="space-y-6">
      {/* Верхний блок */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-start justify-between gap-8">
          {/* Левая часть — профиль */}
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {formatFullName(user.firstName, user.lastName)}
            </h2>
            {user.username && (
              <p className="text-sm text-gray-500">@{user.username}</p>
            )}
            <p className="text-sm text-gray-500">
              Telegram ID: <span className="font-mono">{user.id}</span>
            </p>
            <p className="text-sm text-gray-500">
              Зарегистрирован: {formatDate(user.dateJoined)}
            </p>
            {user.lastActive && (
              <p className="text-sm text-gray-500">
                Активность: {formatDateTime(user.lastActive)}
              </p>
            )}
          </div>

          {/* Правая часть — статус и баланс */}
          <div className="flex flex-col items-end gap-2">
            <Badge variant={user.status === 'active' ? 'success' : 'error'}>
              {USER_STATUS_LABEL[user.status]}
            </Badge>
            <div className="text-right">
              <span
                className={cn(
                  'text-2xl font-bold',
                  user.balance < 0 ? 'text-red-600' : 'text-gray-900',
                )}
              >
                {formatAmount(user.balance)}
              </span>
              {user.balance < 0 && (
                <p className="text-xs text-red-500">долг</p>
              )}
            </div>
            {user.isTrialUsed && (
              <Badge variant="secondary">Пробный период использован</Badge>
            )}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
          {user.status === 'active' ? (
            <Button
              variant="outline"
              size="sm"
              disabled={anyActionPending}
              onClick={handleBlock}
            >
              Заблокировать
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={anyActionPending}
              onClick={handleUnblock}
            >
              Разблокировать
            </Button>
          )}

          {user.isAdmin ? (
            <Button
              variant="outline"
              size="sm"
              disabled={anyActionPending}
              onClick={handleRevokeAdmin}
            >
              Забрать права администратора
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={anyActionPending}
              onClick={handleGrantAdmin}
            >
              Выдать права администратора
            </Button>
          )}

          {user.isTrialUsed && (
            <Button
              variant="outline"
              size="sm"
              disabled={anyActionPending}
              onClick={handleResetTrial}
            >
              Сбросить пробный период
            </Button>
          )}
        </div>
      </div>

      {/* Вкладки */}
      <Tabs defaultValue="keys">
        <TabsList>
          <TabsTrigger value="keys">Ключи</TabsTrigger>
          <TabsTrigger value="orders">Заказы</TabsTrigger>
          <TabsTrigger value="transactions">Транзакции</TabsTrigger>
        </TabsList>

        {/* Вкладка Ключи */}
        <TabsContent value="keys" className="mt-4">
          {keysLoading ? (
            <p className="text-sm text-gray-400">Загрузка...</p>
          ) : !keys?.length ? (
            <p className="text-sm text-gray-400">Ключи не найдены</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Сервер</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата истечения</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => (
                    <TableRow
                      key={key.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/keys/${key.id}`)}
                    >
                      <TableCell className="font-medium">{key.serverName}</TableCell>
                      <TableCell>
                        <Badge variant={KEY_STATUS_VARIANT[key.status]}>
                          {KEY_STATUS_LABEL[key.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatDate(key.expiredDate)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Вкладка Заказы */}
        <TabsContent value="orders" className="mt-4">
          {ordersLoading ? (
            <p className="text-sm text-gray-400">Загрузка...</p>
          ) : !orders?.length ? (
            <p className="text-sm text-gray-400">Заказы не найдены</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тариф</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Создан</TableHead>
                    <TableHead>Истекает</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <TableCell className="font-medium">
                        {TARIFF_DURATION_LABEL[order.tariffDuration] ?? order.tariffDuration}
                      </TableCell>
                      <TableCell>
                        <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
                          {ORDER_STATUS_LABEL[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {order.expiredAt ? formatDate(order.expiredAt) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Вкладка Транзакции */}
        <TabsContent value="transactions" className="mt-4">
          {transactionsLoading ? (
            <p className="text-sm text-gray-400">Загрузка...</p>
          ) : !transactions?.length ? (
            <p className="text-sm text-gray-400">Транзакции не найдены</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дата</TableHead>
                    <TableHead>Тип</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Статус</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/transactions/${tx.id}`)}
                    >
                      <TableCell className="text-gray-500">
                        {formatDate(tx.date)}
                      </TableCell>
                      <TableCell>{TRANSACTION_TYPE_LABEL[tx.visualType]}</TableCell>
                      <TableCell
                        className={cn(
                          'tabular-nums font-medium',
                          tx.visualType === 'deposit' || tx.visualType === 'refund'
                            ? 'text-green-600'
                            : 'text-gray-900',
                        )}
                      >
                        {transactionAmountSign(tx.visualType)}
                        {formatAmount(tx.amount)}
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {TRANSACTION_STATUS_LABEL[tx.status]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        dialogState={dialogState}
        handleConfirm={handleConfirm}
        handleCancel={handleCancel}
      />
    </div>
  )
}
