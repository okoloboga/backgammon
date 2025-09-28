import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';

export class Point extends Schema {
  @type('string') player: string = '';
  @type('number') checkers: number = 0;
}

export class GameState extends Schema {
  @type({ map: Point })
  board: MapSchema<Point>;

  @type({ map: 'number' })
  bar: MapSchema<number>;

  @type({ map: 'number' })
  off: MapSchema<number>;

  @type('string')
  currentPlayer: string;

  @type(['number'])
  dice: ArraySchema<number>;

  @type('string')
  winner: string;

  @type(['string'])
  possibleMoves: ArraySchema<string>;

  @type({ map: 'string' })
  players: MapSchema<string>;

  constructor() {
    super();
    this.board = new MapSchema<Point>();
    this.bar = new MapSchema<number>({ white: 0, black: 0 });
    this.off = new MapSchema<number>({ white: 0, black: 0 });
    this.currentPlayer = '';
    this.dice = new ArraySchema<number>();
    this.winner = '';
    this.possibleMoves = new ArraySchema<string>();
    this.players = new MapSchema<string>();
  }
}
