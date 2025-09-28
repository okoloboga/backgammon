import { Room, Client } from '@colyseus/core';
import { Logger } from '@nestjs/common';
import { GameState, Point } from '../schemas/GameState';
import { LobbyService } from '../services/lobby.service';
import { RoomInfo } from '../types';

interface VirtualBoard {
  points: Map<string, { player: string; checkers: number }>;
  bar: { white: number; black: number };
}

interface Move {
  from: number | 'bar';
  to: number | 'off';
  die: number;
}

interface BackgammonRoomOptions {
  roomName?: string;
  createdBy?: string;
  betAmount?: number;
  currency?: string;
  lobbyService: LobbyService;
}

export class BackgammonRoom extends Room<GameState> {
  private readonly logger = new Logger(BackgammonRoom.name);
  private possibleMoves: Move[][] = [];
  private roomInfo: RoomInfo | null = null;
  private lobbyService: LobbyService;

  onCreate(options: BackgammonRoomOptions) {
    const safeOptions = {
      roomName: options.roomName,
      createdBy: options.createdBy,
      betAmount: options.betAmount,
      currency: options.currency,
    };
    this.logger.log(
      `--- BackgammonRoom CREATED with safe options: ${JSON.stringify(
        safeOptions,
      )}`,
    );
    this.setState(new GameState());
    this.setupBoard();

    // Получаем LobbyService из опций
    this.lobbyService = options.lobbyService;

    // Сохраняем информацию о комнате
    this.roomInfo = {
      roomId: this.roomId,
      roomName: options.roomName || `Game ${this.roomId.slice(0, 8)}`,
      playersCount: 0,
      maxPlayers: 2,
      status: 'waiting',
      createdBy: options.createdBy || 'unknown',
      betAmount: options.betAmount || 0,
      currency: options.currency || 'TON',
      createdAt: Date.now(),
    };

    // Уведомляем лобби о создании комнаты
    // this.notifyLobby('add', this.roomInfo);

    this.onMessage('rollDice', (client) => this.handleRollDice(client));
    this.onMessage('move', (client, message: string) =>
      this.handleMove(client, message),
    );
  }

  onJoin(client: Client, _options: unknown) {
    this.logger.log(`--- Client ${client.sessionId} JOINED BackgammonRoom`);
    console.log(client.sessionId, 'joined!');
    const playerColor = this.state.players.size === 0 ? 'white' : 'black';
    this.state.players.set(client.sessionId, playerColor);

    // Обновляем информацию о количестве игроков
    if (this.roomInfo) {
      this.roomInfo.playersCount = this.state.players.size;
      // this.notifyLobby('update', this.roomInfo);
    }

    if (this.state.players.size === 2) {
      this.state.currentPlayer = 'white';
      if (this.roomInfo) {
        this.roomInfo.status = 'playing';
        // this.notifyLobby('update', this.roomInfo);
      }
      void this.lock();
    }
  }

  onLeave(client: Client, _consented: boolean) {
    console.log(client.sessionId, 'left!');
    this.state.players.delete(client.sessionId);

    // Обновляем информацию о количестве игроков
    if (this.roomInfo) {
      this.roomInfo.playersCount = this.state.players.size;
      if (this.state.players.size === 0) {
        this.roomInfo.status = 'finished';
      } else {
        this.roomInfo.status = 'waiting';
      }
      // this.notifyLobby('update', this.roomInfo);
    }
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');

    // Уведомляем лобби об удалении комнаты
    if (this.roomInfo) {
      // this.notifyLobby('remove', this.roomInfo);
    }
  }

  setupBoard() {
    this.state.board.clear();

    // Классическая начальная расстановка для длинных нардов
    // Белые: все 15 шашек на пункте 24
    const whiteHead = new Point();
    whiteHead.player = 'white';
    whiteHead.checkers = 15;
    this.state.board.set('24', whiteHead);

    // Черные: все 15 шашек на пункте 1
    const blackHead = new Point();
    blackHead.player = 'black';
    blackHead.checkers = 15;
    this.state.board.set('1', blackHead);
  }

