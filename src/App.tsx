import { Routes, Route, Navigate } from 'react-router-dom'
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/users" replace />} />

          {/* Пользователи — вложенные роуты для правильных хлебных крошек */}
          <Route path="users" handle={{ breadcrumb: 'Пользователи' }}>
            <Route index element={<UsersPage />} />
            <Route
              path=":userId"
              element={<UserCard />}
              handle={{ breadcrumb: 'Пользователь' }}
            />
          </Route>

          <Route
            path="keys/:keyId"
            element={<KeyCard />}
            handle={{ breadcrumb: 'Ключ' }}
          />
          <Route
            path="orders/:orderId"
            element={<OrderCard />}
            handle={{ breadcrumb: 'Заказ' }}
          />
          <Route
            path="transactions/:transactionId"
            element={<TransactionCard />}
            handle={{ breadcrumb: 'Транзакция' }}
          />
          <Route
            path="tariffs"
            element={<TariffsPage />}
            handle={{ breadcrumb: 'Тарифы' }}
          />
          <Route
            path="change-password"
            element={<ChangePasswordPage />}
            handle={{ breadcrumb: 'Сменить пароль' }}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/users" replace />} />
    </Routes>
  )
}
