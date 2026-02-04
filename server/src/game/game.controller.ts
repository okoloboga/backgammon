import { Body, Controller, Post, Logger, Get } from '@nestjs/common';
import { matchMaker } from '@colyseus/core';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MatchmakeDto } from './dto/matchmake.dto';
import { EscrowService } from '../ton/escrow.service';

@ApiTags('Game')
@Controller('game-http')
export class GameController {
  private readonly logger = new Logger(GameController.name);

  constructor(private readonly escrowService: EscrowService) {
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
    // FIX: Force server update - ensure flat structure is returned
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

  @Post('verify-create')
  @ApiOperation({ summary: 'Verify CreateGameTon transaction' })
  @ApiResponse({
    status: 200,
    description: 'Transaction verification result',
    schema: {
      type: 'object',
      properties: {
        gameId: { type: 'string', description: 'The escrow game ID' },
        amount: { type: 'string', description: 'The bet amount in nanoTON' },
        creator: { type: 'string', description: 'Creator wallet address' },
      },
    },
  })
  async verifyCreate(
    @Body() dto: { senderAddress: string; expectedAmount: number },
  ) {
    this.logger.log(`Verifying CreateGameTon: sender=${dto.senderAddress}, amount=${dto.expectedAmount}`);
    const result = await this.escrowService.verifyCreateTx(
      dto.senderAddress,
      BigInt(Math.floor(dto.expectedAmount * 1e9)),
    );
    if (result) {
      return {
        gameId: result.gameId.toString(),
        amount: result.amount.toString(),
        creator: result.creator,
      };
    }
    return { gameId: null, error: 'Transaction not found or not verified' };
  }

  @Post('verify-join')
  @ApiOperation({ summary: 'Verify JoinGameTon transaction' })
  @ApiResponse({
    status: 200,
    description: 'Join verification result',
    schema: {
      type: 'object',
      properties: {
        verified: { type: 'boolean', description: 'Whether the join was verified' },
      },
    },
  })
  async verifyJoin(
    @Body() dto: { senderAddress: string; gameId: string },
  ) {
    this.logger.log(`Verifying JoinGameTon: sender=${dto.senderAddress}, gameId=${dto.gameId}`);
    const verified = await this.escrowService.verifyJoinTx(
      dto.senderAddress,
      BigInt(dto.gameId),
    );
    return { verified };
  }

  @Post('build-create-payload')
  @ApiOperation({ summary: 'Build CreateGameTon payload for client to sign' })
  @ApiResponse({
    status: 200,
    description: 'Base64-encoded BOC payload',
    schema: {
      type: 'object',
      properties: {
        payload: { type: 'string', description: 'Base64-encoded BOC' },
        escrowAddress: { type: 'string', description: 'Escrow contract address' },
      },
    },
  })
  buildCreatePayload(
    @Body() dto: { amount: string; joinTimeout?: number },
  ) {
    const amountNano = BigInt(Math.floor(parseFloat(dto.amount) * 1e9));
    const timeout = dto.joinTimeout || 3600;
    const payload = this.escrowService.buildCreateGameTonPayload(amountNano, timeout);
    return {
      payload,
      escrowAddress: this.escrowService.getContractAddress(),
    };
  }

  @Post('build-join-payload')
  @ApiOperation({ summary: 'Build JoinGameTon payload for client to sign' })
  @ApiResponse({
    status: 200,
    description: 'Base64-encoded BOC payload',
    schema: {
      type: 'object',
      properties: {
        payload: { type: 'string', description: 'Base64-encoded BOC' },
        escrowAddress: { type: 'string', description: 'Escrow contract address' },
      },
    },
  })
  buildJoinPayload(
    @Body() dto: { gameId: string },
  ) {
    const payload = this.escrowService.buildJoinGameTonPayload(BigInt(dto.gameId));
    return {
      payload,
      escrowAddress: this.escrowService.getContractAddress(),
    };
  }

}