  handleRollDice(client: Client) {
    const playerColor = this.state.players.get(client.sessionId);

    // Валидация хода
    if (!playerColor) {
      console.error(`Player not found for session ${client.sessionId}`);
      return;
    }

    if (this.state.currentPlayer !== playerColor) {
      console.warn(`Player ${playerColor} tried to roll dice out of turn`);
      return;
    }

    if (this.state.dice.length > 0) {
      console.warn(
        `Player ${playerColor} tried to roll dice when dice already exist`,
      );
      return;
    }

    // Генерация костей
    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;

    console.log(`Player ${playerColor} rolled: ${die1}, ${die2}`);

    if (die1 === die2) {
      this.state.dice.push(die1, die1, die1, die1);
      console.log(`Double! Player gets 4 moves of ${die1}`);
    } else {
      this.state.dice.push(die1, die2);
    }

    this.generateAndSetPossibleMoves();

    if (this.possibleMoves.length === 0) {
      console.log(`No possible moves for ${playerColor}, ending turn`);
      this.endTurn();
    } else {
      console.log(
        `Generated ${this.possibleMoves.length} possible move sequences`,
      );
    }
  }

  handleMove(client: Client, moveString: string) {
    const player = this.state.players.get(client.sessionId);

    // Валидация игрока
    if (!player) {
      console.error(`Player not found for session ${client.sessionId}`);
      return;
    }

    if (player !== this.state.currentPlayer) {
      console.warn(`Player ${player} tried to move out of turn`);
      return;
    }

    // Валидация хода
    const moveIndex = this.state.possibleMoves.indexOf(moveString);
    if (moveIndex === -1) {
      console.error(`Invalid move received from ${player}:`, moveString);
      console.log('Available moves:', this.state.possibleMoves);
      return;
    }

    const moveSequence = this.possibleMoves[moveIndex];
    const opponent = player === 'white' ? 'black' : 'white';

    console.log(`Player ${player} executing moves:`, moveSequence);

    // Применение ходов
    for (const move of moveSequence) {
      const { from, to } = move;

      if (from === 'bar') {
        const currentBarCount = this.state.bar.get(player) ?? 0;
        if (currentBarCount <= 0) {
          console.error(
            `Player ${player} tried to move from bar but has no checkers there`,
          );
          return;
        }
        this.state.bar.set(player, currentBarCount - 1);
        console.log(`Moved checker from bar for ${player}`);
      } else {
        const fromPoint = this.state.board.get(from.toString());
        if (!fromPoint || fromPoint.checkers <= 0) {
          console.error(
            `Player ${player} tried to move from empty point ${from}`,
          );
          return;
        }
        fromPoint.checkers--;
        if (fromPoint.checkers === 0) {
          this.state.board.delete(from.toString());
        }
        console.log(`Moved checker from point ${from} for ${player}`);
      }

      if (to === 'off') {
        this.state.off.set(player, (this.state.off.get(player) ?? 0) + 1);
        console.log(`Player ${player} bore off a checker`);
      } else {
        const toStr = to.toString();
        const targetPoint = this.state.board.get(toStr);
        if (!targetPoint) {
          this.state.board.set(toStr, new Point({ player, checkers: 1 }));
        } else if (targetPoint.player === player) {
          targetPoint.checkers++;
        } else {
          // Съедание шашки противника
          targetPoint.player = player;
          targetPoint.checkers = 1;
          this.state.bar.set(opponent, (this.state.bar.get(opponent) ?? 0) + 1);
          console.log(`Player ${player} hit opponent's checker at point ${to}`);
        }
      }
    }

    // Проверка победы
    if (this.checkWinCondition(player)) {
      console.log(`Player ${player} won the game!`);
      this.state.winner = player;
      void this.lock();
    } else {
      this.endTurn();
    }
  }

  private generateAndSetPossibleMoves() {
    this.possibleMoves = this.calculatePossibleMoves();
    this.state.possibleMoves.clear();
    this.possibleMoves.forEach((seq) => {
      const moveString = seq.map((m) => `${m.from}-${m.to}`).join(',');
      this.state.possibleMoves.push(moveString);
    });
  }

