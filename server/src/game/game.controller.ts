import { Body, Controller, Post } from '@nestjs/common';
import { matchMaker } from '@colyseus/core';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MatchmakeDto } from './dto/matchmake.dto';

@ApiTags('Game')
@Controller('game-http')
export class GameController {
  constructor() {
    console.log('GameController instantiated');
  }
  @Post('matchmake')
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
  async matchmake(@Body() options: MatchmakeDto): Promise<{ roomId: string }> {
    const reservation = await matchMaker.joinOrCreate('backgammon', options);
    return { roomId: reservation.room.roomId };
  }
}
