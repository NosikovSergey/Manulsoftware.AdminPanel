import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getOrder, cancelAndRefundOrder, refundOrder } from '@/api/orders'
import { getUser } from '@/api/users'
import { useBreadcrumbChain } from '@/hooks/usePageTitle'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatFullName, formatDate, formatAmount, TARIFF_DURATION_LABEL } from '@/lib/formatters'
import { ORDER_STATUS_LABEL, ORDER_STATUS_VARIANT } from '@/lib/constants'

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1 text-sm">
      <span className="w-40 shrink-0 text-gray-500">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  )
}

export function OrderCard() {
  const { orderId } = useParams<{ orderId: string }>()
  const queryClient = useQueryClient()
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirmDialog()

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrder(orderId!),
  })

  const { data: user } = useQuery({
    queryKey: ['user', order?.userId],
    queryFn: () => getUser(order!.userId),
    enabled: order !== undefined,
  })

  useBreadcrumbChain(
    order && user
      ? [
          { label: 'Пользователи', to: '/users' },
          { label: formatFullName(user.firstName, user.lastName), to: `/users/${user.id}` },
          { label: 'Заказ' },
        ]
      : order
        ? [{ label: 'Пользователи', to: '/users' }, { label: 'Заказ' }]
        : null,
  )

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['order', orderId] })

  const cancelMutation = useMutation({
    mutationFn: () => cancelAndRefundOrder(orderId!),
    onSuccess: invalidate,
  })

  const refundMutation = useMutation({
    mutationFn: () => refundOrder(orderId!),
    onSuccess: invalidate,
  })

  async function handleCancelAndRefund() {
    const ok = await confirm(
      'Заказ будет отменён. Система автоматически определит статус платежа и вернёт деньги на баланс пользователя.',
    )
    if (!ok) return
    await cancelMutation.mutateAsync()
  }

  async function handleRefund() {
    const ok = await confirm(
      `Ключ будет отключён, ${formatAmount(order!.amount)} будут возвращены на баланс пользователя.`,
    )
    if (!ok) return
    await refundMutation.mutateAsync()
  }

  if (isLoading) {
    return <div className="text-sm text-gray-400">Загрузка...</div>
  }

  if (isError || !order) {
    return <div className="text-sm text-red-600">Заказ не найден</div>
  }

  const anyPending = cancelMutation.isPending || refundMutation.isPending

  const canCancelAndRefund = order.status === 'created' || order.status === 'paid'
  const canRefund = order.status === 'issued'

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900">Заказ</h2>
          <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
            {ORDER_STATUS_LABEL[order.status]}
          </Badge>
        </div>

        <div className="divide-y">
          <InfoRow label="ID заказа">
            <span className="font-mono text-xs text-gray-600">{order.id}</span>
          </InfoRow>
          <InfoRow label="Тариф">
            {TARIFF_DURATION_LABEL[order.tariffDuration] ?? order.tariffDuration}
          </InfoRow>
          <InfoRow label="Сумма оплаты">{formatAmount(order.amount)}</InfoRow>
          <InfoRow label="Дата создания">{formatDate(order.createdAt)}</InfoRow>
          <InfoRow label="Истекает">
            {order.expiredAt ? formatDate(order.expiredAt) : '—'}
          </InfoRow>
          <InfoRow label="Пользователь">
            {user ? (
              <Link to={`/users/${order.userId}`} className="text-blue-600 hover:underline">
                {formatFullName(user.firstName, user.lastName)}
              </Link>
            ) : (
              <Link to={`/users/${order.userId}`} className="text-blue-600 hover:underline">
                #{order.userId}
              </Link>
            )}
          </InfoRow>
          {order.keyId !== null && (
            <InfoRow label="Ключ доступа">
              <Link to={`/keys/${order.keyId}`} className="text-blue-600 hover:underline">
                Ключ #{order.keyId}
              </Link>
            </InfoRow>
          )}
        </div>
      </div>

      {(canCancelAndRefund || canRefund) && (
        <div className="flex gap-2">
          {canCancelAndRefund && (
            <Button
              variant="outline"
              size="sm"
              disabled={anyPending}
              onClick={handleCancelAndRefund}
            >
              Отменить и вернуть деньги
            </Button>
          )}
          {canRefund && (
            <Button
              variant="outline"
              size="sm"
              disabled={anyPending}
              onClick={handleRefund}
            >
              Вернуть деньги
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        dialogState={dialogState}
        handleConfirm={handleConfirm}
        handleCancel={handleCancel}
      />
    </div>
  )
}
