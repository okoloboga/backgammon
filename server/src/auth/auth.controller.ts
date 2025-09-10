import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService, AuthResponse } from './auth.service';
import { User } from '../users/users.service';

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
}