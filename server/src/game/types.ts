export interface RoomInfo {
  roomId: string;
  roomName: string;
  playersCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  createdBy: string;
  creatorAvatar?: string;
  betAmount: number;
  currency: 'TON';
  createdAt: number;
  escrowGameId?: string;
}
