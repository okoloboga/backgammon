import { Room, Client } from '@colyseus/core';
import { Logger } from '@nestjs/common';
import { GameState, Point, PlayerProfile } from '../schemas/GameState';
import { LobbyService } from '../services/lobby.service';
import { RoomInfo } from '../types';
import { UsersService } from '../../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../users/entities/user.entity';

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
  creatorUsername?: string;
  creatorAvatar?: string;
  betAmount?: number;
  currency?: string;
  lobbyService: LobbyService;
  usersService: UsersService;
  jwtService: JwtService;
}

interface JoinOptions {
  username?: string;
  avatar?: string;
  accessToken?: string;
}

// Extend the Colyseus Client type to include our custom user data
interface AuthenticatedClient extends Client {
  userData?: User;
}

export class BackgammonRoom extends Room<GameState> {
  private readonly logger = new Logger(BackgammonRoom.name);
  private possibleMoves: Move[][] = [];
  private roomInfo: RoomInfo | null = null;
  private lobbyService: LobbyService;
  private usersService: UsersService;
  private jwtService: JwtService;

  async onAuth(client: Client, options: JoinOptions): Promise<any> {
    this.logger.log(`--- onAuth for client ${client.sessionId}`);
    if (!options.accessToken) {
      this.logger.warn(`Client ${client.sessionId} failed to authenticate: no token provided.`);
      throw new Error('Authentication failed: no token');
    }

    try {
      const payload = this.jwtService.verify(options.accessToken);
      const user = await this.usersService.getUserByWalletAddress(payload.address);
      if (!user) {
        this.logger.warn(`Authentication failed: user not found for wallet ${payload.address}`);
        throw new Error('User not found');
      }
      this.logger.log(`Client ${client.sessionId} authenticated as user ${user.id} (${user.username})`);
      return user; // This will be attached to client.auth
    } catch (error) {
      this.logger.error(`Authentication error for client ${client.sessionId}: ${error.message}`);
      throw new Error('Authentication failed');
    }
  }

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

    // Enable reconnection with 30 second timeout
    this.setMetadata({ allowReconnection: true });

    // Get services from options
    this.lobbyService = options.lobbyService;
    this.usersService = options.usersService;
    this.jwtService = options.jwtService;

    this.setupBoard();

    // Сохраняем информацию о комнате
    this.roomInfo = {
      roomId: this.roomId,
      roomName: options.roomName || `Game ${this.roomId.slice(0, 8)}`,
      playersCount: 0,
      maxPlayers: 2,
      status: 'waiting',
      createdBy: options.creatorUsername || options.createdBy || 'unknown',
      creatorAvatar: options.creatorAvatar,
      betAmount: options.betAmount || 0,
      currency: options.currency || 'TON',
      createdAt: Date.now(),
    };

    // Уведомляем лобби о создании комнаты
    this.notifyLobby('add', this.roomInfo);

