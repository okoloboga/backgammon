import { Injectable } from '@nestjs/common';
import { getSecureRandomBytes, sha256 } from '@ton/crypto';
import { Address, Cell, contractAddress, loadStateInit } from '@ton/ton';
import { Buffer } from 'buffer';
import { sign } from 'tweetnacl';
import { CheckProofRequestDto } from '../dto/ton-proof.dto';

const TON_PROOF_PREFIX = 'ton-proof-item-v2/';
const TON_CONNECT_PREFIX = 'ton-connect';
const ALLOWED_DOMAINS = [
  'localhost:3000',
  'localhost:5173',
  'backgammon.vercel.app', // Add your production domain here
];
const VALID_AUTH_TIME = 15 * 60; // 15 minutes

@Injectable()
export class TonProofService {
  /**
   * Generate random bytes for payload
   */
  async generateRandomBytes(): Promise<Buffer> {
    return await getSecureRandomBytes(32);
  }

  /**
   * Extract public key from wallet state init
   * This is a simplified version - in production you should implement
   * proper wallet version detection and parsing
   */
  private tryParsePublicKey(stateInit: any): Buffer | null {
    try {
      // This is a simplified implementation
      // In production, you should:
      // 1. Compare stateInit.code with known wallet contract codes
      // 2. Parse data section according to wallet version
      // 3. Extract public key from the correct position

      // For now, we'll return null to force fallback to on-chain method
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Verify TonProof signature
   */
  async checkProof(
    payload: CheckProofRequestDto,
    getWalletPublicKey: (address: string) => Promise<Buffer | null>,
  ): Promise<boolean> {
    try {
      const stateInit = loadStateInit(
        Cell.fromBase64(payload.proof.state_init).beginParse(),
      );

      // 1. Try to get public key from stateInit first
      const publicKey =
        this.tryParsePublicKey(stateInit) ??
        (await getWalletPublicKey(payload.address));
      if (!publicKey) {
        return false;
      }

      // 2. Check that provided public key matches extracted one
      const wantedPublicKey = Buffer.from(payload.public_key, 'hex');
      if (!publicKey.equals(wantedPublicKey)) {
        return false;
      }

      // 3. Check that address derived from stateInit matches provided address
      const wantedAddress = Address.parse(payload.address);
      const address = contractAddress(wantedAddress.workChain, stateInit);
      if (!address.equals(wantedAddress)) {
        return false;
      }

      // 4. Check domain is allowed
      if (!ALLOWED_DOMAINS.includes(payload.proof.domain.value)) {
        return false;
      }

      // 5. Check timestamp is not too old
      const now = Math.floor(Date.now() / 1000);
      if (now - VALID_AUTH_TIME > payload.proof.timestamp) {
        return false;
      }

      // 6. Reconstruct the message that was signed
      const message = {
        workchain: address.workChain,
        address: address.hash,
        domain: {
          lengthBytes: payload.proof.domain.lengthBytes,
          value: payload.proof.domain.value,
        },
        signature: Buffer.from(payload.proof.signature, 'base64'),
        payload: payload.proof.payload,
        stateInit: payload.proof.state_init,
        timestamp: payload.proof.timestamp,
      };

      // Build message components
      const wc = Buffer.alloc(4);
      wc.writeUInt32BE(message.workchain, 0);

      const ts = Buffer.alloc(8);
      ts.writeBigUInt64LE(BigInt(message.timestamp), 0);

      const dl = Buffer.alloc(4);
      dl.writeUInt32LE(message.domain.lengthBytes, 0);

      // message = utf8_encode("ton-proof-item-v2/") ++
      //           Address ++
      //           AppDomain ++
      //           Timestamp ++
      //           Payload
      const msg = Buffer.concat([
        Buffer.from(TON_PROOF_PREFIX),
        wc,
        message.address,
        dl,
        Buffer.from(message.domain.value),
        ts,
        Buffer.from(message.payload),
      ]);

      const msgHash = Buffer.from(await sha256(msg));

      // signature = Ed25519Sign(privkey, sha256(0xffff ++ utf8_encode("ton-connect") ++ sha256(message)))
      const fullMsg = Buffer.concat([
        Buffer.from([0xff, 0xff]),
        Buffer.from(TON_CONNECT_PREFIX),
        msgHash,
      ]);

      const result = Buffer.from(await sha256(fullMsg));

      // Verify signature
      return sign.detached.verify(result, message.signature, publicKey);
    } catch (e) {
      console.error('TonProof verification error:', e);
      return false;
    }
  }
}
