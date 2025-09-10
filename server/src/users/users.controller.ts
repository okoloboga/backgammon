import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { UsersService, User } from './users.service';

export class CreateUserDto {
  walletAddress: string;
  username?: string;
}

export class UpdateBalanceDto {
  balance: number;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.createUser(
      createUserDto.walletAddress,
      createUserDto.username,
    );
  }

  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<User | null> {
    return this.usersService.getUserById(id);
  }

  @Get('wallet/:address')
  async getUserByWalletAddress(@Param('address') address: string): Promise<User | null> {
    return this.usersService.getUserByWalletAddress(address);
  }

  @Put(':id/balance')
  async updateUserBalance(
    @Param('id') id: string,
    @Body() updateBalanceDto: UpdateBalanceDto,
  ): Promise<User | null> {
    return this.usersService.updateUserBalance(id, updateBalanceDto.balance);
  }
} 