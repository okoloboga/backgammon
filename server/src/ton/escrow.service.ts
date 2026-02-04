import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TonClient, WalletContractV4, internal, Address } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { beginCell, toNano } from '@ton/core';
import {
  storeCreateGameTon,
  storeJoinGameTon,
  storeReportWinner,
  CreateGameTon,
  JoinGameTon,
  ReportWinner,
} from '../../../blockchain/build/Escrow/Escrow_Escrow';

export interface EscrowConfig {
  contractAddress: string;
  adminMnemonic: string;
  useMockTransactions: boolean;
}

export interface CreateGameResult {
  gameId: bigint;
  amount: bigint;
  creator: string;
}

@Injectable()
export class EscrowService implements OnModuleInit {
  private readonly logger = new Logger(EscrowService.name);
  private client: TonClient;
  private escrowAddress: Address;
  private adminWallet: WalletContractV4 | null = null;
  private adminKeyPair: { publicKey: Buffer; secretKey: Buffer } | null = null;
  private config: EscrowConfig;

  constructor(private configService: ConfigService) {
    const endpoint =
      this.configService.get<string>('ton.endpoint') ||
      'https://testnet.toncenter.com/api/v2/jsonRPC';
    const apiKey = this.configService.get<string>('ton.apiKey');

    this.client = new TonClient({
      endpoint,
      apiKey,
    });

    this.config = {
      contractAddress:
        this.configService.get<string>('escrow.contractAddress') || '',
      adminMnemonic:
        this.configService.get<string>('escrow.adminMnemonic') || '',
      useMockTransactions:
        this.configService.get<boolean>('escrow.useMockTransactions') ?? true,
    };

    if (this.config.contractAddress) {
      this.escrowAddress = Address.parse(this.config.contractAddress);
    }

    this.logger.log(
      `EscrowService initialized. Mock mode: ${this.config.useMockTransactions}`,
    );
  }

  async onModuleInit() {
    if (this.config.adminMnemonic && !this.config.useMockTransactions) {
      try {
        const mnemonic = this.config.adminMnemonic.split(' ');
        this.adminKeyPair = await mnemonicToPrivateKey(mnemonic);
        this.adminWallet = WalletContractV4.create({
          workchain: 0,
          publicKey: this.adminKeyPair.publicKey,
        });
        this.logger.log(
          `Admin wallet initialized: ${this.adminWallet.address.toString()}`,
        );
      } catch (error) {
        this.logger.error('Failed to initialize admin wallet:', error);
      }
    }
  }

  /**
   * Build payload for CreateGameTon message (client signs this)
   * Returns base64-encoded BOC
   */
  buildCreateGameTonPayload(amount: bigint, joinTimeout: number): string {
    const message: CreateGameTon = {
      $$type: 'CreateGameTon',
      amount,
      joinTimeout: BigInt(joinTimeout),
    };

    const cell = beginCell().store(storeCreateGameTon(message)).endCell();
    return cell.toBoc().toString('base64');
  }

  /**
   * Build payload for JoinGameTon message (client signs this)
   * Returns base64-encoded BOC
   */
  buildJoinGameTonPayload(gameId: bigint): string {
    const message: JoinGameTon = {
      $$type: 'JoinGameTon',
      gameId,
    };

    const cell = beginCell().store(storeJoinGameTon(message)).endCell();
    return cell.toBoc().toString('base64');
  }

  /**
   * Get escrow contract address
   */
  getContractAddress(): string {
    return this.escrowAddress?.toString() || '';
  }

  /**
   * Check if mock mode is enabled
   */
  isMockMode(): boolean {
    return this.config.useMockTransactions;
  }

