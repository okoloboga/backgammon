# Настройка сервера Backgammon

## Переменные окружения

Создайте файл `.env` в корне папки `server` со следующими переменными:

```bash
# Server Configuration
PORT=3000

# TON Configuration
TON_ENDPOINT=https://toncenter.com/api/v2/jsonRPC
TON_API_KEY=your_ton_api_key_here
TON_NETWORK=mainnet

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=backgammon

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
```

## Получение TON API ключа

1. Зарегистрируйтесь на [TON Center](https://toncenter.com/)
2. Получите API ключ в личном кабинете
3. Добавьте ключ в переменную `TON_API_KEY`

## Запуск сервера

```bash
# Установка зависимостей
pnpm install

# Запуск в режиме разработки
pnpm run start:dev

# Сборка и запуск в продакшене
pnpm run build
pnpm run start:prod
```

## API Endpoints

### Пользователи
- `POST /users` - Создание пользователя
- `GET /users` - Получение всех пользователей
- `GET /users/:id` - Получение пользователя по ID
- `GET /users/wallet/:address` - Получение пользователя по адресу кошелька
- `PUT /users/:id/balance` - Обновление баланса пользователя

### Транзакции
- `POST /transactions` - Создание транзакции
- `GET /transactions/:id` - Получение транзакции по ID
- `GET /transactions/user/:userId` - Получение транзакций пользователя
- `PUT /transactions/:id/status` - Обновление статуса транзакции
- `POST /transactions/verify-ton` - Проверка TON транзакции 