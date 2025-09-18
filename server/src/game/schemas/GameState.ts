import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';

export class Point extends Schema {
  @type('string') player: string;
  @type('number') checkers: number;
}

export class GameState extends Schema {
  @type({ map: Point })
  board = new MapSchema<Point>();

  @type({ map: 'number' })
  bar = new MapSchema<number>({ white: 0, black: 0 });

  @type({ map: 'number' })
  off = new MapSchema<number>({ white: 0, black: 0 });

  @type('string')
  currentPlayer: string;

  @type(['number'])
  dice = new ArraySchema<number>();

  @type('string')
  winner: string | null = null;

  @type(['string'])
  possibleMoves = new ArraySchema<string>();

  @type({ map: 'string' })
  players = new MapSchema<string>(); // sessionId -> 'white' | 'black'
}
