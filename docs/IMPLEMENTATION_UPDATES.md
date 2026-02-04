# Implementation Updates (Jan 2026)

Краткий список изменений, сделанных в процессе фикса проблем создания/подключения комнат и прод-конфигурации.

## 1) Исправление вылета из комнаты (RUBLE/TON)

### Симптомы
- Пользователь после создания комнаты "вылетал" в лобби.
- Комната оставалась в списке, но игроки в ней не фиксировались.
- В логах Colyseus `room.id` был `undefined`, при этом корректный id приходил как `room.roomId`.

### Причина
Клиентский код ожидал, что идентификатор комнаты находится в `room.id`, и:
- передавал `room.id` в `navigateToGame` (получался `undefined`)
- повторно пытался подключиться к комнате, вызывая `leave()` и разрывая соединение

### Исправления
- Использование `room.id || room.roomId` при навигации в игру
- Проверка текущей комнаты через `currentRoom.id || currentRoom.roomId`

Файлы:
- `client/src/screens/MainMenu/components/CreateRoomModal.jsx`
- `client/src/App.jsx`
- `client/src/screens/GameRoom/GameRoom.jsx`

## 2) Исправление mixed-content/CORS в проде

### Симптомы
- Браузер блокировал запросы вида `http://...` со страницы `https://...`
- CORS ошибки при обращении к API

### Причина
В проде использовались абсолютные http-URL (локальные/не TLS).

### Исправления
- В клиенте добавлен дефолтный расчет адресов через `window.location`:
  - API: `https://<host>/api`
  - Colyseus: `wss://<host>/api`
- Переменные `VITE_API_BASE_URL` и `VITE_COLYSEUS_ENDPOINT` остаются как override.

Файлы:
- `client/src/services/colyseusService.js`
- `client/src/services/tonTransactionService.js`
- `client/src/screens/MainMenu/components/CreateRoomModal.jsx`

## 3) Fix для verify-create (405 Not Allowed)

### Симптомы
- `POST https://backgammon.ruble.website/game-http/verify-create` → 405

### Причина
Запрос отправлялся без префикса `/api` после удаления `VITE_API_BASE_URL`.

### Исправления
- В `CreateRoomModal` дефолт для `API_BASE_URL` переключен на `${window.location.origin}/api`.

Файл:
- `client/src/screens/MainMenu/components/CreateRoomModal.jsx`

## 4) Итоговое поведение

- Создание комнаты в проде использует корректные https/wss адреса.
- Комната не "отваливается" сразу после создания.
- `verify-create` вызывается по верному адресу `/api/game-http/verify-create`.

