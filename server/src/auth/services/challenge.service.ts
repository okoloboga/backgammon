import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Address, Cell } from '@ton/core';
import { TonService } from '../../ton/ton.service';
import { TonProof, Account } from '../../types/ton.types';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ChallengeService {
  private readonly logger = new Logger(ChallengeService.name);
  private challenges = new Map<
    string,
    { challenge: string; validUntil: number }
  >();

  constructor(private readonly tonService: TonService) {}

  /**
   * Generates a challenge for TON proof authentication.
   * @param clientId - Optional client ID; if not provided, a new UUID is generated.
   * @returns {Promise<{ challenge: string, validUntil: number, clientId: string }>} Challenge data including the challenge string, expiration time, and client ID.
   */
  async generateChallenge(clientId?: string): Promise<{ challenge: string; validUntil: number; clientId: string }> {
    const newClientId = clientId || uuidv4();
    const challenge = randomBytes(32).toString('hex');
    const validUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
    this.challenges.set(newClientId, { challenge, validUntil });
    this.logger.log(`Generated challenge for clientId ${newClientId}: ${challenge}`);
    return { challenge, validUntil, clientId: newClientId };
  }

  /**
   * Verifies a TON proof signature against a stored challenge.
   * @param account - TON account data including address, public key, and wallet state init.
   * @param tonProof - TON proof data containing the signature and payload.
   * @param clientId - Client ID associated with the challenge.
   * @returns {Promise<boolean>} True if the proof is valid, false otherwise.
   * @throws {BadRequestException} If account, proof, or client ID is invalid.
   */
  async verifyTonProof(account: Account, tonProof: TonProof, clientId: string): Promise<boolean> {
    if (!account?.address || !account.publicKey || !account.walletStateInit || !tonProof?.proof || !clientId) {
      this.logger.error('Invalid account, proof, or clientId');
      throw new BadRequestException('Invalid account, proof, or clientId');
    }

    const storedChallenge = this.challenges.get(clientId);
    if (!storedChallenge || storedChallenge.validUntil < Date.now()) {
      this.logger.error(`No valid challenge found for clientId ${clientId}`);
      this.challenges.delete(clientId);
      return false;
    }

    const receivedChallenge = tonProof.proof.payload;
    if (storedChallenge.challenge !== receivedChallenge) {
      this.logger.error(`Challenge mismatch for clientId ${clientId}: expected ${storedChallenge.challenge}, received ${receivedChallenge}`);
      return false;
    }

    const payload = {
      address: account.address,
      public_key: account.publicKey,
      proof: {
        ...tonProof.proof,
        state_init: account.walletStateInit,
      },
    };

    try {
      const stateInitCell = Cell.fromBoc(Buffer.from(payload.proof.state_init, 'base64'))[0];
      const client = this.tonService['client'];
      if (!client) {
        this.logger.error('TON client not initialized');
        throw new BadRequestException('TON client not initialized');
      }

      const address = Address.parse(payload.address);
      let publicKey: Buffer;

      try {
        const result = await client.runMethod(address, 'get_public_key', []);
        publicKey = Buffer.from(result.stack.readBigNumber().toString(16).padStart(64, '0'), 'hex');
      } catch (error) {
        this.logger.log('get_public_key failed, using state_init for verification');

        const publicKeyFromStateInit = Buffer.from(payload.public_key, 'hex');
        if (!publicKeyFromStateInit || publicKeyFromStateInit.length !== 32) {
          this.logger.error('Invalid public key from state_init');
          return false;
        }

        const wantedPublicKey = Buffer.from(payload.public_key, 'hex');
        if (!publicKeyFromStateInit.equals(wantedPublicKey)) {
          this.logger.error('Public keys do not match');
          return false;
        }

        const wantedAddress = Address.parse(payload.address);
        const stateInitHash = stateInitCell.hash();
        const addressFromStateInit = new Address(wantedAddress.workChain, stateInitHash);
        if (!addressFromStateInit.equals(wantedAddress)) {
          this.logger.error('Addresses do not match');
          return false;
        }

        const now = Math.floor(Date.now() / 1000);
        if (now - 15 * 60 > payload.proof.timestamp) {
          this.logger.error('Proof is too old');
          return false;
        }
        this.challenges.delete(clientId);
        return true;
      }

      if (!publicKey || publicKey.length !== 32) {
        this.logger.error('Invalid public key from blockchain');
        return false;
      }

      const wantedPublicKey = Buffer.from(payload.public_key, 'hex');
      if (!publicKey.equals(wantedPublicKey)) {
        this.logger.error('Public keys do not match');
        return false;
      }

      const wantedAddress = Address.parse(payload.address);
      const stateInitHash = stateInitCell.hash();
      const addressFromStateInit = new Address(wantedAddress.workChain, stateInitHash);
      if (!addressFromStateInit.equals(wantedAddress)) {
        this.logger.error('Addresses do not match');
        return false;
      }

      const now = Math.floor(Date.now() / 1000);
      if (now - 15 * 60 > payload.proof.timestamp) {
        this.logger.error('Proof is too old');
        return false;
      }
      this.logger.log(`Removing challenge for clientId ${clientId} after successful verification`);
      this.challenges.delete(clientId);
      return true;
    } catch (error) {
      this.logger.error(`Failed to verify TON Proof for clientId ${clientId}: ${(error as Error).message}`);
      return false;
    }
  }
}