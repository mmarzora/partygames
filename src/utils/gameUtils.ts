import { MOCK_DATA_BY_THEME } from '@/data/mockData';

export function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generatePlayerName(playerCount: number): string {
  return `Jugador ${playerCount + 1}`;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

export interface PhoneGameCard {
  id: string;
  playerId: string;
  options: [string, string, string]; // Exactamente 3 opciones
  selectedOption?: string; // La opción que eligió el jugador
  type: 'phone';
}

export interface DrawingGameCard {
  id: string;
  playerId: string;
  options: [string, string, string]; // 3 opciones para elegir
  selectedOption?: string;
  content: string; // El tema común para todos (puede ser redundante, pero útil para UI)
  objective: string; // El objetivo específico del jugador
  type: 'drawing';
}

export type GameCard = PhoneGameCard | DrawingGameCard;

export interface GameSession {
  id: string;
  code: string;
  hostId: string;
  gameType: string;
  theme: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  currentRound: number;
  createdAt: number;
  cards?: unknown[];
  usedOptions?: string[];
}

export const GAME_THEMES = ['Random', ...Object.keys(MOCK_DATA_BY_THEME).filter(
  t => ['Películas', 'Animales', 'Países del mundo', 'Argentina', 'Eventos históricos'].includes(t)
)]; 