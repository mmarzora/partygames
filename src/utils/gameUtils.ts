import { MOCK_DRAWING_OBJECTIVES, generateMockPhoneCards, MOCK_DATA_BY_THEME } from '@/data/mockData';

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
  gameType: 'telefono' | 'dibujo';
  theme: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  currentRound: number;
  createdAt: number;
  cards?: GameCard[];
  usedOptions?: string[]; // Frases ya usadas en la sesión
}

export const GAME_THEMES = Object.keys(MOCK_DATA_BY_THEME).filter(
  t => ['Películas', 'Animales', 'Países del mundo', 'Argentina'].includes(t)
);

export const GAME_TYPES = [
  {
    id: 'telefono',
    name: 'Teléfono descompuesto',
    description: 'Cada jugador recibe una carta diferente con 3 opciones para elegir'
  },
  {
    id: 'dibujo',
    name: 'Dibujo con objetivo secreto',
    description: 'Todos dibujan lo mismo, pero cada uno con un estilo diferente'
  }
] as const;

/**
 * Genera cartas únicas para teléfono descompuesto
 * Ahora usa el theme seleccionado para generar opciones específicas
 * TODO: Cuando implementemos OpenAI, usar el theme para generar opciones temáticas
 */
export function generatePhoneCards(players: Player[], theme: string, usedOptions: string[] = []): PhoneGameCard[] {
  const mockCards = generateMockPhoneCards(players.length, theme, usedOptions);
  return players.map((player, index) => ({
    id: `card_${player.id}`,
    playerId: player.id,
    options: mockCards[index],
    type: 'phone' as const
  }));
}

/**
 * Genera cartas para dibujo con objetivo secreto
 * Usa el theme seleccionado para el contenido común
 * TODO: Cuando implementemos OpenAI, generar objetivos específicos para el theme
 */
export function generateDrawingCards(players: Player[], theme: string, usedOptions: string[] = []): DrawingGameCard[] {
  const mockCards = generateMockPhoneCards(players.length, theme, usedOptions);
  const shuffledObjectives = [...MOCK_DRAWING_OBJECTIVES].sort(() => Math.random() - 0.5);
  return players.map((player, index) => ({
    id: `card_${player.id}`,
    playerId: player.id,
    options: mockCards[index],
    content: theme,
    objective: shuffledObjectives[index % shuffledObjectives.length],
    type: 'drawing' as const
  }));
} 