# Техническое задание: Серверная логика игры "Длинные нарды" для Telegram Mini Apps

## 1. Общие сведения

### 1.1 Описание игры
Длинные нарды (нард) - настольная игра для двух игроков на доске из 24 позиций (пунктов). Каждый игрок имеет 15 шашек. Цель игры - провести все свои шашки в дом и снять их с доски быстрее противника.

### 1.2 Технический стек
- Backend: NestJS + Colyseus
- Платформа: Telegram Mini Apps
- Количество игроков: 2

## 2. Игровое поле и начальная расстановка

### 2.1 Структура доски
```
Доска состоит из 24 пунктов, пронумерованных от 1 до 24:
- Пункты 1-6: дом белых
- Пункты 7-12: двор белых  
- Пункты 13-18: двор черных
- Пункты 19-24: дом черных

Визуализация нумерации:
13 14 15 16 17 18    19 20 21 22 23 24
12 11 10  9  8  7     6  5  4  3  2  1
```

### 2.2 Начальная позиция
```javascript
const INITIAL_POSITION = {
  white: {
    24: 15  // все 15 белых шашек на пункте 24
  },
  black: {
    1: 15   // все 15 черных шашек на пункте 1
  }
}
```

### 2.3 Направление движения
- Белые: движутся от пункта 24 к пункту 1 (по убыванию)
- Черные: движутся от пункта 1 к пункту 24 (по возрастанию)

## 3. Игровая механика

### 3.1 Состояния игры
```typescript
enum GameState {
  WAITING_FOR_PLAYER = 'waiting_for_player',
  INITIAL_ROLL = 'initial_roll',        // определение первого хода
  PLAYING = 'playing',
  FINISHED = 'finished'
}

enum TurnPhase {
  ROLLING_DICE = 'rolling_dice',
  MOVING_PIECES = 'moving_pieces',
  BEARING_OFF = 'bearing_off'
}
```

### 3.2 Определение первого хода
1. Каждый игрок бросает одну кость
2. У кого выпало больше - ходит первым
3. При равенстве - перебрасывают
4. Первый игрок использует оба значения (свое и противника) для первого хода

### 3.3 Броски костей
```typescript
interface DiceRoll {
  dice1: number;  // 1-6
  dice2: number;  // 1-6
  isDouble: boolean;  // true если dice1 === dice2
}

// При дубле игрок получает 4 хода вместо 2
function getAvailableMoves(diceRoll: DiceRoll): number[] {
  if (diceRoll.isDouble) {
    return [diceRoll.dice1, diceRoll.dice1, diceRoll.dice1, diceRoll.dice1];
  }
  return [diceRoll.dice1, diceRoll.dice2];
}
```

## 4. Правила ходов

### 4.1 Основные правила движения
1. **Обязательность использования всех ходов**: игрок ДОЛЖЕН использовать все доступные ходы, если это возможно
2. **Приоритет больших ходов**: если можно сделать только один ход из двух, нужно делать больший
3. **Запрет на съедение**: шашки противника съесть нельзя
4. **Запрет на занятые пункты**: нельзя ставить шашку на пункт, занятый противником

### 4.2 Валидация хода
```typescript
interface Move {
  from: number;    // исходный пункт (1-24)
  to: number;      // целевой пункт (1-24) или 0 для снятия
  diceValue: number; // использованное значение кости
}

function isValidMove(move: Move, gameState: GameState, player: Player): boolean {
  // 1. Проверка наличия шашки на исходном пункте
  if (!hasCheckerAt(move.from, player)) return false;
  
  // 2. Проверка правильности направления
  if (!isCorrectDirection(move.from, move.to, player)) return false;
  
  // 3. Проверка соответствия значению кости
  if (!isDiceValueCorrect(move.from, move.to, move.diceValue, player)) return false;
  
  // 4. Проверка, что целевой пункт не занят противником
  if (isOccupiedByOpponent(move.to, player)) return false;
  
  // 5. Для снятия - проверка условий снятия
  if (move.to === 0 && !canBearOff(move, gameState, player)) return false;
  
  return true;
}
```

