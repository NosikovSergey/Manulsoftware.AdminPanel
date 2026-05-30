export const ORDER_STATUS_LABEL: Record<string, string> = {
  created: 'Создан',
  paid: 'Оплачен',
  issued: 'Выдан',
  expired: 'Истёк',
  canceled: 'Отменён',
  refunded: 'Возвращён',
}

export const ORDER_STATUS_VARIANT: Record<string, 'secondary' | 'info' | 'success' | 'error' | 'warning'> = {
  created: 'secondary',
  paid: 'info',
  issued: 'success',
  expired: 'secondary',
  canceled: 'error',
  refunded: 'warning',
}

export const KEY_STATUS_LABEL: Record<string, string> = {
  active: 'Активен',
  disabled: 'Отключён',
  expired: 'Истёк',
}

export const KEY_STATUS_VARIANT: Record<string, 'success' | 'error' | 'secondary'> = {
  active: 'success',
  disabled: 'error',
  expired: 'secondary',
}

export const MARZBAN_STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  disabled: 'Disabled',
  expired: 'Expired',
  limited: 'Limited (трафик исчерпан)',
}

export const TRANSACTION_TYPE_LABEL: Record<string, string> = {
  deposit: 'Пополнение',
  withdrawal: 'Списание',
  refund: 'Возврат',
  rollback: 'Откат пополнения',
}

export const TRANSACTION_STATUS_LABEL: Record<string, string> = {
  pending: 'В обработке',
  committed: 'Проведена',
  canceled: 'Отменена',
  refunded: 'Возвращена',
}

export const USER_STATUS_LABEL: Record<string, string> = {
  active: 'Активен',
  banned: 'Заблокирован',
}

export const TARIFF_DURATION_OPTIONS = [
  { value: 'OneMonth', label: '1 месяц' },
  { value: 'ThreeMonths', label: '3 месяца' },
  { value: 'SixMonths', label: '6 месяцев' },
  { value: 'OneYear', label: '1 год' },
] as const
