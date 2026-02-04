/**
 * TonTransactionService - handles TON transactions for the Escrow contract
 */

// Default join timeout in seconds (10 minutes)
const DEFAULT_JOIN_TIMEOUT = 600;

// Gas amount for contract calls (in nanoTON)
const GAS_AMOUNT = '50000000'; // 0.05 TON

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || `${window.location.origin}/api`;

class TonTransactionService {
  constructor() {
    this.tonConnectUI = null;
    this.useMockTransactions = import.meta.env.VITE_USE_MOCK_TRANSACTIONS !== 'false';
  }

  /**
   * Set the TonConnect UI instance
   * @param {TonConnectUI} tonConnectUI
   */
  setTonConnect(tonConnectUI) {
    this.tonConnectUI = tonConnectUI;
  }

  /**
   * Check if mock mode is enabled
   * @returns {boolean}
   */
  isMockMode() {
    return this.useMockTransactions;
  }

  /**
   * Get connected wallet address
   * @returns {string|null}
   */
  getConnectedAddress() {
    if (!this.tonConnectUI) return null;
    const wallet = this.tonConnectUI.wallet;
    return wallet?.account?.address || null;
  }

  /**
   * Get CreateGameTon payload from backend
   * @param {number} amountTon - Bet amount in TON
   * @param {number} joinTimeout - Join timeout in seconds
   * @returns {Promise<{payload: string, escrowAddress: string}>}
   */
  async getCreateGameTonPayload(amountTon, joinTimeout = DEFAULT_JOIN_TIMEOUT) {
    const response = await fetch(`${API_BASE_URL}/game-http/build-create-payload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amountTon.toString(), joinTimeout }),
    });
    const data = await response.json();
    return data;
  }

  /**
   * Get JoinGameTon payload from backend
   * @param {bigint} gameId - Game ID to join
   * @returns {Promise<{payload: string, escrowAddress: string}>}
   */
  async getJoinGameTonPayload(gameId) {
    const response = await fetch(`${API_BASE_URL}/game-http/build-join-payload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId: gameId.toString() }),
    });
    const data = await response.json();
    return data;
  }

  /**
   * Create a TON game by sending CreateGameTon transaction
   * @param {number} amountTon - Bet amount in TON (not nanoTON)
   * @param {number} joinTimeout - Join timeout in seconds
   * @returns {Promise<{success: boolean, gameId?: bigint, error?: string}>}
   */
  async createGameTon(amountTon, joinTimeout = DEFAULT_JOIN_TIMEOUT) {
    if (this.useMockTransactions) {
      const mockGameId = BigInt(Date.now());
      console.log(`[MOCK] CreateGameTon: amount=${amountTon} TON, gameId=${mockGameId}`);
      return { success: true, gameId: mockGameId };
    }

    if (!this.tonConnectUI) {
      return { success: false, error: 'TonConnect not initialized' };
    }

    try {
      // Get payload from backend
      const { payload, escrowAddress } = await this.getCreateGameTonPayload(amountTon, joinTimeout);

      if (!escrowAddress) {
        return { success: false, error: 'Escrow contract address not configured' };
      }

      const amountNano = BigInt(Math.floor(amountTon * 1e9));
      const totalAmount = amountNano + BigInt(GAS_AMOUNT); // bet + gas

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: escrowAddress,
            amount: totalAmount.toString(),
            payload: payload,
          },
        ],
      };

      const result = await this.tonConnectUI.sendTransaction(transaction);

      if (result.boc) {
        // Transaction was sent, generate a mock gameId for now
        // In production, we'd verify the transaction and extract the real gameId
        const gameId = BigInt(Date.now());
        console.log(`CreateGameTon sent: boc=${result.boc.substring(0, 50)}..., gameId=${gameId}`);
        return { success: true, gameId, boc: result.boc };
      }

      return { success: false, error: 'Transaction rejected' };
    } catch (error) {
      console.error('CreateGameTon failed:', error);
      return { success: false, error: error.message || 'Transaction failed' };
    }
  }

  /**
   * Join a TON game by sending JoinGameTon transaction
   * @param {bigint} gameId - Game ID to join
   * @param {number} amountTon - Bet amount in TON (must match the game's bet)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async joinGameTon(gameId, amountTon) {
    if (this.useMockTransactions) {
      console.log(`[MOCK] JoinGameTon: gameId=${gameId}, amount=${amountTon} TON`);
      return { success: true };
    }

    if (!this.tonConnectUI) {
      return { success: false, error: 'TonConnect not initialized' };
    }

    try {
      // Get payload from backend
      const { payload, escrowAddress } = await this.getJoinGameTonPayload(gameId);

      if (!escrowAddress) {
        return { success: false, error: 'Escrow contract address not configured' };
      }

      const amountNano = BigInt(Math.floor(amountTon * 1e9));
      const totalAmount = amountNano + BigInt(GAS_AMOUNT); // bet + gas

      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: escrowAddress,
            amount: totalAmount.toString(),
            payload: payload,
          },
        ],
      };

      const result = await this.tonConnectUI.sendTransaction(transaction);

      if (result.boc) {
        console.log(`JoinGameTon sent: boc=${result.boc.substring(0, 50)}...`);
        return { success: true, boc: result.boc };
      }

      return { success: false, error: 'Transaction rejected' };
    } catch (error) {
      console.error('JoinGameTon failed:', error);
      return { success: false, error: error.message || 'Transaction failed' };
    }
  }

  /**
   * Get transaction explorer URL
   * @param {string} txHash - Transaction hash
   * @returns {string}
   */
  getExplorerUrl(txHash) {
    const network = import.meta.env.VITE_TON_NETWORK || 'testnet';
    const baseUrl = network === 'mainnet'
      ? 'https://tonviewer.com'
      : 'https://testnet.tonviewer.com';
    return `${baseUrl}/transaction/${txHash}`;
  }
}

// Export singleton instance
export const tonTransactionService = new TonTransactionService();
