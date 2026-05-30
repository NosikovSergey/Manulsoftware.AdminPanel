import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { HTTPError } from 'ky'
import { getTransaction, rollbackTransaction } from '@/api/transactions'
import { getUser } from '@/api/users'
import { useBreadcrumbChain } from '@/hooks/usePageTitle'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatFullName, formatDateTime, formatAmount } from '@/lib/formatters'
import { TRANSACTION_TYPE_LABEL, TRANSACTION_STATUS_LABEL, TRANSACTION_STATUS_VARIANT } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { TransactionType } from '@/types'


function amountSign(type: TransactionType): '+' | '−' {
  return type === 'deposit' ? '+' : '−'
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
  const [rollbackError, setRollbackError] = useState<string | null>(null)

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
    setRollbackError(null)
    try {
      await rollbackMutation.mutateAsync()
    } catch (err) {
      if (err instanceof HTTPError) {
        const body = await err.response.json<{ error: string }>()
        setRollbackError(body.error)
      } else {
        setRollbackError('Произошла ошибка. Попробуйте ещё раз.')
      }
    }
  }

  if (isLoading) {
    return <div className="text-sm text-gray-400">Загрузка...</div>
  }

  if (isError || !transaction) {
    return <div className="text-sm text-red-600">Транзакция не найдена</div>
  }

  const canRollback = transaction.type === 'deposit' && transaction.status === 'committed'

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
            {TRANSACTION_TYPE_LABEL[transaction.type]}
          </InfoRow>
          <InfoRow label="Сумма">
            <span
              className={cn(
                'tabular-nums',
                transaction.type === 'deposit' ? 'text-green-600' : 'text-gray-900',
              )}
            >
              {amountSign(transaction.type)}
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
        <div className="space-y-2">
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
          {rollbackError && (
            <p className="text-sm text-red-600">{rollbackError}</p>
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
