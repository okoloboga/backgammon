import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { TonProof, Account } from '../../types/ton.types';

export class AuthDto {
  @IsString()
  @IsNotEmpty()
  ton_address!: string;

  @IsObject()
  tonProof!: TonProof;

  @IsObject()
  account!: Account;

  @IsString()
  @IsNotEmpty()
  clientId!: string;
}

export class GenerateChallengeDto {
  @IsString()
  @IsOptional()
  clientId?: string;
}

export class VerifyProofDto {
  @IsObject()
  account!: Account;

  @IsObject()
  tonProof!: TonProof;

  @IsString()
  @IsNotEmpty()
  clientId!: string;

  @IsString()
  @IsOptional()
  telegramId?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
