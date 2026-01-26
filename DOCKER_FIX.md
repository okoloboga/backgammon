# Docker Build Fix

## Исправленные проблемы

### 1. ❌ Cannot find module '../../../blockchain/build/Escrow/Escrow_Escrow'

**Причина**: Dockerfile не копировал скомпилированные файлы контракта в Docker образ.

**Решение**: Добавлена строка в `server/Dockerfile`:
```dockerfile
# Copy blockchain build files (needed for EscrowService types)
COPY blockchain/build/ ./blockchain/build/
```

### 2. ❌ Property 'equals' does not exist on type 'ExternalAddress'

**Причина**: `tx.inMessage.info?.src` имеет тип `Address | ExternalAddress`, но `ExternalAddress` не имеет метода `equals()`.

**Решение**: Добавлена проверка типа перед вызовом `equals()` в `server/src/ton/escrow.service.ts`:
```typescript
// БЫЛО:
if (!sender || !sender.equals(address)) continue;

// СТАЛО:
if (!sender || !(sender instanceof Address) || !sender.equals(address)) continue;
```

---

## Как пересобрать Docker образ

### Шаг 1: Убедись, что контракт скомпилирован

```bash
cd blockchain
npx blueprint build
```

Проверь, что файлы созданы:
```bash
ls blockchain/build/Escrow/Escrow_Escrow.ts
# Должен вывести путь к файлу
```

### Шаг 2: Остановить и удалить старые контейнеры

```bash
docker-compose down
```

### Шаг 3: Пересобрать backend образ

```bash
# Пересборка только backend
docker-compose build backend

# ИЛИ пересборка всех сервисов
docker-compose build
```

### Шаг 4: Запустить контейнеры

```bash
docker-compose up -d
```

### Шаг 5: Проверить логи

```bash
# Проверить, что backend запустился без ошибок
docker-compose logs backend -f
```

---

## Если сборка все еще не работает

### Проблема: blockchain/build/ не копируется

Проверь структуру проекта:
```bash
# Из корня проекта должна быть видна папка blockchain
ls -la blockchain/build/Escrow/

# Вывод должен показать Escrow_Escrow.ts и другие файлы
```

Если папки нет, скомпилируй контракт:
```bash
cd blockchain
npx blueprint build
cd ..
```

### Проблема: Ошибки TypeScript остались

Очисти Docker кеш и пересобери:
```bash
docker-compose down
docker system prune -a  # ОСТОРОЖНО: удалит все неиспользуемые Docker данные
docker-compose build --no-cache backend
docker-compose up -d
```

---

## Быстрая команда для пересборки

```bash
# Одна команда для всего
docker-compose down && docker-compose build backend && docker-compose up -d
```

---

## Проверка успешной сборки

После запуска проверь:

1. **Backend запущен**:
   ```bash
   curl http://localhost:3003/api
   # Должен вернуть JSON ответ
   ```

2. **Нет ошибок в логах**:
   ```bash
   docker-compose logs backend | grep -i error
   # Не должно быть ошибок компиляции TypeScript
   ```

3. **EscrowService инициализирован**:
   ```bash
   docker-compose logs backend | grep "EscrowService initialized"
   # Должно показать: EscrowService initialized. Mock mode: true/false
   ```

---

## Дополнительные исправления для production

Если планируешь деплоить в production, добавь в `.dockerignore`:

```
# .dockerignore
node_modules
dist
*.log
.env.local
.git
```

Это ускорит сборку Docker образа.