  private checkWinCondition(player: string): boolean {
    return (this.state.off.get(player) ?? 0) === 15;
  }

  private calculatePossibleMoves(): Move[][] {
    const player = this.state.currentPlayer;
    if (!player) return [];
    const dice: number[] = Array.from(this.state.dice);

    const initialBoard: VirtualBoard = {
      points: new Map(),
      bar: {
        white: this.state.bar.get('white') ?? 0,
        black: this.state.bar.get('black') ?? 0,
      },
    };
    this.state.board.forEach((p, k) => {
      initialBoard.points.set(k, { player: p.player, checkers: p.checkers });
    });

    let allSequences = this.findMoveSequences(initialBoard, dice, player);

    if (allSequences.length === 0 || allSequences[0].length === 0) {
      return [];
    }

    // Принуждение: игрок ДОЛЖЕН использовать все доступные ходы
    const maxDiceUsed = Math.max(...allSequences.map((seq) => seq.length));
    allSequences = allSequences.filter((seq) => seq.length === maxDiceUsed);

    // Приоритет больших ходов: если можно использовать только один ход из двух,
    // нужно использовать больший
    if (maxDiceUsed === 1 && dice.length > 1) {
      const dieUsed = allSequences[0][0].die;
      const maxDie = Math.max(...dice);

      if (dieUsed < maxDie) {
        // Проверяем, можно ли использовать больший ход
        const maxDieMoves = this.findAllSingleMoves(
          initialBoard,
          maxDie,
          player,
        );
        if (maxDieMoves.length > 0) {
          // Больший ход возможен, но не используется - это недопустимо
          return [];
        }
      }
    }

    return allSequences;
  }

  private findMoveSequences(
    board: VirtualBoard,
    dice: number[],
    player: string,
  ): Move[][] {
    if (dice.length === 0) {
      return [[]];
    }

    const sequences: Move[][] = [];
    const uniqueDice = [...new Set(dice)];

    for (const die of uniqueDice) {
      const possibleSingleMoves = this.findAllSingleMoves(board, die, player);
      if (possibleSingleMoves.length > 0) {
        const remainingDice = [...dice];
        remainingDice.splice(remainingDice.indexOf(die), 1);

        for (const move of possibleSingleMoves) {
          const nextBoard = this.applyMove(board, move, player);
          const nextSequences = this.findMoveSequences(
            nextBoard,
            remainingDice,
            player,
          );
          for (const seq of nextSequences) {
            sequences.push([move, ...seq]);
          }
        }
      }
    }
    return sequences.length > 0 ? sequences : [[]];
  }

  private findAllSingleMoves(
    board: VirtualBoard,
    die: number,
    player: string,
  ): Move[] {
    const moves: Move[] = [];
    const direction = player === 'white' ? -1 : 1;
    const playerBarCount = board.bar[player as 'white' | 'black'] ?? 0;

    // Обработка шашек на баре
    if (playerBarCount > 0) {
      const from = player === 'white' ? 24 : 1;
      const to = from + die * direction;
      const targetPoint = board.points.get(to.toString());
      if (
        to >= 1 &&
        to <= 24 &&
        (!targetPoint ||
          targetPoint.player === player ||
          targetPoint.checkers <= 1)
      ) {
        moves.push({ from: 'bar', to, die });
      }
    } else {
      // Проверяем, можно ли снимать шашки (все в доме)
      let canBearOff = true;
      for (const [key, point] of board.points.entries()) {
        if (point.player === player) {
          const pointNum = parseInt(key);
          // Для белых дом: 1-6, для черных дом: 19-24
          if (player === 'white' ? pointNum > 6 : pointNum < 19) {
            canBearOff = false;
            break;
          }
        }
      }

      // Ищем возможные ходы
      for (const [key, point] of board.points.entries()) {
        if (point.player === player) {
          const from = parseInt(key);
          const to = from + die * direction;

          // Логика снятия шашек
          if (canBearOff) {
            if (to < 1 || to > 24) {
              // Можно снимать
              moves.push({ from, to: 'off', die });
            } else {
              // Проверяем, можно ли снять с текущей позиции
              const canBearOffFromHere = this.canBearOffFromPosition(
                from,
                die,
                player,
                board,
              );
              if (canBearOffFromHere) {
                moves.push({ from, to: 'off', die });
              }
            }
          }

          // Обычные ходы по доске
          if (to >= 1 && to <= 24) {
            const targetPoint = board.points.get(to.toString());
            if (
              !targetPoint ||
              targetPoint.player === player ||
              targetPoint.checkers <= 1
            ) {
              moves.push({ from, to, die });
            }
          }
        }
      }
    }
    return moves;
  }

