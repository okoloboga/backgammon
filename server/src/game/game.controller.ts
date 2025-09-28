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
  async matchmake(
    @Body() options: MatchmakeDto,
  ): Promise<any> { // Return type is dynamic now
    this.logger.log(
      `--- ENTERED create_room method with options: ${JSON.stringify(options)}`,
    );
    try {
      this.logger.log(`--- Querying available rooms before joinOrCreate...`);
      const availableRooms = await matchMaker.query({});
      this.logger.log(`--- Available rooms: ${JSON.stringify(availableRooms)}`);

      const reservation = await matchMaker.joinOrCreate('backgammon', options);
      this.logger.log(`Reservation object: ${JSON.stringify(reservation)}`);

      // Return a serializable object that mimics the SeatReservation structure
      const reservationData = {
        sessionId: reservation.sessionId,
        room: {
          processId: reservation.room.processId,
          roomId: reservation.room.roomId,
          name: reservation.room.name,
        },
      };

      this.logger.log(
        `--- Returning from matchmake: ${JSON.stringify(reservationData)}`,
      );
      return reservationData;
    } catch (e) {
      this.logger.error('Error during matchMaker.joinOrCreate:', e);
      throw e; // Re-throw the error to let NestJS handle it
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