  /**
   * Report winner (admin only, called from backend)
   * This sends a transaction from the admin wallet
   */
  async reportWinner(gameId: bigint, winnerAddress: Address): Promise<string> {
    if (this.config.useMockTransactions) {
      const mockTxHash = `mock_report_${gameId}_${Date.now()}`;
      this.logger.log(`[MOCK] ReportWinner: gameId=${gameId}, winner=${winnerAddress.toString()}, txHash=${mockTxHash}`);
      return mockTxHash;
    }

    if (!this.adminWallet || !this.adminKeyPair) {
      throw new Error('Admin wallet not initialized');
    }

    const message: ReportWinner = {
      $$type: 'ReportWinner',
      gameId,
      winner: winnerAddress,
    };

    const messageCell = beginCell().store(storeReportWinner(message)).endCell();

    try {
      const walletContract = this.client.open(this.adminWallet);
      const seqno = await walletContract.getSeqno();

      await walletContract.sendTransfer({
        seqno,
        secretKey: this.adminKeyPair.secretKey,
        messages: [
          internal({
            to: this.escrowAddress,
            value: toNano('0.05'), // Gas for contract execution
            body: messageCell,
          }),
        ],
      });

      // Generate transaction hash (simplified - in production, track actual tx)
      const txHash = `report_${gameId}_${seqno}_${Date.now()}`;
      this.logger.log(
        `ReportWinner sent: gameId=${gameId}, winner=${winnerAddress.toString()}, seqno=${seqno}`,
      );

      return txHash;
    } catch (error) {
      this.logger.error(`Failed to report winner for game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Verify that a CreateGameTon transaction was confirmed
   * Returns the gameId and amount if found
   */
  async verifyCreateTx(
    senderAddress: string,
    expectedAmount: bigint,
  ): Promise<CreateGameResult | null> {
    if (this.config.useMockTransactions) {
      // In mock mode, generate a random gameId
      const mockGameId = BigInt(Date.now());
      this.logger.log(
        `[MOCK] Verified CreateGameTon: gameId=${mockGameId}, amount=${expectedAmount}`,
      );
      return {
        gameId: mockGameId,
        amount: expectedAmount,
        creator: senderAddress,
      };
    }

    try {
      const address = Address.parse(senderAddress);
      const transactions = await this.client.getTransactions(
        this.escrowAddress,
        { limit: 20 },
      );

      for (const tx of transactions) {
        if (!tx.inMessage) continue;

        const sender = tx.inMessage.info?.src;
        // Check if sender is Address (not ExternalAddress) and equals the address
        if (!sender || !(sender instanceof Address) || !sender.equals(address)) continue;

        // Check if this is a CreateGameTon message (op = 1)
        const body = tx.inMessage.body;
        if (!body) continue;

        try {
          const slice = body.beginParse();
          const op = slice.loadUint(32);
          if (op === 1) {
            // CreateGameTon
            const amount = slice.loadCoins();
            if (amount === expectedAmount) {
              // Extract gameId from outMessages or state changes
              // For simplicity, we'll derive it from transaction time
              const gameId = BigInt(tx.now);
              return {
                gameId,
                amount,
                creator: senderAddress,
              };
            }
          }
        } catch {
          continue;
        }
      }

      return null;
    } catch (error) {
      this.logger.error('Error verifying create transaction:', error);
      return null;
    }
  }

  /**
   * Verify that a JoinGameTon transaction was confirmed
   */
  async verifyJoinTx(
    senderAddress: string,
    gameId: bigint,
  ): Promise<boolean> {
    if (this.config.useMockTransactions) {
      this.logger.log(
        `[MOCK] Verified JoinGameTon: gameId=${gameId}, joiner=${senderAddress}`,
      );
      return true;
    }

    try {
      const address = Address.parse(senderAddress);
      const transactions = await this.client.getTransactions(
        this.escrowAddress,
        { limit: 20 },
      );

      for (const tx of transactions) {
        if (!tx.inMessage) continue;

        const sender = tx.inMessage.info?.src;
        // Check if sender is Address (not ExternalAddress) and equals the address
        if (!sender || !(sender instanceof Address) || !sender.equals(address)) continue;

        const body = tx.inMessage.body;
        if (!body) continue;

        try {
          const slice = body.beginParse();
          const op = slice.loadUint(32);
          if (op === 2) {
            // JoinGameTon
            const txGameId = slice.loadUintBig(64);
            if (txGameId === gameId) {
              return true;
            }
          }
        } catch {
          continue;
        }
      }

      return false;
    } catch (error) {
      this.logger.error('Error verifying join transaction:', error);
      return false;
    }
  }

  /**
   * Get transaction explorer URL
   */
  getExplorerUrl(txHash: string): string {
    const network = this.configService.get<string>('ton.network') || 'testnet';
    const baseUrl =
      network === 'mainnet'
        ? 'https://tonviewer.com'
        : 'https://testnet.tonviewer.com';
    return `${baseUrl}/transaction/${txHash}`;
  }
}