  private canBearOffFromPosition(
    from: number,
    die: number,
    player: string,
    board: VirtualBoard,
  ): boolean {
    if (player === 'white') {
      // Для белых: дом 1-6
      if (from > 6) return false;

      // Если точное значение - можно снимать
      if (from === die) return true;

      // Если значение больше позиции, можно снять только самую дальнюю шашку
      if (die > from) {
        return this.isHighestChecker(from, player, board);
      }
    } else {
      // Для черных: дом 19-24
      if (from < 19) return false;

      // Если точное значение - можно снимать
      if (24 - from + 1 === die) return true;

      // Если значение больше, можно снять самую дальнюю шашку
      if (die > 24 - from + 1) {
        return this.isHighestChecker(from, player, board);
      }
    }

    return false;
  }

  private isHighestChecker(
    from: number,
    player: string,
    board: VirtualBoard,
  ): boolean {
    if (player === 'white') {
      // Для белых ищем самую дальнюю шашку (с наибольшим номером)
      for (let i = from + 1; i <= 6; i++) {
        const point = board.points.get(i.toString());
        if (point && point.player === player && point.checkers > 0) {
          return false; // Есть шашка дальше
        }
      }
    } else {
      // Для черных ищем самую дальнюю шашку (с наименьшим номером)
      for (let i = from - 1; i >= 19; i--) {
        const point = board.points.get(i.toString());
        if (point && point.player === player && point.checkers > 0) {
          return false; // Есть шашка дальше
        }
      }
    }
    return true; // Это самая дальняя шашка
  }

  private applyMove(
    board: VirtualBoard,
    move: Move,
    player: string,
  ): VirtualBoard {
    const newBoard: VirtualBoard = {
      points: new Map(board.points),
      bar: { ...board.bar },
    };
    const opponent = player === 'white' ? 'black' : 'white';
    const { from, to } = move;

    if (from === 'bar') {
      newBoard.bar[player]--;
    } else {
      const fromStr = from.toString();
      const fromPoint = newBoard.points.get(fromStr);
      if (fromPoint) {
        const newFromPoint = { ...fromPoint };
        newFromPoint.checkers--;
        if (newFromPoint.checkers === 0) {
          newBoard.points.delete(fromStr);
        } else {
          newBoard.points.set(fromStr, newFromPoint);
        }
      }
    }

    if (to !== 'off') {
      const toStr = to.toString();
      const targetPoint = newBoard.points.get(toStr);
      if (!targetPoint) {
        newBoard.points.set(toStr, { player, checkers: 1 });
      } else {
        const newTargetPoint = { ...targetPoint };
        if (newTargetPoint.player === player) {
          newTargetPoint.checkers++;
        } else {
          newTargetPoint.player = player;
          newTargetPoint.checkers = 1; // It was a blot
          newBoard.bar[opponent]++;
        }
        newBoard.points.set(toStr, newTargetPoint);
      }
    }
    return newBoard;
  }

  private endTurn() {
    this.state.dice.clear();
    this.state.possibleMoves.clear();
    this.possibleMoves = [];
    this.state.currentPlayer =
      this.state.currentPlayer === 'white' ? 'black' : 'white';
    console.log(`Turn ended. Current player: ${this.state.currentPlayer}`);
  }

  // Метод для уведомления лобби об изменениях
  private notifyLobby(action: 'add' | 'update' | 'remove', roomInfo: RoomInfo) {
    if (this.lobbyService) {
      this.lobbyService.notifyLobby(action, roomInfo);
    } else {
      console.warn('LobbyService not available');
    }
  }
}
