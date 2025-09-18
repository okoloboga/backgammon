import { Controller, Post } from '@nestjs/common';
import { matchMaker } from '@colyseus/core';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Game')
@Controller('game')
export class GameController {
  @Post('matchmake')
  @ApiOperation({ summary: 'Find or create a backgammon game room' })
  @ApiResponse({
    status: 201,
    description: 'Successfully found or created a room.',
    schema: {
      type: 'object',
      properties: {
        roomId: { type: 'string', description: 'The ID of the game room' },
      },
    },
  })
  async matchmake(): Promise<{ roomId: string }> {
    const reservation = await matchMaker.joinOrCreate('backgammon', {});
    return { roomId: reservation.room.roomId };
  }
}
