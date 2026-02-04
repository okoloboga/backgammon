import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class MatchmakeDto {
  @ApiProperty({ description: 'The bet amount', type: Number })
  @IsNumber()
  betAmount: number;

  @ApiProperty({ description: 'The currency', enum: ['TON'] })
  @IsString()
  @IsIn(['TON'])
  currency: string;

  @ApiProperty({ description: 'Creator username', type: String, required: false })
  @IsOptional()
  @IsString()
  creatorUsername?: string;

  @ApiProperty({ description: 'Creator avatar URL', type: String, required: false })
  @IsOptional()
  @IsString()
  creatorAvatar?: string;
}
