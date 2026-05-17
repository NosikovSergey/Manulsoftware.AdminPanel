# Задачи бэкенда: Панель администратора

Проект: `VpnBot.Api` (ASP.NET Core)  
Все сервисы и репозитории уже существуют в `VpnBot.Application` и `VpnBot.Adapter` — нужно подключить и дописать недостающие методы.

---

## P1

---

### Задача 1.1 — Инфраструктура проекта VpnBot.Api

Настроить проект с нуля:
- Подключить зависимости на `VpnBot.Application`, `VpnBot.Adapter`, `VpnBot.Domain`
- Зарегистрировать все существующие сервисы и репозитории (по аналогии с `VpnBot.TelegramBot.Shell`)
- Подключить PostgreSQL (Dapper + Npgsql)
- Подключить Marzban-клиент
- Настроить Swagger

---

### Задача 1.2 — Аутентификация

**Новая таблица в БД:** `AdminUsers`
```
Id        uuid
Login     varchar
Password  varchar  -- хранить хэш (bcrypt)
Name      varchar
```

Применить через миграцию в `VpnBot.Migrator`. Первые аккаунты создаются вручную через миграцию-seed.

**Сессия:** cookie-based через `ISession` ASP.NET Core. Время жизни — 24 часа с момента входа.

**Endpoints:**

`POST /api/auth/login`
```
Request:  { "login": "string", "password": "string" }
Response 200: { "name": "string" }
Response 401: { "error": "Неверный логин или пароль" }
```

`POST /api/auth/logout`
```
Response 200: {}
```

`GET /api/auth/me`
```
Response 200: { "name": "string" }
Response 401: {}
```
Используется фронтендом для проверки активной сессии при загрузке приложения.

`POST /api/auth/change-password`
```
Request:  { "currentPassword": "string", "newPassword": "string" }
Response 200: {}
Response 400: { "error": "Неверный текущий пароль" | "Пароль не соответствует требованиям" }
```

**Требования к паролю** (валидируются на бэкенде при смене и создании аккаунта):
- Минимум 8 символов
- Минимум одна заглавная буква
- Минимум одна цифра

**Middleware:** все `/api/*` кроме `/api/auth/login` защищены — возвращают `401` если сессия отсутствует.

---

### Задача 1.3 — Поиск пользователей

**Новый метод в `IUsersRepository`:**
```
Task<IEnumerable<UserModel>> SearchAsync(string query, int limit, int offset, CancellationToken ct)
```
Поиск по `Username`, `FirstName`, `LastName` (ILIKE), либо точное совпадение по `UserId`.

**Endpoint:**

`GET /api/users?query=&page=1&pageSize=20`
```
Response 200:
[
  {
    "id": 123456789,
    "firstName": "Иван",
    "lastName": "Петров",
    "username": "ivanpetrov",
    "balance": 250.00,
    "status": "active",  // "active" | "banned"
    "dateJoined": "2024-01-15T10:00:00Z"
  }
]
```

---

### Задача 1.4 — Карточка пользователя

**Новые методы:**
- `IUsersRepository.SetStatusAsync(long userId, string status, CancellationToken ct)` — для блокировки
- `IUsersService.BlockUserAsync / UnblockUserAsync` — выставляет `Status = "banned"` / `"active"`
- `IUsersService.ResetTrialAsync` — сбрасывает флаг `IsTrialUsed = false`

**Endpoints:**

`GET /api/users/{userId}`
```
Response 200:
{
  "id": 123456789,
  "firstName": "Иван",
  "lastName": "Петров",
  "username": "ivanpetrov",
  "dateJoined": "2024-01-15T10:00:00Z",
  "lastActive": "2024-05-17T08:30:00Z",
  "balance": 250.00,
  "status": "active",
  "isAdmin": false,
  "isTrialUsed": true
}
```

`GET /api/users/{userId}/keys`
```
Response 200:
[
  {
    "id": 42,
    "serverName": "Netherlands #1",
    "status": "active",   // "active" | "disabled" | "expired"
    "expiredDate": "2026-06-12T00:00:00Z"
  }
]
```
Статус вычисляется на бэкенде из `IsEnabled` + `ExpiredDate`.

`GET /api/users/{userId}/orders?page=1&pageSize=20`
```
Response 200:
[
  {
    "id": "uuid",
    "tariffDuration": "OneMonth",
    "status": "issued",  // "created"|"paid"|"issued"|"expired"|"canceled"|"refunded"
    "createdAt": "2026-05-12T10:00:00Z",
    "expiredAt": "2026-06-12T00:00:00Z"
  }
]
```

`GET /api/users/{userId}/transactions?page=1&pageSize=20`
```
Response 200:
[
  {
    "id": "uuid",
    "date": "2026-05-12T10:00:00Z",
    "visualType": "deposit",  // "deposit"|"withdrawal"|"refund"|"rollback"
    "amount": 299.00,
    "status": "committed"     // "pending"|"committed"|"canceled"|"refunded"
  }
]
```

