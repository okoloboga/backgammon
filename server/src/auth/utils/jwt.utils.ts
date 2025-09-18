import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { sha256 } from '@ton/crypto';

export interface PayloadTokenData {
  randomBytes: string;
}

export interface AuthTokenData {
  address: string;
  network: string;
}

@Injectable()
export class JwtUtils {
  constructor(private readonly jwtService: JwtService) {}

  async createPayloadToken(data: PayloadTokenData): Promise<string> {
    return this.jwtService.sign(data, {
      expiresIn: '5m', // Short expiration for payload tokens
      secret: process.env.JWT_SECRET || 'default-secret',
    });
  }

  async verifyPayloadToken(token: string): Promise<PayloadTokenData | null> {
    try {
      return this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'default-secret',
      });
    } catch {
      return null;
    }
  }

  async createAuthToken(data: AuthTokenData): Promise<string> {
    return this.jwtService.sign(data, {
      expiresIn: '24h', // Long expiration for auth tokens
      secret: process.env.JWT_SECRET || 'default-secret',
    });
  }

  async verifyAuthToken(token: string): Promise<AuthTokenData | null> {
    try {
      return this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'default-secret',
      });
    } catch {
      return null;
    }
  }

  async hashPayloadToken(payloadToken: string): Promise<string> {
    const hash = await sha256(payloadToken);
    return hash.toString('hex');
  }
}