### 4.3 Правила снятия шашек
Снятие разрешено только когда ВСЕ шашки игрока находятся в доме:

**Для белых (дом 1-6):**
- Можно снимать только с пунктов 1-6
- Если выпало число больше позиции самой дальней шашки, можно снять эту шашку

**Для черных (дом 19-24):**
- Можно снимать только с пунктов 19-24  
- Если выпало число больше, чем нужно до края, можно снять самую дальнюю шашку

```typescript
function canBearOff(move: Move, gameState: GameState, player: Player): boolean {
  // Все шашки должны быть в доме
  if (!allCheckersInHome(player, gameState)) return false;
  
  if (player.color === 'white') {
    // Для белых: дом это пункты 1-6
    if (move.from > 6) return false;
    
    // Если точное значение - можно снимать
    if (move.from === move.diceValue) return true;
    
    // Если значение больше позиции, можно снять только самую дальнюю шашку
    if (move.diceValue > move.from) {
      return isHighestChecker(move.from, player, gameState);
    }
  } else {
    // Для черных: дом это пункты 19-24
    if (move.from < 19) return false;
    
    // Если точное значение - можно снимать
    if (24 - move.from + 1 === move.diceValue) return true;
    
    // Если значение больше, можно снять самую дальнюю шашку
    if (move.diceValue > 24 - move.from + 1) {
      return isHighestChecker(move.from, player, gameState);
    }
  }
  
  return false;
}
```

## 5. Логика принуждения ходов

### 5.1 Обязательность использования всех ходов
```typescript
function validateTurnComplete(moves: Move[], availableMoves: number[], gameState: GameState, player: Player): boolean {
  // Игрок должен использовать все ходы, которые может
  const unusedMoves = getUnusedMoves(moves, availableMoves);
  
  for (const unusedMove of unusedMoves) {
    if (hasAnyValidMove(unusedMove, gameState, player)) {
      return false; // Есть неиспользованный ход, который можно сделать
    }
  }
  
  return true;
}
```

### 5.2 Приоритет большего хода
```typescript
function validateMoveChoice(moves: Move[], availableMoves: number[], gameState: GameState, player: Player): boolean {
  if (moves.length === 1 && availableMoves.length === 2 && availableMoves[0] !== availableMoves[1]) {
    const usedValue = moves[0].diceValue;
    const unusedValue = availableMoves.find(v => v !== usedValue);
    
    // Если использован меньший ход, проверить что больший невозможен
    if (usedValue < unusedValue) {
      return !hasAnyValidMove(unusedValue, gameState, player);
    }
  }
  
  return true;
}
```

## 6. Структуры данных (Colyseus Schema)

### 6.1 Основные схемы
Структуры данных реализованы с помощью `@colyseus/schema` для автоматической синхронизации с клиентом.

```typescript
import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';

// Описывает шашки на одном пункте (треугольнике)
export class Point extends Schema {
  @type('string') player: string; // 'white' или 'black'
  @type('number') checkers: number; // Количество шашек
}

// Основная схема состояния игры
export class GameState extends Schema {
  // Состояние доски: Map<пункт (1-24), Point>
  @type({ map: Point })
  board = new MapSchema<Point>();

  // Сбитые шашки: Map<цвет, количество>
  @type({ map: 'number' })
  bar = new MapSchema<number>({ white: 0, black: 0 });

  // Выведенные за доску шашки: Map<цвет, количество>
  @type({ map: 'number' })
  off = new MapSchema<number>({ white: 0, black: 0 });

  // ID текущего игрока (совпадает с sessionId)
  @type('string')
  currentPlayer: string;

  // Результат последнего броска костей
  @type(['number'])
  dice = new ArraySchema<number>();

  // ID победителя (null, если игра идет)
  @type('string')
  winner: string | null = null;

  // Массив возможных ходов для текущего игрока
  // (Это поле может быть реализовано через отправку сообщений, а не в состоянии)
  @type(['string'])
  possibleMoves = new ArrayArraySchema<string>();

  // Игроки в комнате: Map<sessionId, цвет>
  @type({ map: 'string' })
  players = new MapSchema<string>(); // e.g., { "sessionId1": "white", "sessionId2": "black" }
}
```