`POST /api/users/{userId}/block`
`POST /api/users/{userId}/unblock`
`POST /api/users/{userId}/grant-admin`
`POST /api/users/{userId}/revoke-admin`
`POST /api/users/{userId}/reset-trial`
```
Все: Response 200: {}  |  Response 404: { "error": "Пользователь не найден" }
```

### Задача 1.5 — Карточка ключа

**Новые методы:**
- `IAccessKeysService.EnableKeyAsync(long keyId, CancellationToken ct)` — включить ключ в Marzban
- `IAccessKeysService.ExtendKeyAsync(long keyId, TariffDuration duration, CancellationToken ct)` — сдвинуть дату истечения без создания заказа

**Endpoints:**

`GET /api/keys/{keyId}`
```
Response 200:
{
  "id": 42,
  "userId": 123456789,
  "serverName": "Netherlands #1",
  "status": "active",
  "issuedDate": "2026-05-12T00:00:00Z",
  "expiredDate": "2026-06-12T00:00:00Z",
  "linkedOrderId": "uuid",
  "marzban": {
    "status": "active",  // "active"|"on_hold"|"expired"|"limited"
    "usedTrafficGb": 45.2,
    "totalTrafficGb": 300.0,
    "expiredDate": "2026-06-12T00:00:00Z"
  }
}
```
`linkedOrderId` — находится через `Orders WHERE KeyId = @keyId AND Status = Issued`.

`POST /api/keys/{keyId}/enable`
`POST /api/keys/{keyId}/disable`
```
Response 200: {}
```

`POST /api/keys/{keyId}/extend`
```
Request:  { "duration": "OneMonth" }  // OneMonth|ThreeMonths|SixMonths|OneYear
Response 200: { "newExpiredDate": "2026-07-12T00:00:00Z" }
```

`POST /api/keys/{keyId}/restore`
```
Response 200: {}
```

---

### Задача 1.6 — Карточка заказа

**Новый метод в `IOrdersRepository`:**
```
Task<IEnumerable<OrderModel>> GetAllByUserIdAsync(long userId, int limit, int offset, CancellationToken ct)
```
Все статусы, не только Issued.

Сумму оплаты получать через `OrderProcessingSession.TransactionId` → `Transactions.Amount`.

**Endpoints:**

`GET /api/orders/{orderId}`
```
Response 200:
{
  "id": "uuid",
  "userId": 123456789,
  "tariffDuration": "OneMonth",
  "amount": 299.00,
  "status": "issued",
  "createdAt": "2026-05-12T10:00:00Z",
  "expiredAt": "2026-06-12T00:00:00Z",
  "keyId": 42  // null если ключ не был выдан
}
```

`POST /api/orders/{orderId}/cancel-and-refund`
```
Response 200: {}
```
Логика: определить состояние сессии → если KeyId выставлен, отключить ключ в Marzban → если транзакция Pending, отменить (снять холд); если Committed, вернуть (рефанд) → отменить заказ.

`POST /api/orders/{orderId}/refund`
```
Response 200: {}
```
Логика: отключить ключ в Marzban → вернуть транзакцию (рефанд) → пометить заказ как Refunded.

---

## P2

---

### Задача 2.1 — Карточка транзакции

`GET /api/transactions/{transactionId}`
```
Response 200:
{
  "id": "uuid",
  "userId": 123456789,
  "date": "2026-05-12T10:00:00Z",
  "visualType": "deposit",
  "amount": 299.00,
  "status": "committed"
}
```

`POST /api/transactions/{transactionId}/rollback`
```
Response 200: {}
Response 400: { "error": "Транзакция не может быть откатана" }
```
Применимо только к Deposit + Committed. Вызывает `RefundTransactionAsync`.

---

### Задача 2.2 — Управление тарифами

**Новые методы в `ITariffsRepository`:**
```
Task<ICollection<TarifModel>> GetAllForAdminAsync(CancellationToken ct)  // включая IsEnabled=false, без IsTrial
Task UpdateAsync(long id, decimal? price, bool? isEnabled, bool? isBestChoice, CancellationToken ct)
```

**Endpoints:**

`GET /api/tariffs`
```
Response 200:
[
  {
    "id": 1,
    "duration": "OneMonth",
    "price": 299.00,
    "isEnabled": true,
    "isBestChoice": false
  }
]
```

`PATCH /api/tariffs/{tariffId}`
```
Request:  { "price": 349.00, "isEnabled": true, "isBestChoice": false }  // все поля опциональны
Response 200:
{
  "id": 1,
  "duration": "OneMonth",
  "price": 349.00,
  "isEnabled": true,
  "isBestChoice": false
}
```

---

## Изменения в боте (параллельно с P1)

**`AuthorizationMiddleware`** — добавить проверку поля `Status` после загрузки пользователя:
```
if (user.Status == "banned") → прервать pipeline, отправить сообщение о блокировке
```
