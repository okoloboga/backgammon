import { Room, Client } from '@colyseus/core';
import { Logger } from '@nestjs/common';
import { GameState, Point, PlayerProfile } from '../schemas/GameState';
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

interface JoinOptions {
  username?: string;
  avatar?: string;
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
    this.notifyLobby('add', this.roomInfo);

    this.onMessage('rollDice', (client) => this.handleRollDice(client));
    this.onMessage('move', (client, message: string) =>
      this.handleMove(client, message),
    );
  }

  onJoin(client: Client, _options: JoinOptions) {
    this.logger.log(`--- Client ${client.sessionId} JOINED BackgammonRoom`);
    console.log(client.sessionId, 'joined!');
    const { username = 'Player', avatar = '' } = _options || {};

    // Логируем состояние до изменений
    this.logger.log(`--- State before join: players.size=${this.state.players.size}, currentPlayer=${this.state.currentPlayer}`);

    const playerColor = this.state.players.size === 0 ? 'white' : 'black';
    this.state.players.set(client.sessionId, playerColor);

    const profile = new PlayerProfile();
    profile.username = username;
    profile.avatar = avatar;
    this.state.playerProfiles.set(client.sessionId, profile);

    // Логируем состояние после изменений
    this.logger.log(`--- State after join: players.size=${this.state.players.size}, currentPlayer=${this.state.currentPlayer}, playerColor=${playerColor}`);

    // Устанавливаем currentPlayer для первого игрока
    if (this.state.players.size === 1) {
      this.state.currentPlayer = playerColor;
      this.logger.log(`--- Set currentPlayer to ${playerColor} for first player`);
    }

    // Обновляем информацию о количестве игроков
    if (this.roomInfo) {
      this.roomInfo.playersCount = this.state.players.size;
      this.notifyLobby('update', this.roomInfo);
    }

    if (this.state.players.size === 2) {
      if (this.roomInfo) {
        this.roomInfo.status = 'playing';
        this.notifyLobby('update', this.roomInfo);
      }
      void this.lock();
    }

    // Финальное логирование состояния
    this.logger.log(`--- Final state: players.size=${this.state.players.size}, currentPlayer=${this.state.currentPlayer}, board.size=${this.state.board.size}`);

    // Принудительно отправляем состояние клиенту
    this.logger.log('--- Broadcasting state to client');
    // Попробуем отправить JSON состояние
    this.broadcast('state_update', {
      board: Array.from(this.state.board.entries()),
      bar: Array.from(this.state.bar.entries()),
      off: Array.from(this.state.off.entries()),
      currentPlayer: this.state.currentPlayer,
      dice: Array.from(this.state.dice),
      winner: this.state.winner,
      possibleMoves: Array.from(this.state.possibleMoves),
      players: Array.from(this.state.players.entries()),
      playerProfiles: Array.from(this.state.playerProfiles.entries()).map(
        ([sessionId, profile]) => [
          sessionId,
          { username: profile.username, avatar: profile.avatar },
        ],
      ),
      turnCount: this.state.turnCount,
      turnMovesFromHead: this.state.turnMovesFromHead,
    });
  }

  async onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, 'left!');

    const wasPlaying = this.state.players.size === 2;
    const leavingPlayerColor = this.state.players.get(client.sessionId);

    this.state.players.delete(client.sessionId);
    this.state.playerProfiles.delete(client.sessionId);

    if (wasPlaying && leavingPlayerColor) {
      // Game was active, the other player wins
      const winnerColor = leavingPlayerColor === 'white' ? 'black' : 'white';
      this.state.winner = winnerColor;

      // Find the winning client to notify them
      const winnerClient = this.clients.find(c => c.sessionId !== client.sessionId);

      if (winnerClient) {
        winnerClient.send('opponent_left', { message: 'Opponent has left the game. You win!' });
        // Disconnect the winner after a short delay to allow them to see the message
        this.clock.setTimeout(() => {
          winnerClient.leave();
        }, 3000); // 3 seconds delay
      }

      if (this.roomInfo) {
        this.roomInfo.status = 'finished';
        this.notifyLobby('update', this.roomInfo);
      }

    } else if (this.roomInfo) {
      // Player left before game started
      this.roomInfo.playersCount = this.state.players.size;
      this.roomInfo.status = this.state.players.size === 0 ? 'finished' : 'waiting';
      this.notifyLobby('update', this.roomInfo);
    }
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');

    // Уведомляем лобби об удалении комнаты
    if (this.roomInfo) {
      this.notifyLobby('remove', this.roomInfo);
    }
  }

  setupBoard() {
    this.logger.log('--- Setting up board...');
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

    this.logger.log(`--- Board setup complete. Board size: ${this.state.board.size}`);
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
      const { from, to } = moveData;
      const fromNum = from === 'bar' ? 'bar' : Number(from);
      const toNum = to === 'off' ? 'off' : Number(to);

      // Ищем подходящую последовательность в this.possibleMoves
      // Мы ищем последовательность, которая начинается с указанного хода
      const matchingSequenceIndex = this.possibleMoves.findIndex(
        (seq) =>
          seq.length > 0 && seq[0].from === fromNum && seq[0].to === toNum,
      );

      if (matchingSequenceIndex === -1) {
        console.error(`Invalid move attempt by ${player}: ${from}->${to}`);
        // Можно отправить сообщение об ошибке клиенту
        return;
      }

      const sequence = this.possibleMoves[matchingSequenceIndex];
      const move = sequence[0]; // Берем первый ход
      const dieUsed = move.die;

      // Применяем ход к состоянию
      // Логика применения дублируется из applyMove, но для MapSchema
      const opponent = player === 'white' ? 'black' : 'white';

      if (fromNum === 'bar') {
        this.state.bar.set(player, (this.state.bar.get(player) ?? 0) - 1);
      } else {
        const fromStr = fromNum.toString();
        const fromPoint = this.state.board.get(fromStr);
        if (fromPoint) {
          fromPoint.checkers--;
          if (fromPoint.checkers === 0) {
            this.state.board.delete(fromStr);
          }
        }
      }

      if (toNum !== 'off') {
        const toStr = toNum.toString();
        const targetPoint = this.state.board.get(toStr);
        if (!targetPoint) {
          const p = new Point();
          p.player = player;
          p.checkers = 1;
          this.state.board.set(toStr, p);
        } else if (targetPoint.player === player) {
          targetPoint.checkers++;
        } else {
          console.error(`CRITICAL: Move to opponent point allowed! ${toStr}`);
          return;
        }
      } else {
        // Выброс шашки
        this.state.off.set(player, (this.state.off.get(player) ?? 0) + 1);
      }

      // Обновляем счетчик снятия с головы
      const headPoint = player === 'white' ? 24 : 1;
      if (fromNum === headPoint) {
        this.state.turnMovesFromHead++;
      }

      // Удаляем использованную кость
      const dieIndex = this.state.dice.indexOf(dieUsed);
      if (dieIndex !== -1) {
        this.state.dice.splice(dieIndex, 1);
      } else {
        console.error(`Die ${dieUsed} not found in dice list!`);
      }

      // Проверка победы
      if (this.checkWinCondition(player)) {
        this.state.winner = player;
        void this.lock();
      } else {
        // Пересчитываем возможные ходы для следующего шага
        this.generateAndSetPossibleMoves();

        // Если ходов больше нет, завершаем ход
        if (this.possibleMoves.length === 0) {
          this.endTurn();
        }
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

    // --- ПРИМЕНЕНИЕ ПРАВИЛА "СНЯТИЯ С ГОЛОВЫ" ---
    const headPoint = player === 'white' ? 24 : 1;
    // Первые два хода (по одному на игрока) считаются началом игры
    const isFirstTurn = this.state.turnCount <= 2;
    const isSpecialDouble = dice.length === 4 && [3, 4, 6].includes(dice[0]);
    const currentMovesFromHead = this.state.turnMovesFromHead;

    this.logger.log(`Head rule check: turnCount=${this.state.turnCount}, movesFromHead=${currentMovesFromHead}, isFirstTurn=${isFirstTurn}, isSpecialDouble=${isSpecialDouble}`);

    const filteredSequences = allSequences.filter(seq => {
      const movesFromHeadInSeq = seq.filter(move => move.from === headPoint).length;
      const totalMovesFromHead = currentMovesFromHead + movesFromHeadInSeq;

      // Исключение: в первый ход при дублях 3-3, 4-4, 6-6 можно снять 2 шашки
      if (isFirstTurn && isSpecialDouble) {
        return totalMovesFromHead <= 2;
      } else {
        // Основное правило: с головы можно снимать только 1 шашку за ход
        return totalMovesFromHead <= 1;
      }
    });

    this.logger.log(`Sequences after head rule filter: ${filteredSequences.length}`);

    return filteredSequences;
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
    return sequences;
  }

  private findAllSingleMoves(
    board: VirtualBoard,
    die: number,
    player: string,
  ): Move[] {
    const moves: Move[] = [];
    const direction = player === 'white' ? -1 : 1;
    const barCheckers = board.bar[player];

    // Если есть шашки на баре, нужно ходить ими
    if (barCheckers > 0) {
      const to = player === 'white' ? 25 - die : die;
      const targetPoint = board.points.get(to.toString());

      if (
        !targetPoint ||
        targetPoint.player === player
      ) {
        moves.push({ from: 'bar', to, die });
      }
    } else {
      // Проверяем, можно ли снимать шашки
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
            // В длинных нардах НЕЛЬЗЯ ходить на поле противника вообще
            if (!targetPoint || targetPoint.player === player) {
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

      // Если значение больше позиции, можно снять только самую дальнюю шашку
      if (die > (24 - from + 1)) {
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
    for (const [key, point] of board.points.entries()) {
      if (point.player === player) {
        const pointNum = parseInt(key);
        if (player === 'white') {
          if (pointNum > from) return false;
        } else {
          if (pointNum < from) return false;
        }
      }
    }
    return true;
  }

  private applyMove(
    board: VirtualBoard,
    move: Move,
    player: string,
  ): VirtualBoard {
    const { from, to } = move;
    const newBoard: VirtualBoard = {
      points: new Map(),
      bar: { ...board.bar },
    };

    // Копируем точки
    board.points.forEach((p, k) => {
      newBoard.points.set(k, { ...p });
    });

    const opponent = player === 'white' ? 'black' : 'white';

    if (from === 'bar') {
      newBoard.bar[player]--;
    } else {
      const fromStr = from.toString();
      const fromPoint = newBoard.points.get(fromStr);
      if (fromPoint) {
        fromPoint.checkers--;
        if (fromPoint.checkers === 0) {
          newBoard.points.delete(fromStr);
        } else {
          newBoard.points.set(fromStr, fromPoint);
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
          newBoard.points.set(toStr, newTargetPoint);
        } else {
          // В длинных нардах ход на поле противника невозможен
          console.error(
            `INVALID VIRTUAL MOVE: Attempting to move to opponent's point ${toStr}`,
          );
        }
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
    this.state.turnCount++;
    this.state.turnMovesFromHead = 0;
    console.log(`Turn ended. Current player: ${this.state.currentPlayer}`);
  }

  // Метод для уведомления лобби об изменениях
  private notifyLobby(action: 'add' | 'update' | 'remove', roomInfo: RoomInfo) {
    if (this.lobbyService) {
      // Update metadata whenever we notify the lobby
      if (action === 'add' || action === 'update') {
        this.setMetadata(roomInfo);
      }

      this.logger.log(
        `Notifying lobby: action=${action} room=${roomInfo.roomId} players=${roomInfo.playersCount} status=${roomInfo.status}`,
      );
      this.lobbyService.notifyLobby(action, roomInfo);
    } else {
      console.warn('LobbyService not available');
    }
  }
}
