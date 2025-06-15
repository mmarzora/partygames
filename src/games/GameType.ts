// Interfaz base para un tipo de juego
import { Player } from '@/utils/gameUtils';

export interface GameCard {
  id: string;
  playerId: string;
  options: string[];
  [key: string]: any;
}

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
    answers: any[]
  ): Record<string, number>;
  validateAnswer?(
    card: GameCard,
    answer: any
  ): boolean;
  // renderCardComponent?: (props: any) => JSX.Element;
} 