# Архитектура фронтенда

## Стек

| Слой | Библиотека | Версия |
|---|---|---|
| Сборка | Vite | ^6 |
| Язык | TypeScript | ^5.7 |
| Фреймворк | React | ^19 |
| Роутинг | React Router | ^6 |
| Серверный стейт | TanStack Query | ^5 |
| Формы | React Hook Form + Zod | ^7 / ^3 |
| HTTP | ky | ^1 |
| UI-компоненты | shadcn/ui + Tailwind CSS | v4 |

---

## Структура папок

```
src/
├── api/              # Функции запросов, сгруппированные по сущности
│   ├── auth.ts
│   ├── users.ts
│   ├── keys.ts
│   ├── orders.ts
│   ├── transactions.ts
│   └── tariffs.ts
│
├── components/
│   ├── layout/       # AppShell, Sidebar, Header, Breadcrumbs, ProtectedRoute
│   └── ui/           # shadcn/ui компоненты (генерируются CLI)
│
├── features/         # Один каталог на роут/экран
│   ├── auth/         # LoginPage, ChangePasswordPage
│   ├── users/        # UsersPage, UserCard (+ вкладки внутри)
│   ├── keys/         # KeyCard
│   ├── orders/       # OrderCard
│   ├── transactions/ # TransactionCard
│   └── tariffs/      # TariffsPage
│
├── hooks/            # Переиспользуемые хуки (useConfirmDialog)
│
├── lib/
│   ├── http.ts       # ky-инстанс с перехватчиком 401
│   ├── formatters.ts # Форматирование дат, сумм, tariffDuration → строка
│   ├── constants.ts  # Маппинги статусов → лейбл и цвет
│   └── utils.ts      # cn() для shadcn/ui
│
├── types/
│   └── index.ts      # Все TypeScript-типы
│
├── App.tsx           # Роутинг
└── main.tsx          # Провайдеры: QueryClient, BrowserRouter
```

---

## Ключевые паттерны

### Защита роутов

`<ProtectedRoute>` вызывает `GET /api/auth/me` при старте:
- `200` → рендерит `<Outlet />`
- Ошибка → `<Navigate to="/login" />`

Все защищённые роуты вложены внутрь `<ProtectedRoute>` → `<AppShell>`.

### HTTP-клиент

`src/lib/http.ts` экспортирует инстанс `api` (ky) с двумя настройками:
1. `prefixUrl` из `VITE_API_URL`
2. `credentials: "include"` на всех запросах
3. Хук `afterResponse`: при `401` → редирект на `/login`

`getMe()` использует отдельный вызов без этого хука (чтобы `ProtectedRoute` мог обработать 401 сам).

### Серверный стейт

Все данные хранятся в TanStack Query. После мутации — `queryClient.invalidateQueries(...)`:

```ts
// Пример: после блокировки пользователя
await blockUser(userId)
queryClient.invalidateQueries({ queryKey: ['user', userId] })
```

Имя администратора берётся из кеша `['me']` — переиспользуется в `Header` без повторного запроса.

### Диалоги подтверждения

Все деструктивные действия используют `useConfirmDialog`:

```ts
const { confirm, dialogState, handleConfirm, handleCancel } = useConfirmDialog()

async function handleBlock() {
  const ok = await confirm('Пользователь будет заблокирован. Продолжить?')
  if (!ok) return
  await blockUser(userId)
}
```

### Маппинги статусов

Все лейблы и цвета бейджей — в `src/lib/constants.ts`. Компоненты не содержат switch/if по статусам:

```ts
// Правильно
<Badge>{ORDER_STATUS_LABEL[order.status]}</Badge>

// Неправильно
{order.status === 'issued' ? 'Выдан' : order.status === 'paid' ? 'Оплачен' : ...}
```

### Форматирование

Все функции форматирования — в `src/lib/formatters.ts`. Компоненты не форматируют данные самостоятельно.

---

## Роуты

| Путь | Компонент | Приоритет |
|---|---|---|
| `/login` | `LoginPage` | P1 |
| `/users` | `UsersPage` | P1 |
| `/users/:userId` | `UserCard` | P1 |
| `/keys/:keyId` | `KeyCard` | P1 |
| `/orders/:orderId` | `OrderCard` | P1 |
| `/change-password` | `ChangePasswordPage` | P1 |
| `/transactions/:transactionId` | `TransactionCard` | P2 |
| `/tariffs` | `TariffsPage` | P2 |

---

## Переменные окружения

| Переменная | Описание |
|---|---|
| `VITE_API_URL` | Базовый URL API, например `http://localhost:5000` |

Создай `.env` из `.env.example` перед запуском.
