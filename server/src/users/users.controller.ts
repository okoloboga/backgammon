import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { UsersService, User } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

export class CreateUserDto {
  walletAddress: string;
  username?: string;
  avatar?: string;
}

// Удаляем UpdateBalanceDto - балансы теперь в смарт-контракте

export class UpdateProfileDto {
  username?: string;
  avatar?: string;
}

export class UpdateStatsDto {
  won: boolean;
}

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create new user',
    description: 'Creates a new user with the specified wallet address'
  })
  @ApiBody({
    description: 'User creation data',
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
    description: 'User successfully created',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        walletAddress: { type: 'string' },
        username: { type: 'string' },
        avatar: { type: 'string' },
        // balance удален - теперь в смарт-контракте
        currentStreak: { type: 'number' },
        bestStreak: { type: 'number' },
        level: { type: 'number' },
        experience: { type: 'number' },
        friends: { type: 'array', items: { type: 'string' } },
        achievements: { type: 'array', items: { type: 'string' } },
        games: { type: 'number' },
        wins: { type: 'number' },
        loses: { type: 'number' },
        winrate: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  createUser(@Body() createUserDto: CreateUserDto): User {
    return this.usersService.createUser(
      createUserDto.walletAddress,
      createUserDto.username,
      createUserDto.avatar,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Returns list of all users (requires authentication)'
  })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          walletAddress: { type: 'string' },
          username: { type: 'string' },
          avatar: { type: 'string' },
          // balance удален - теперь в смарт-контракте
        currentStreak: { type: 'number' },
        bestStreak: { type: 'number' },
        level: { type: 'number' },
        experience: { type: 'number' },
        friends: { type: 'array', items: { type: 'string' } },
        achievements: { type: 'array', items: { type: 'string' } },
          games: { type: 'number' },
          wins: { type: 'number' },
          loses: { type: 'number' },
          winrate: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getAllUsers(): User[] {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Returns user data by unique identifier'
  })
  @ApiParam({
    name: 'id',
    description: 'Unique user identifier',
    example: 'abc123def'
  })
  @ApiResponse({
    status: 200,
    description: 'User data',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        walletAddress: { type: 'string' },
        username: { type: 'string' },
        avatar: { type: 'string' },
        // balance удален - теперь в смарт-контракте
        currentStreak: { type: 'number' },
        bestStreak: { type: 'number' },
        level: { type: 'number' },
        experience: { type: 'number' },
        friends: { type: 'array', items: { type: 'string' } },
        achievements: { type: 'array', items: { type: 'string' } },
        games: { type: 'number' },
        wins: { type: 'number' },
        loses: { type: 'number' },
        winrate: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserById(@Param('id') id: string): User | null {
    return this.usersService.getUserById(id);
  }

  @Get('wallet/:address')
  @ApiOperation({ 
    summary: 'Get user by wallet address',
    description: 'Returns user data by TON wallet address'
  })
  @ApiParam({
    name: 'address',
    description: 'TON wallet address',
    example: 'EQD0vdSA_NedR9uvnh85V0S_3Bd3XJgq8Y5k-1CLq8k5tOPi'
  })
  @ApiResponse({
    status: 200,
    description: 'User data',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        walletAddress: { type: 'string' },
        username: { type: 'string' },
        avatar: { type: 'string' },
        // balance удален - теперь в смарт-контракте
        currentStreak: { type: 'number' },
        bestStreak: { type: 'number' },
        level: { type: 'number' },
        experience: { type: 'number' },
        friends: { type: 'array', items: { type: 'string' } },
        achievements: { type: 'array', items: { type: 'string' } },
        games: { type: 'number' },
        wins: { type: 'number' },
        loses: { type: 'number' },
        winrate: { type: 'number' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserByWalletAddress(@Param('address') address: string): User | null {
    return this.usersService.getUserByWalletAddress(address);
  }

  // Удаляем endpoint для обновления баланса - балансы теперь в смарт-контракте

  @Put(':id/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update user profile',
    description: 'Updates username and/or avatar (only for own account)'
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'abc123def'
  })
  @ApiBody({
    description: 'Profile update data',
    schema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'New username (optional)',
          example: 'NewPlayerName'
        },
        avatar: {
          type: 'string',
          description: 'New avatar URL (optional)',
          example: 'https://example.com/new-avatar.jpg'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Profile successfully updated'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'No permission to update this user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateUserProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
    @CurrentUser() currentUser: User,
  ): User | null {
    // Check that user can only update their own profile
    if (currentUser.id !== id) {
      throw new Error('Unauthorized: Can only update your own profile');
    }
    return this.usersService.updateUserProfile(
      id,
      updateProfileDto.username,
      updateProfileDto.avatar,
    );
  }

  @Put(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Update game statistics',
    description: 'Updates user game statistics (only for own account)'
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: 'abc123def'
  })
  @ApiBody({
    description: 'Game result',
    schema: {
      type: 'object',
      properties: {
        won: {
          type: 'boolean',
          description: 'Whether the user won the game',
          example: true
        }
      },
      required: ['won']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics successfully updated'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'No permission to update this user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateUserStats(
    @Param('id') id: string,
    @Body() updateStatsDto: UpdateStatsDto,
    @CurrentUser() currentUser: User,
  ): User | null {
    // Check that user can only update their own statistics
    if (currentUser.id !== id) {
      throw new Error('Unauthorized: Can only update your own stats');
    }
    return this.usersService.updateUserStats(id, updateStatsDto.won);
  }
}