## 7. API методы (Colyseus)

### 7.1 Команды от клиента
```typescript
// Присоединение к игре
onMessage("join_game", (client, message) => {
  // Логика присоединения
});

// Готовность к игре
onMessage("player_ready", (client, message) => {
  // Установка готовности игрока
});

// Бросок костей
onMessage("roll_dice", (client, message) => {
  // Генерация случайных значений костей
});

// Выполнение ходов
onMessage("make_moves", (client, message: { moves: Move[] }) => {
  // Валидация и применение ходов
});

// Сдача игры
onMessage("surrender", (client, message) => {
  // Завершение игры досрочно
});
```

### 7.2 События для клиента
```typescript
// Изменение состояния игры
client.send("game_state_changed", gameState);

// Результат броска костей
client.send("dice_rolled", { diceRoll, availableMoves });

// Ходы выполнены
client.send("moves_applied", { moves, newBoardState });

// Ошибка валидации
client.send("move_error", { error: string, details: any });

// Игра завершена
client.send("game_finished", { winner, reason });
```

## 8. Алгоритмы валидации

### 8.1 Проверка возможности хода
```typescript
function canMakeMove(from: number, diceValue: number, player: Player, gameState: GameState): boolean {
  const to = player.color === 'white' ? from - diceValue : from + diceValue;
  
  // Проверка границ доски
  if (to < 1 || to > 24) {
    // Возможно снятие
    return canBearOffWith(from, diceValue, player, gameState);
  }
  
  // Проверка занятости пункта противником
  const targetPoint = gameState.board.points[to];
  if (targetPoint.owner && targetPoint.owner !== player.color) {
    return false;
  }
  
  return true;
}
```

### 8.2 Поиск всех возможных ходов
```typescript
function findAllPossibleMoves(diceValue: number, player: Player, gameState: GameState): Move[] {
  const possibleMoves: Move[] = [];
  
  for (let point = 1; point <= 24; point++) {
    const pointState = gameState.board.points[point];
    
    if (pointState.owner === player.color && pointState.checkers > 0) {
      if (canMakeMove(point, diceValue, player, gameState)) {
        const to = calculateDestination(point, diceValue, player);
        possibleMoves.push({
          from: point,
          to: to,
          diceValue: diceValue
        });
      }
    }
  }
  
  return possibleMoves;
}
```

## 9. Условия завершения игры

### 9.1 Победа
Игрок побеждает, когда снимает все 15 шашек с доски (`player.checkersBornOff === 15`).

### 9.2 Типы завершения
```typescript
enum GameEndReason {
  NORMAL_WIN = 'normal_win',      // обычная победа
  MARS = 'mars',                  // марс (противник не снял ни одной шашки)
  SURRENDER = 'surrender',        // сдача
  DISCONNECT = 'disconnect'       // отключение игрока
}
```

## 10. Дополнительные требования

### 10.1 Таймауты
- Время на ход: 60 секунд
- При превышении времени - автоматическая сдача
- Предупреждение за 10 секунд до окончания

### 10.2 Переподключение
- Возможность переподключиться к активной игре
- Сохранение состояния игры в случае разрыва соединения
- Таймаут ожидания переподключения: 300 секунд

### 10.3 Логирование
- Все ходы должны логироваться для возможности восстановления игры
- История игры сохраняется для статистики
- Логирование ошибок валидации

