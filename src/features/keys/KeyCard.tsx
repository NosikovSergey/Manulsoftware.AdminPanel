import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { getKey, enableKey, disableKey, extendKey, restoreKey } from '@/api/keys'
import { getUser } from '@/api/users'
import { useBreadcrumbChain } from '@/hooks/usePageTitle'
import { useConfirmDialog } from '@/hooks/useConfirmDialog'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ExtendKeyDialog } from './ExtendKeyDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatFullName, formatDate } from '@/lib/formatters'
import { KEY_STATUS_LABEL, KEY_STATUS_VARIANT, MARZBAN_STATUS_LABEL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { KeyStatus, MarzbanStatus, TariffDuration } from '@/types'

// Соответствие между нашими статусами и статусами Marzban
const EXPECTED_MARZBAN: Record<KeyStatus, MarzbanStatus[]> = {
  active: ['active'],
  disabled: ['on_hold'],
  expired: ['expired', 'limited'],
}

function statusesMatch(ours: KeyStatus, marzban: MarzbanStatus): boolean {
  return EXPECTED_MARZBAN[ours].includes(marzban)
}

function datesMatch(a: string, b: string): boolean {
  return (
    new Date(a).toDateString() === new Date(b).toDateString()
  )
}

interface DiscrepancyRowProps {
  label: string
  hasDiscrepancy: boolean
  children: React.ReactNode
}

function DiscrepancyRow({ label, hasDiscrepancy, children }: DiscrepancyRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded px-2 py-1 text-sm',
        hasDiscrepancy && 'bg-yellow-50',
      )}
    >
      <span className="w-32 shrink-0 text-gray-500">{label}</span>
      <span className="flex items-center gap-2 font-medium">
        {children}
        {hasDiscrepancy && (
          <span className="flex items-center gap-1 text-xs text-yellow-700">
            <AlertTriangle className="h-3 w-3" />
            Расхождение с Marzban
          </span>
        )}
      </span>
    </div>
  )
}

