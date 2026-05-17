import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/features/auth/LoginPage'
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage'
import { UsersPage } from '@/features/users/UsersPage'
import { UserCard } from '@/features/users/UserCard'
import { KeyCard } from '@/features/keys/KeyCard'
import { OrderCard } from '@/features/orders/OrderCard'
import { TransactionCard } from '@/features/transactions/TransactionCard'
import { TariffsPage } from '@/features/tariffs/TariffsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/users" replace /> },
          {
            path: 'users',
            handle: { breadcrumb: 'Пользователи' },
            children: [
              { index: true, element: <UsersPage /> },
              { path: ':userId', element: <UserCard />, handle: { breadcrumb: 'Пользователь' } },
            ],
          },
          { path: 'keys/:keyId', element: <KeyCard />, handle: { breadcrumb: 'Ключ' } },
          { path: 'orders/:orderId', element: <OrderCard />, handle: { breadcrumb: 'Заказ' } },
          { path: 'transactions/:transactionId', element: <TransactionCard />, handle: { breadcrumb: 'Транзакция' } },
          { path: 'tariffs', element: <TariffsPage />, handle: { breadcrumb: 'Тарифы' } },
          { path: 'change-password', element: <ChangePasswordPage />, handle: { breadcrumb: 'Сменить пароль' } },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/users" replace /> },
])
