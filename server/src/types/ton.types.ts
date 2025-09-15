export interface Account {
  address: string;
  publicKey: string;
  chain: string;           // Added chain field
  walletStateInit?: string; // Made optional
}

export interface TonProof {
  proof: {
    timestamp: number;
    domain: string;        // Changed from object to string
    payload: string;
    signature: string;
  };
}

export interface ChallengeResponse {
  challenge: string;
  validUntil: number;
  clientId: string;
}

export interface VerifyProofRequest {
  account: Account;
  tonProof: TonProof;
  clientId: string;
}