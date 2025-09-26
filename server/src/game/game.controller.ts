import { Body, Controller, Post } from '@nestjs/common';
import { matchMaker } from '@colyseus/core';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MatchmakeDto } from './dto/matchmake.dto';

@ApiTags('Game')
@Controller('game-http')
export class GameController {
  @Get('matchmake')
  @ApiOperation({ summary: 'Find or create a backgammon game room' })
  @ApiResponse({
    status: 200,
    description: 'Successfully found or created a room.',
    schema: {
      type: 'object',
      properties: {
        roomId: { type: 'string', description: 'The ID of the game room' },
      },
    },
  })
  async matchmake(): Promise<{ roomId: string }> {
    const reservation = await matchMaker.joinOrCreate('backgammon', {
      betAmount: 1,
      currency: 'TON',
    });
    return { roomId: reservation.room.roomId };
  }
}
