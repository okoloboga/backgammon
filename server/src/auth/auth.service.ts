import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService, User } from '../users/users.service';
import { ChallengeService } from './services/challenge.service';
import { JwtUtils } from './utils/jwt.utils';
import { VerifyProofDto } from './dto/auth.dto';

export interface AuthPayload {
  walletAddress: string;
  sub: string; // user ID
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly challengeService: ChallengeService,
    private readonly jwtUtils: JwtUtils,
  ) {}

  generateChallenge(clientId?: string): {
    challenge: string;
    validUntil: number;
    clientId: string;
  } {
    return this.challengeService.generateChallenge(clientId);
  }

  async verifyTonProof(verifyData: VerifyProofDto): Promise<AuthResponse> {
    this.logger.log(
      `Verifying TonProof for wallet: ${verifyData.account.address}`,
    );

    // 1. Verify the TonProof signature using ChallengeService
    const isValidProof = await this.challengeService.verifyTonProof(
      verifyData.account,
      verifyData.tonProof,
      verifyData.clientId,
    );

    if (!isValidProof) {
      throw new Error('Invalid TonProof signature');
    }

    // 2. Get or create user
    let user = this.usersService.getUserByWalletAddress(
      verifyData.account.address,
    );

    if (!user) {
      this.logger.log(
        `Creating new user for verified wallet: ${verifyData.account.address}`,
      );
      user = this.usersService.createUser(verifyData.account.address);
    }

    if (!user) {
      throw new Error('Failed to create or find user');
    }

    // 3. Generate auth token
    const authToken = this.jwtUtils.createAuthToken({
      address: verifyData.account.address,
      network: 'mainnet', // You might want to pass this as parameter
    });

    this.logger.log(`User ${user.id} verified and logged in successfully`);

    return {
      access_token: authToken,
      user,
    };
  }

  validateJwtPayload(payload: AuthPayload): User | null {
    return this.usersService.getUserById(payload.sub);
  }
}
