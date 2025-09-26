import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsString } from 'class-validator';

export class MatchmakeDto {
  @ApiProperty({ description: 'The bet amount', type: Number })
  @IsNumber()
  betAmount: number;

  @ApiProperty({ description: 'The currency', enum: ['TON', 'RUBLE'] })
  @IsString()
  @IsIn(['TON', 'RUBLE'])
  currency: string;
}
