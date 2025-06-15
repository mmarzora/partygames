// Interfaz base para un tipo de juego
import { Player, GameSession, GameCard } from '@/utils/gameUtils';

export interface GameType {
  id: string;
  name: string;
  description: string;
  generateCards(
    players: Player[],
    theme: string,
    usedOptions: string[]
  ): GameCard[];
  calculateScores?(
    cards: GameCard[],
    answers: unknown[]
  ): Record<string, number>;
  validateAnswer?(
    card: GameCard,
    answer: unknown
  ): boolean;
  // renderCardComponent?: (props: any) => JSX.Element;
  getInitialState: (players: unknown[], options?: unknown) => GameSession;
} 