    this.onMessage('rollDice', (client) => this.handleRollDice(client));
    this.onMessage('move', (client, message: { from: number | string; to: number | string }) =>
      this.handleMove(client, message),
    );
  }

  onJoin(client: AuthenticatedClient, _options: JoinOptions) {
    this.logger.log(`--- Client ${client.sessionId} JOINED BackgammonRoom`);

    // Логируем состояние до изменений
    this.logger.log(`--- State before join: players.size=${this.state.players.size}, currentPlayer=${this.state.currentPlayer}`);

    const playerColor = this.state.players.size === 0 ? 'white' : 'black';
    this.state.players.set(client.sessionId, playerColor);

    const profile = new PlayerProfile();
    // Use authenticated data from onAuth
    profile.username = client.auth.username;
    profile.avatar = client.auth.avatar;
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
  }

  async onLeave(client: AuthenticatedClient, consented: boolean) {
    const wasPlaying = this.state.players.size === 2;
    const leavingPlayerColor = this.state.players.get(client.sessionId);
    const leavingPlayerId = client.auth?.id; // Save player ID BEFORE deletion!

    // If the disconnection was not intentional (network issue), allow reconnection
    if (!consented && wasPlaying) {
      this.logger.log(`Client ${client.sessionId} disconnected unexpectedly. Allowing reconnection for 30 seconds...`);

      try {
        // Allow 30 seconds for reconnection
        await this.allowReconnection(client, 30);
        this.logger.log(`Client ${client.sessionId} reconnected successfully!`);
        return; // Client reconnected, don't remove them
      } catch (e) {
        // Reconnection timeout - player didn't reconnect
        this.logger.log(`Client ${client.sessionId} failed to reconnect within timeout.`);
      }
    }

    // Player left intentionally or failed to reconnect
    this.logger.log(`Client ${client.sessionId} left${consented ? ' (intentional)' : ' (timeout)'}!`);

    this.state.players.delete(client.sessionId);
    this.state.playerProfiles.delete(client.sessionId);

    if (wasPlaying && leavingPlayerColor && leavingPlayerId) {
      // Game was active, the other player wins
      const winnerColor = leavingPlayerColor === 'white' ? 'black' : 'white';
      this.state.winner = winnerColor;
      void this.handleGameEnd(winnerColor, leavingPlayerId); // Pass leaving player ID

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
      console.log(`No possible moves for ${playerColor}, ending turn soon`);
      this.state.noMoves = true;
      // Automatically end the turn after a short delay
      this.clock.setTimeout(() => {
        this.endTurn();
      }, 2500);
    } else {
      console.log(
        `Generated ${this.possibleMoves.length} possible move sequences`,
      );
    }
  }

  handleMove(
    client: Client,
    moveData: { from: number | string; to: number | string },
  ) {
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

    const { from, to } = moveData;
    const fromNum = from === 'bar' ? 'bar' : Number(from);
    const toNum = to === 'off' ? 'off' : Number(to);

    // Ищем подходящую последовательность в this.possibleMoves
    const matchingSequenceIndex = this.possibleMoves.findIndex(
      (seq) =>
        seq.length > 0 && seq[0].from === fromNum && seq[0].to === toNum,
    );

    if (matchingSequenceIndex === -1) {
      console.error(`Invalid move attempt by ${player}: ${from}->${to}`);
      return;
    }

    const sequence = this.possibleMoves[matchingSequenceIndex];
    const move = sequence[0]; // Берем первый ход
    const dieUsed = move.die;

    // Применяем ход к состоянию
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
      if (player === 'white' || player === 'black') {
        this.state.winner = player;
        void this.handleGameEnd(player);
        void this.lock();
      }
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

  private async handleGameEnd(winnerColor: 'white' | 'black', leavingPlayerId?: string) {
    if (!winnerColor) return;

    this.logger.log(`--- handleGameEnd called for winner: ${winnerColor}, leavingPlayerId: ${leavingPlayerId}`);
    this.logger.log(`--- Current clients count: ${this.clients.length}`);

    let winnerId: string | undefined;
    let loserId: string | undefined = leavingPlayerId; // Use provided leaving player ID

    // Use this.clients which is an array of all clients in the room
    this.clients.forEach((client: AuthenticatedClient) => {
      const playerColor = this.state.players.get(client.sessionId);
      this.logger.log(`--- Client ${client.sessionId}: color=${playerColor}, auth.id=${client.auth?.id}, auth.username=${client.auth?.username}`);

      if (playerColor === winnerColor) {
        winnerId = client.auth?.id;
        this.logger.log(`--- Found winner: ${winnerId}`);
      } else if (!leavingPlayerId) {
        // Only look for loser in clients if not provided
        loserId = client.auth?.id;
        this.logger.log(`--- Found loser: ${loserId}`);
      }
    });

    this.logger.log(`--- Final: winnerId=${winnerId}, loserId=${loserId}`);

    if (winnerId && loserId) {
      this.logger.log(`Updating stats: Winner=${winnerId}, Loser=${loserId}`);
      try {
        await Promise.all([
          this.usersService.updateUserStats(winnerId, true),
          this.usersService.updateUserStats(loserId, false),
        ]);
        this.logger.log(`Stats updated successfully.`);
      } catch (error) {
        this.logger.error(`Failed to update user stats: ${error.message}`);
      }
    } else {
      this.logger.warn(`Could not find both winner and loser IDs to update stats.`);
    }
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

    let allSequences = this.findMoveSequences(
      initialBoard,
      dice,
      player,
      this.state.turnCount,
      this.state.turnMovesFromHead,
    );

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
          this.state.turnCount,
          this.state.turnMovesFromHead,
        );
        if (maxDieMoves.length > 0) {
          // Больший ход возможен, но не используется - это недопустимо
          return [];
        }
      }
    }

    // The head rule is now enforced within `findAllSingleMoves`,
    // so the post-filtering logic is no longer needed.
    return allSequences;
  }

  private findMoveSequences(
    board: VirtualBoard,
    dice: number[],
    player: string,
    turnCount: number,
    movesFromHead: number,
  ): Move[][] {
    if (dice.length === 0) {
      return [[]];
    }

    const sequences: Move[][] = [];
    const uniqueDice = [...new Set(dice)];

    for (const die of uniqueDice) {
      const possibleSingleMoves = this.findAllSingleMoves(
        board,
        die,
        player,
        turnCount,
        movesFromHead,
      );
      if (possibleSingleMoves.length > 0) {
        const remainingDice = [...dice];
        remainingDice.splice(remainingDice.indexOf(die), 1);

        for (const move of possibleSingleMoves) {
          const nextBoard = this.applyMove(board, move, player);
          const newMovesFromHead =
            movesFromHead + (move.from === (player === 'white' ? 24 : 1) ? 1 : 0);
          const nextSequences = this.findMoveSequences(
            nextBoard,
            remainingDice,
            player,
            turnCount,
            newMovesFromHead,
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
    turnCount: number,
    movesFromHead: number,
  ): Move[] {
    const moves: Move[] = [];
    const direction = player === 'white' ? -1 : 1;
    const barCheckers = board.bar[player];
    const headPoint = player === 'white' ? 24 : 1;

    // Если есть шашки на баре, нужно ходить ими
    if (barCheckers > 0) {
      const to = player === 'white' ? 25 - die : die;
      const targetPoint = board.points.get(to.toString());

      if (!targetPoint || targetPoint.player === player) {
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

          // --- ПРОВЕРКА ПРАВИЛА СНЯТИЯ С ГОЛОВЫ ---
          if (from === headPoint) {
            const isFirstTurn = turnCount <= 2;
            const diceCount = this.state.dice.length;
            const isSpecialDouble =
              diceCount === 4 && [3, 4, 6].includes(this.state.dice[0]);

            let maxHeadMoves = 1;
            if (isFirstTurn && isSpecialDouble) {
              maxHeadMoves = 2;
            }

            if (movesFromHead >= maxHeadMoves) {
              continue; // Пропускаем ход с головы, если лимит исчерпан
            }
          }

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
    this.state.noMoves = false; // Reset the flag
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
