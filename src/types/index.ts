export type TariffDuration = 'OneMonth' | 'ThreeMonths' | 'SixMonths' | 'OneYear'

export type UserStatus = 'active' | 'banned'

export type OrderStatus = 'created' | 'paid' | 'issued' | 'expired' | 'canceled' | 'refunded'

export type KeyStatus = 'active' | 'disabled' | 'expired'

export type MarzbanStatus = 'active' | 'on_hold' | 'expired' | 'limited'

export type TransactionVisualType = 'deposit' | 'withdrawal' | 'refund' | 'rollback'

export type TransactionStatus = 'pending' | 'committed' | 'canceled' | 'refunded'

export interface AdminMe {
  name: string
}

export interface User {
  id: number
  firstName: string
  lastName: string | null
  username: string | null
  balance: number
  status: UserStatus
  dateJoined: string
  lastActive?: string
  isAdmin?: boolean
  isTrialUsed?: boolean
}

export interface MarzbanKeyData {
  status: MarzbanStatus
  usedTrafficGb: number
  totalTrafficGb: number
  expiredDate: string
}

export interface Key {
  id: number
  userId: number
  serverName: string
  status: KeyStatus
  issuedDate: string
  expiredDate: string
  linkedOrderId: string | null
  marzban: MarzbanKeyData
}

export interface KeySummary {
  id: number
  serverName: string
  status: KeyStatus
  expiredDate: string
}

export interface Order {
  id: string
  userId: number
  tariffDuration: TariffDuration
  amount: number
  status: OrderStatus
  createdAt: string
  expiredAt: string | null
  keyId: number | null
}

export interface OrderSummary {
  id: string
  tariffDuration: TariffDuration
  status: OrderStatus
  createdAt: string
  expiredAt: string | null
}

export interface Transaction {
  id: string
  userId: number
  date: string
  visualType: TransactionVisualType
  amount: number
  status: TransactionStatus
}

export interface TransactionSummary {
  id: string
  date: string
  visualType: TransactionVisualType
  amount: number
  status: TransactionStatus
}

export interface Tariff {
  id: number
  duration: TariffDuration
  price: number
  isEnabled: boolean
  isBestChoice: boolean
}
