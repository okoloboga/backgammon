import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService, AuthResponse } from './auth.service';
import { User } from '../users/users.service';
import { ChallengeResponse, VerifyProofRequest } from '../types/ton.types';
import { AuthDto, GenerateChallengeDto, VerifyProofDto } from './dto/auth.dto';

export class LoginDto {
  walletAddress: string;
  username?: string;
  avatar?: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ 
    summary: 'Authentication via TON wallet',
    description: 'Authenticate user by TON wallet address. If user does not exist, a new one is created.'
  })
  @ApiBody({
    description: 'Authentication data',
    schema: {
      type: 'object',
      properties: {
        walletAddress: {
          type: 'string',
          description: 'TON wallet address',
          example: 'EQD0vdSA_NedR9uvnh85V0S_3Bd3XJgq8Y5k-1CLq8k5tOPi'
        },
        username: {
          type: 'string',
          description: 'Username (optional)',
          example: 'Player1'
        },
        avatar: {
          type: 'string',
          description: 'Avatar URL (optional)',
          example: 'https://example.com/avatar.jpg'
        }
      },
      required: ['walletAddress']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Successful authentication',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT token for authentication'
        },
        user: {
          type: 'object',
          description: 'User data'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(
      loginDto.walletAddress,
      loginDto.username,
      loginDto.avatar,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get user profile',
    description: 'Returns data of the current authenticated user'
  })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        walletAddress: { type: 'string' },
        username: { type: 'string' },
        avatar: { type: 'string' },
        balance: { type: 'number' },
        games: { type: 'number' },
        wins: { type: 'number' },
        loses: { type: 'number' },
        winrate: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req: { user: User }): User {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get current user',
    description: 'Alias for /auth/profile'
  })
  @ApiResponse({
    status: 200,
    description: 'Current user data'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@Request() req: { user: User }): User {
    return req.user;
  }

  @Post('generate-challenge')
  @ApiOperation({ 
    summary: 'Generate challenge for TonProof',
    description: 'Generates a challenge for TonConnect authentication'
  })
  @ApiBody({
    description: 'Optional client ID',
    schema: {
      type: 'object',
      properties: {
        clientId: {
          type: 'string',
          description: 'Optional client ID. If not provided, a new UUID will be generated.'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Challenge generated successfully',
    schema: {
      type: 'object',
      properties: {
        challenge: {
          type: 'string',
          description: 'Challenge string for TonProof'
        },
        validUntil: {
          type: 'number',
          description: 'Unix timestamp when challenge expires'
        },
        clientId: {
          type: 'string',
          description: 'Client ID for this challenge'
        }
      }
    }
  })
  async generateChallenge(@Body() body?: GenerateChallengeDto): Promise<ChallengeResponse> {
    return this.authService.generateChallenge(body?.clientId);
  }

  @Post('verify-proof')
  @ApiOperation({ 
    summary: 'Verify TonProof and authenticate',
    description: 'Verifies TonProof signature and authenticates user'
  })
  @ApiBody({
    description: 'TonProof verification data',
    schema: {
      type: 'object',
      properties: {
        account: {
          type: 'object',
          properties: {
            address: { type: 'string', description: 'TON wallet address' },
            publicKey: { type: 'string', description: 'Public key from wallet' },
            chain: { type: 'string', description: 'TON network chain (mainnet/testnet)' },
            walletStateInit: { type: 'string', description: 'Wallet state init (optional)' }
          }
        },
        tonProof: {
          type: 'object',
          properties: {
            proof: {
              type: 'object',
              properties: {
                timestamp: { type: 'number', description: 'Unix timestamp' },
                domain: { type: 'string', description: 'App domain' },
                payload: { type: 'string', description: 'Challenge payload' },
                signature: { type: 'string', description: 'Ed25519 signature' }
              }
            }
          }
        },
        clientId: {
          type: 'string',
          description: 'Client ID from generate-challenge'
        }
      },
      required: ['account', 'tonProof', 'clientId']
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Proof verified successfully',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT authentication token'
        },
        user: {
          type: 'object',
          description: 'User data'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid proof or request data' })
  async verifyProof(@Body() verifyData: VerifyProofDto): Promise<AuthResponse> {
    return this.authService.verifyTonProof(verifyData);
  }
}