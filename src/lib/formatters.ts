export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatAmount(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ₽`
}

export function formatFullName(firstName: string, lastName: string | null): string {
  return [firstName, lastName].filter(Boolean).join(' ')
}

export const TARIFF_DURATION_LABEL: Record<string, string> = {
  OneMonth: '1 месяц',
  ThreeMonths: '3 месяца',
  SixMonths: '6 месяцев',
  OneYear: '1 год',
}
