import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
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
    let user = await this.usersService.getUserByWalletAddress(
      verifyData.account.address,
    );

    let username: string | undefined;
    let avatarUrl: string | undefined;

    this.logger.log(`Processing initData: ${verifyData.initData ? 'present' : 'not present'}`);

    if (verifyData.initData) {
      try {
        const params = new URLSearchParams(verifyData.initData);
        this.logger.log(`InitData params: ${verifyData.initData}`);

        // Try to get data from 'user' field (Telegram WebApp format)
        const userJson = params.get('user');
        if (userJson) {
          this.logger.log(`Found 'user' field in initData: ${userJson}`);
          interface TelegramUserData {
            first_name?: string;
            photo_url?: string;
          }
          const userData = JSON.parse(userJson) as TelegramUserData;
          username = userData.first_name;
          avatarUrl = userData.photo_url;
          this.logger.log(`Parsed Telegram user data: username=${username}, avatarUrl=${avatarUrl}`);
        } else {
          // Fallback: get data from direct parameters (our custom format)
          username = params.get('username') || undefined;
          avatarUrl = params.get('avatar_url') || undefined;
          this.logger.log(`Using fallback params: username=${username}, avatarUrl=${avatarUrl}`);
        }
      } catch (e) {
        this.logger.error('Failed to parse initData', e);
      }
    } else {
      this.logger.warn('No initData provided - avatar and username will not be set');
    }

    if (!user) {
      this.logger.log(
        `Creating new user for verified wallet: ${verifyData.account.address}`,
      );
      user = await this.usersService.createUser(
        verifyData.account.address,
        username,
        avatarUrl,
      );
    } else {
      this.logger.log(`User already exists: ${user.id}, current avatar: ${user.avatar}`);
      // If user exists, update their profile info if new data is provided
      if (username !== undefined || avatarUrl !== undefined) {
        this.logger.log(`Updating user profile with: username=${username}, avatarUrl=${avatarUrl}`);
        user = await this.usersService.updateUserProfile(
          user.id,
          username,
          avatarUrl,
        );
        this.logger.log(`Profile updated. New avatar: ${user?.avatar}`);
      } else {
        this.logger.log('No new username or avatar to update');
      }
    }

    if (!user) {
      throw new Error('Failed to create or find user');
    }

    // 3. Generate auth token
    const authToken = this.jwtUtils.createAuthToken({
      address: verifyData.account.address,
      network: 'mainnet', // You might want to pass this as parameter
      userId: user.id,
    });

    this.logger.log(`User ${user.id} verified and logged in successfully`);

    return {
      access_token: authToken,
      user,
    };
  }

  async validateJwtPayload(payload: AuthPayload): Promise<User | null> {
    this.logger.log(`Validating JWT payload: sub=${payload.sub}, address=${payload.walletAddress}`);

    if (!payload.sub) {
      this.logger.warn('JWT payload missing sub (user ID) - old token format. User must re-authenticate.');
      return null;
    }

    const user = await this.usersService.getUserById(payload.sub);
    if (user) {
      this.logger.log(`User found: ${user.id} (${user.username})`);
    } else {
      this.logger.warn(`User not found for payload.sub=${payload.sub}`);
    }
    return user;
  }
}
