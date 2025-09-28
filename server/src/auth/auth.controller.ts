import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService, AuthResponse } from './auth.service';
import { User } from '../users/entities/user.entity';
import { ChallengeResponse } from '../types/ton.types';
import { GenerateChallengeDto, VerifyProofDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('generate-challenge')
  @ApiOperation({
    summary: 'Generate authentication challenge',
    description: 'Generates a challenge for TON Connect authentication',
  })
  @ApiBody({
    description: 'Challenge generation parameters',
    schema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'Optional client ID',
          example: 'client-123',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Challenge generated successfully',
    schema: {
      type: 'object',
      properties: {
        challenge: {
          type: 'string',
          description: 'Challenge string for signing',
          example: 'challenge-string-here',
        },
        validUntil: {
          type: 'number',
          description: 'Unix timestamp when challenge expires',
          example: 1640995200,
        },
        clientId: {
          type: 'string',
          description: 'Client ID for this challenge',
          example: 'client-123',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  generateChallenge(
    @Body() generateChallengeDto: GenerateChallengeDto,
  ): ChallengeResponse {
    return this.authService.generateChallenge(generateChallengeDto.clientId);
  }

  @Post('verify-proof')
  @ApiOperation({
    summary: 'Verify TON Connect proof',
    description: 'Verifies the TON Connect proof and authenticates the user',
  })
  @ApiBody({
    description: 'TON Connect proof verification data',
    schema: {
      type: 'object',
      properties: {
        account: {
          type: 'object',
          description: 'TON Connect account data',
          properties: {
            address: {
              type: 'string',
              description: 'TON wallet address',
              example: 'EQD0vdSA_NedR9uvnh85V0S_3Bd3XJgq8Y5k-1CLq8k5tOPi',
            },
            chain: {
              type: 'string',
              description: 'Blockchain chain ID',
              example: '-239',
            },
            network: {
              type: 'string',
              description: 'Network type',
              example: 'mainnet',
            },
            publicKey: {
              type: 'string',
              description: 'Public key',
              example: 'public-key-here',
            },
            walletStateInit: {
              type: 'string',
              description: 'Wallet state init',
              example: 'wallet-state-init-here',
            },
          },
        },
        tonProof: {
          type: 'object',
          description: 'TON Connect proof data',
          properties: {
            timestamp: {
              type: 'number',
              description: 'Proof timestamp',
              example: 1640995200,
            },
            domain: {
              type: 'object',
              description: 'Domain information',
              properties: {
                lengthBytes: {
                  type: 'number',
                  description: 'Domain length in bytes',
                  example: 20,
                },
                value: {
                  type: 'string',
                  description: 'Domain value',
                  example: 'backgammon.ruble.website',
                },
              },
            },
            payload: {
              type: 'string',
              description: 'Proof payload',
              example: 'proof-payload-here',
            },
            signature: {
              type: 'object',
              description: 'Proof signature',
              properties: {
                timestamp: {
                  type: 'number',
                  description: 'Signature timestamp',
                  example: 1640995200,
                },
                domain: {
                  type: 'object',
                  description: 'Domain information',
                  properties: {
                    lengthBytes: {
                      type: 'number',
                      description: 'Domain length in bytes',
                      example: 20,
                    },
                    value: {
                      type: 'string',
                      description: 'Domain value',
                      example: 'backgammon.ruble.website',
                    },
                  },
                },
                payload: {
                  type: 'string',
                  description: 'Signature payload',
                  example: 'signature-payload-here',
                },
              },
            },
          },
        },
        clientId: {
          type: 'string',
          description: 'Client ID used for challenge generation',
          example: 'client-123',
        },
        initData: {
          type: 'string',
          description: 'Optional Telegram init data',
          example: 'telegram-init-data-here',
        },
      },
      required: ['account', 'tonProof', 'clientId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Proof verified successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT access token',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          description: 'User data',
          properties: {
            id: { type: 'string' },
            walletAddress: { type: 'string' },
            username: { type: 'string' },
            avatar: { type: 'string' },
            games: { type: 'number' },
            wins: { type: 'number' },
            loses: { type: 'number' },
            winrate: { type: 'number' },
            currentStreak: { type: 'number' },
            bestStreak: { type: 'number' },
            level: { type: 'number' },
            experience: { type: 'number' },
            friends: { type: 'array', items: { type: 'string' } },
            achievements: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid proof or request data' })
  @ApiResponse({ status: 401, description: 'Proof verification failed' })
  async verifyProof(
    @Body() verifyProofDto: VerifyProofDto,
  ): Promise<AuthResponse> {
    return await this.authService.verifyTonProof(verifyProofDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Returns the current authenticated user data',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user data',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        walletAddress: { type: 'string' },
        username: { type: 'string' },
        avatar: { type: 'string' },
        games: { type: 'number' },
        wins: { type: 'number' },
        loses: { type: 'number' },
        winrate: { type: 'number' },
        currentStreak: { type: 'number' },
        bestStreak: { type: 'number' },
        level: { type: 'number' },
        experience: { type: 'number' },
        friends: { type: 'array', items: { type: 'string' } },
        achievements: { type: 'array', items: { type: 'string' } },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getCurrentUser(@CurrentUser() user: User): User {
    return user;
  }
}
