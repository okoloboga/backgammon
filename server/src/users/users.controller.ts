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
  createUser(@Body() createUserDto: CreateUserDto): User {
    return this.usersService.createUser(
      createUserDto.walletAddress,
      createUserDto.username,
    );
  }

  @Get()
  getAllUsers(): User[] {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  getUserById(@Param('id') id: string): User | null {
    return this.usersService.getUserById(id);
  }

  @Get('wallet/:address')
  getUserByWalletAddress(@Param('address') address: string): User | null {
    return this.usersService.getUserByWalletAddress(address);
  }

  @Put(':id/balance')
  updateUserBalance(
    @Param('id') id: string,
    @Body() updateBalanceDto: UpdateBalanceDto,
  ): User | null {
    return this.usersService.updateUserBalance(id, updateBalanceDto.balance);
  }
}
