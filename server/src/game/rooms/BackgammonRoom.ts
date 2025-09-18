import { Room, Client } from '@colyseus/core';
import { GameState, Point } from '../schemas/GameState';

interface VirtualBoard {
  points: Map<string, { player: string; checkers: number }>;
  bar: { white: number; black: number };
}

interface Move {
  from: number | 'bar';
  to: number | 'off';
  die: number;
}

export class BackgammonRoom extends Room<GameState> {
  private possibleMoves: Move[][] = [];

  onCreate(_options: any) {
    this.setState(new GameState());
    this.setupBoard();

    this.onMessage('rollDice', (client) => this.handleRollDice(client));
    this.onMessage('move', (client, message: string) =>
      this.handleMove(client, message),
    );
  }

  onJoin(client: Client, _options: any) {
    console.log(client.sessionId, 'joined!');
    const playerColor = this.state.players.size === 0 ? 'white' : 'black';
    this.state.players.set(client.sessionId, playerColor);

    if (this.state.players.size === 2) {
      this.state.currentPlayer = 'white';
      void this.lock();
    }
  }

  onLeave(client: Client, _consented: boolean) {
    console.log(client.sessionId, 'left!');
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log('room', this.roomId, 'disposing...');
  }

  setupBoard() {
    this.state.board.clear();
    this.state.board.set('0', new Point({ player: 'white', checkers: 2 }));
    this.state.board.set('5', new Point({ player: 'black', checkers: 5 }));
    this.state.board.set('7', new Point({ player: 'black', checkers: 3 }));
    this.state.board.set('11', new Point({ player: 'white', checkers: 5 }));
    this.state.board.set('12', new Point({ player: 'black', checkers: 5 }));
    this.state.board.set('16', new Point({ player: 'white', checkers: 3 }));
    this.state.board.set('18', new Point({ player: 'white', checkers: 5 }));
    this.state.board.set('23', new Point({ player: 'black', checkers: 2 }));
  }

  handleRollDice(client: Client) {
    const playerColor = this.state.players.get(client.sessionId);
    if (
      this.state.currentPlayer !== playerColor ||
      this.state.dice.length > 0
    ) {
      return;
    }

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;

    if (die1 === die2) {
      this.state.dice.push(die1, die1, die1, die1);
    } else {
      this.state.dice.push(die1, die2);
    }

    this.generateAndSetPossibleMoves();
    if (this.possibleMoves.length === 0) {
      this.endTurn();
    }
  }

  handleMove(client: Client, moveString: string) {
    const player = this.state.players.get(client.sessionId);
    if (player !== this.state.currentPlayer) return;

    const moveIndex = this.state.possibleMoves.indexOf(moveString);
    if (moveIndex === -1) {
      return console.error('Invalid move received:', moveString);
    }

    const moveSequence = this.possibleMoves[moveIndex];
    const opponent = player === 'white' ? 'black' : 'white';

    for (const move of moveSequence) {
      const { from, to } = move;

      if (from === 'bar') {
        this.state.bar.set(player, (this.state.bar.get(player) ?? 0) - 1);
      } else {
        const fromPoint = this.state.board.get(from.toString());
        if (fromPoint) {
          fromPoint.checkers--;
          if (fromPoint.checkers === 0) {
            this.state.board.delete(from.toString());
          }
        }
      }

      if (to === 'off') {
        this.state.off.set(player, (this.state.off.get(player) ?? 0) + 1);
      } else {
        const toStr = to.toString();
        const targetPoint = this.state.board.get(toStr);
        if (!targetPoint) {
          this.state.board.set(toStr, new Point({ player, checkers: 1 }));
        } else if (targetPoint.player === player) {
          targetPoint.checkers++;
        } else {
          targetPoint.player = player;
          this.state.bar.set(opponent, (this.state.bar.get(opponent) ?? 0) + 1);
        }
      }
    }

    if (this.checkWinCondition(player)) {
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

    const maxDiceUsed = Math.max(...allSequences.map((seq) => seq.length));
    allSequences = allSequences.filter((seq) => seq.length === maxDiceUsed);

    if (maxDiceUsed === 1 && dice.length > 1) {
      const dieUsed = allSequences[0][0].die;
      const maxDie = Math.max(...dice);
      if (dieUsed < maxDie) {
        const maxDieMoves = this.findAllSingleMoves(
          initialBoard,
          maxDie,
          player,
        );
        if (maxDieMoves.length > 0) {
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

    if (playerBarCount > 0) {
      const from = player === 'white' ? 24 : -1;
      const to = from + die * direction;
      const targetPoint = board.points.get(to.toString());
      if (
        to >= 0 &&
        to < 24 &&
        (!targetPoint ||
          targetPoint.player === player ||
          targetPoint.checkers <= 1)
      ) {
        moves.push({ from: 'bar', to, die });
      }
    } else {
      let canBearOff = true;
      for (const [key, point] of board.points.entries()) {
        if (point.player === player) {
          const pointNum = parseInt(key);
          if (player === 'white' ? pointNum > 5 : pointNum < 18) {
            canBearOff = false;
            break;
          }
        }
      }

      for (const [key, point] of board.points.entries()) {
        if (point.player === player) {
          const from = parseInt(key);
          const to = from + die * direction;

          if (canBearOff) {
            if (to < 0 || to > 23) {
              moves.push({ from, to: 'off', die });
            } else {
              let isHighest = true;
              for (let i = from + 1; i < 24; i++) {
                if (player === 'white' && board.points.has(i.toString())) {
                  isHighest = false;
                  break;
                }
              }
              for (let i = from - 1; i >= 0; i--) {
                if (player === 'black' && board.points.has(i.toString())) {
                  isHighest = false;
                  break;
                }
              }

              if (
                isHighest &&
                (player === 'white' ? from < die : 23 - from < die)
              ) {
                moves.push({ from, to: 'off', die });
              }
            }
          }

          if (to >= 0 && to <= 23) {
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
}
