export interface RoomInfo {
  roomId: string;
  roomName: string;
  playersCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  createdBy: string;
  betAmount: number;
  currency: string;
  createdAt: number;
}