export function KeyCard() {
  const { keyId } = useParams<{ keyId: string }>()
  const numericKeyId = Number(keyId)
  const queryClient = useQueryClient()
  const { confirm, dialogState, handleConfirm, handleCancel } = useConfirmDialog()
  const [extendOpen, setExtendOpen] = useState(false)

  const { data: key, isLoading, isError } = useQuery({
    queryKey: ['key', numericKeyId],
    queryFn: () => getKey(numericKeyId),
  })

  const { data: user } = useQuery({
    queryKey: ['user', key?.userId],
    queryFn: () => getUser(key!.userId),
    enabled: key !== undefined,
  })

  // Хлебные крошки: Пользователи > Иван Петров > Ключ #42
  useBreadcrumbChain(
    key && user
      ? [
          { label: 'Пользователи', to: '/users' },
          { label: formatFullName(user.firstName, user.lastName), to: `/users/${user.id}` },
          { label: `Ключ #${key.id}` },
        ]
      : key
        ? [
            { label: 'Пользователи', to: '/users' },
            { label: `Ключ #${key.id}` },
          ]
        : null,
  )

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['key', numericKeyId] })

  const enableMutation = useMutation({ mutationFn: () => enableKey(numericKeyId), onSuccess: invalidate })
  const disableMutation = useMutation({ mutationFn: () => disableKey(numericKeyId), onSuccess: invalidate })
  const restoreMutation = useMutation({ mutationFn: () => restoreKey(numericKeyId), onSuccess: invalidate })
  const extendMutation = useMutation({
    mutationFn: (duration: TariffDuration) => extendKey(numericKeyId, duration),
    onSuccess: () => {
      setExtendOpen(false)
      invalidate()
    },
  })

  async function handleEnable() {
    const ok = await confirm('Ключ будет включён и трафик возобновится.')
    if (!ok) return
    await enableMutation.mutateAsync()
  }

  async function handleDisable() {
    const ok = await confirm('Ключ будет отключён и трафик прекратится немедленно.')
    if (!ok) return
    await disableMutation.mutateAsync()
  }

  async function handleRestore() {
    const ok = await confirm(
      'Состояние ключа будет принудительно синхронизировано с Marzban.',
    )
    if (!ok) return
    await restoreMutation.mutateAsync()
  }

  if (isLoading) {
    return <div className="text-sm text-gray-400">Загрузка...</div>
  }

  if (isError || !key) {
    return <div className="text-sm text-red-600">Ключ не найден</div>
  }

  const statusMismatch = !statusesMatch(key.status, key.marzban.status)
  const dateMismatch = !datesMatch(key.expiredDate, key.marzban.expiredDate)
  const hasDiscrepancy = statusMismatch || dateMismatch

  const trafficPercent = Math.min(
    (key.marzban.usedTrafficGb / key.marzban.totalTrafficGb) * 100,
    100,
  )

  const anyPending =
    enableMutation.isPending ||
    disableMutation.isPending ||
    restoreMutation.isPending

  return (
    <div className="space-y-6">
      {hasDiscrepancy && (
        <div className="flex items-center gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Обнаружено расхождение между нашей базой и Marzban. Проверьте данные ниже.
        </div>
      )}

      {/* Две колонки */}
      <div className="grid grid-cols-2 gap-4">
        {/* Левая — наши данные */}
        <div className="rounded-lg border bg-white p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Наши данные
          </h3>
          <div className="space-y-1">
            <div className="flex gap-2 rounded px-2 py-1 text-sm">
              <span className="w-32 shrink-0 text-gray-500">Сервер</span>
              <span className="font-medium">{key.serverName}</span>
            </div>
            <DiscrepancyRow label="Статус" hasDiscrepancy={statusMismatch}>
              <Badge variant={KEY_STATUS_VARIANT[key.status]}>
                {KEY_STATUS_LABEL[key.status]}
              </Badge>
            </DiscrepancyRow>
            <div className="flex gap-2 rounded px-2 py-1 text-sm">
              <span className="w-32 shrink-0 text-gray-500">Выдан</span>
              <span className="font-medium">{formatDate(key.issuedDate)}</span>
            </div>
            <DiscrepancyRow label="Истекает" hasDiscrepancy={dateMismatch}>
              {formatDate(key.expiredDate)}
            </DiscrepancyRow>
          </div>
        </div>

        {/* Правая — Marzban live */}
        <div className="rounded-lg border bg-white p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Marzban (live)
          </h3>
          <div className="space-y-1">
            <DiscrepancyRow label="Статус" hasDiscrepancy={statusMismatch}>
              {MARZBAN_STATUS_LABEL[key.marzban.status]}
            </DiscrepancyRow>
            <DiscrepancyRow label="Истекает" hasDiscrepancy={dateMismatch}>
              {formatDate(key.marzban.expiredDate)}
            </DiscrepancyRow>
            <div className="flex gap-2 rounded px-2 py-1 text-sm">
              <span className="w-32 shrink-0 text-gray-500">Трафик</span>
              <div className="flex-1 space-y-1">
                <span className="font-medium tabular-nums">
                  {key.marzban.usedTrafficGb.toFixed(1)} / {key.marzban.totalTrafficGb} ГБ
                </span>
                <Progress value={trafficPercent} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Действия */}
      <div className="flex flex-wrap gap-2">
        {key.status === 'active' ? (
          <Button variant="outline" size="sm" disabled={anyPending} onClick={handleDisable}>
            Отключить
          </Button>
        ) : key.status === 'disabled' ? (
          <Button variant="outline" size="sm" disabled={anyPending} onClick={handleEnable}>
            Включить
          </Button>
        ) : null}

        <Button variant="outline" size="sm" onClick={() => setExtendOpen(true)}>
          Продлить бесплатно
        </Button>

        {hasDiscrepancy && (
          <Button variant="outline" size="sm" disabled={anyPending} onClick={handleRestore}>
            Восстановить ключ
          </Button>
        )}
      </div>

      {/* Связанный заказ */}
      {key.linkedOrderId && (
        <div className="text-sm">
          <span className="text-gray-500">Связанный заказ: </span>
          <Link
            to={`/orders/${key.linkedOrderId}`}
            className="text-blue-600 hover:underline"
          >
            Открыть заказ
          </Link>
        </div>
      )}

      {/* Ссылка на пользователя */}
      <div className="text-sm">
        <span className="text-gray-500">Пользователь: </span>
        <Link
          to={`/users/${key.userId}`}
          className="text-blue-600 hover:underline"
        >
          {user ? formatFullName(user.firstName, user.lastName) : `#${key.userId}`}
        </Link>
      </div>

      <ConfirmDialog
        dialogState={dialogState}
        handleConfirm={handleConfirm}
        handleCancel={handleCancel}
      />

      <ExtendKeyDialog
        open={extendOpen}
        isPending={extendMutation.isPending}
        onClose={() => setExtendOpen(false)}
        onConfirm={(duration) => extendMutation.mutate(duration)}
      />
    </div>
  )
}
