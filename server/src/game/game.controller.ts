import { Body, Controller, Post, Logger, Get } from '@nestjs/common';
import { matchMaker } from '@colyseus/core';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MatchmakeDto } from './dto/matchmake.dto';

@ApiTags('Game')
@Controller('game-http')
export class GameController {
  private readonly logger = new Logger(GameController.name);

  constructor() {
    this.logger.log('GameController instantiated');
  }

  @Post('create_room')
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
async matchmake( @Body() options: MatchmakeDto): Promise<{
  roomId: string;
  sessionId: string;
  processId: string;
}> {
  this.logger.log(
    `--- ENTERED create_room method with options: ${JSON.stringify(options)}`,
  );
  try {
    const reservation = await matchMaker.joinOrCreate('backgammon', options);
    this.logger.log(`Reservation acquired for room ${reservation.room.roomId}`);

    // Возвращаем плоскую структуру для consumeSeatReservation
    const response = {
      roomId: reservation.room.roomId,
      sessionId: reservation.sessionId,
      processId: reservation.room.processId,
    };

    this.logger.log(
      `--- Returning from matchmake: ${JSON.stringify(response)}`,
    );
    return response;
  } catch (e) {
    this.logger.error('Error during matchMaker.joinOrCreate:', e);
    throw e;
  }
}

  @Get('ping')
  @ApiOperation({ summary: 'Ping the game server' })
  @ApiResponse({ status: 200, description: 'Pong' })
  ping(): string {
    this.logger.log('--- PING received on GameController ---');
    return 'pong';
  }
}
