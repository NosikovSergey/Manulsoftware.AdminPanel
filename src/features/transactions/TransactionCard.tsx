import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTransaction, rollbackTransaction } from '@/api/transactions'
import { getUser } from '@/api/users'
import { useBreadcrumbChain } from '@/hooks/usePageTitle'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatFullName, formatDateTime, formatAmount } from '@/lib/formatters'
import { TRANSACTION_TYPE_LABEL, TRANSACTION_STATUS_LABEL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { TransactionVisualType } from '@/types'

const TRANSACTION_STATUS_VARIANT: Record<string, 'secondary' | 'info' | 'success' | 'error' | 'warning'> = {
  pending: 'info',
  committed: 'success',
  canceled: 'error',
  refunded: 'warning',
}

function amountSign(type: TransactionVisualType): '+' | '−' {
  return type === 'deposit' || type === 'refund' ? '+' : '−'
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-1 text-sm">
      <span className="w-40 shrink-0 text-gray-500">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  )
}

export function TransactionCard() {
  const { transactionId } = useParams<{ transactionId: string }>()
  const queryClient = useQueryClient()
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirmDialog()

  const { data: transaction, isLoading, isError } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: () => getTransaction(transactionId!),
  })

  const { data: user } = useQuery({
    queryKey: ['user', transaction?.userId],
    queryFn: () => getUser(transaction!.userId),
    enabled: transaction !== undefined,
  })

  useBreadcrumbChain(
    transaction && user
      ? [
          { label: 'Пользователи', to: '/users' },
          { label: formatFullName(user.firstName, user.lastName), to: `/users/${user.id}` },
          { label: 'Транзакция' },
        ]
      : transaction
        ? [{ label: 'Пользователи', to: '/users' }, { label: 'Транзакция' }]
        : null,
  )

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] })

  const rollbackMutation = useMutation({
    mutationFn: () => rollbackTransaction(transactionId!),
    onSuccess: invalidate,
  })

  async function handleRollback() {
    const ok = await confirm(
      `${formatAmount(transaction!.amount)} будут вычтены из баланса пользователя. Баланс может уйти в минус.`,
    )
    if (!ok) return
    await rollbackMutation.mutateAsync()
  }

  if (isLoading) {
    return <div className="text-sm text-gray-400">Загрузка...</div>
  }

  if (isError || !transaction) {
    return <div className="text-sm text-red-600">Транзакция не найдена</div>
  }

  const canRollback = transaction.visualType === 'deposit' && transaction.status === 'committed'

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900">Транзакция</h2>
          <Badge variant={TRANSACTION_STATUS_VARIANT[transaction.status]}>
            {TRANSACTION_STATUS_LABEL[transaction.status]}
          </Badge>
        </div>

        <div className="divide-y">
          <InfoRow label="ID транзакции">
            <span className="font-mono text-xs text-gray-600">{transaction.id}</span>
          </InfoRow>
          <InfoRow label="Тип">
            {TRANSACTION_TYPE_LABEL[transaction.visualType]}
          </InfoRow>
          <InfoRow label="Сумма">
            <span
              className={cn(
                'tabular-nums',
                transaction.visualType === 'deposit' || transaction.visualType === 'refund'
                  ? 'text-green-600'
                  : 'text-gray-900',
              )}
            >
              {amountSign(transaction.visualType)}
              {formatAmount(transaction.amount)}
            </span>
          </InfoRow>
          <InfoRow label="Дата">{formatDateTime(transaction.date)}</InfoRow>
          <InfoRow label="Пользователь">
            {user ? (
              <Link to={`/users/${transaction.userId}`} className="text-blue-600 hover:underline">
                {formatFullName(user.firstName, user.lastName)}
              </Link>
            ) : (
              <Link to={`/users/${transaction.userId}`} className="text-blue-600 hover:underline">
                #{transaction.userId}
              </Link>
            )}
          </InfoRow>
        </div>
      </div>

      {canRollback && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={rollbackMutation.isPending}
            onClick={handleRollback}
          >
            Откатить транзакцию
          </Button>
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
