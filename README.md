# Backgammon Online - TON Blockchain Game

Онлайн нарды со ставками, использующие TON блокчейн для депозитов и транзакций.

## Архитектура

Проект состоит из двух основных частей:

### Backend (NestJS)
- **Users Module** - управление пользователями и их балансами
- **Transactions Module** - обработка TON транзакций
- **TON Module** - интеграция с TON блокчейном
- **WebSocket** - для онлайн игры (Colyseus)

### Frontend (React + Vite)
- Современный UI для игры в нарды
- Интеграция с TON Connect для кошельков
- WebSocket соединение для онлайн игры

## Технологии

- **Backend**: NestJS, TypeScript, TON SDK
- **Frontend**: React, TypeScript, Vite
- **Blockchain**: TON (The Open Network)
- **Real-time**: WebSocket (Colyseus)
- **Database**: PostgreSQL (планируется)

## Быстрый старт

### 1. Клонирование и установка зависимостей

```bash
git clone <repository-url>
cd backgammon
pnpm install
```

### 2. Настройка переменных окружения

Создайте файл `.env` в папке `server`:

```bash
# Скопируйте .env.example и заполните своими значениями
cp server/.env.example server/.env
```

### 3. Запуск сервера

```bash
cd server
pnpm run start:dev
```

### 4. Запуск клиента

```bash
cd client
pnpm run dev
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

### TON
- `GET /ton/network` - Информация о сети
- `GET /ton/wallet/:address/balance` - Баланс кошелька
- `GET /ton/wallet/:address/history` - История транзакций
- `POST /ton/verify` - Проверка TON транзакции
- `POST /ton/wallet/create` - Создание нового кошелька

## Разработка

### Структура проекта

```
backgammon/
├── client/                 # React frontend
├── server/                 # NestJS backend
│   ├── src/
│   │   ├── users/         # Модуль пользователей
│   │   ├── transactions/  # Модуль транзакций
│   │   ├── ton/           # TON интеграция
│   │   └── config/        # Конфигурация
│   └── Dockerfile
├── docker-compose.yml      # Docker конфигурация
└── README.md
```

### Добавление новых модулей

1. Создайте папку для модуля в `server/src/`
2. Создайте `*.module.ts`, `*.service.ts`, `*.controller.ts`
3. Добавьте модуль в `app.module.ts`

## TON Интеграция

Проект использует TON SDK для:
- Проверки транзакций
- Получения балансов кошельков
- Создания новых кошельков
- Отправки транзакций

### Получение TON API ключа

1. Зарегистрируйтесь на [TON Center](https://toncenter.com/)
2. Получите API ключ в личном кабинете
3. Добавьте ключ в переменную `TON_API_KEY`

## Лицензия

MIT 