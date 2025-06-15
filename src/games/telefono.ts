import { GameType } from './GameType';
import { generateMockPhoneCards } from '@/data/mockData';
import { Player } from '@/utils/gameUtils';

export const TelefonoGame: GameType = {
  id: 'telefono',
  name: 'Teléfono descompuesto',
  description: 'Cada jugador recibe una carta con 3 opciones para elegir y dibujar.',
  generateCards: (players: Player[], theme: string, usedOptions: string[]) => {
    const mockCards = generateMockPhoneCards(players.length, theme, usedOptions);
    return players.map((player, idx) => ({
      id: `card_${player.id}`,
      playerId: player.id,
      options: mockCards[idx],
      type: 'phone'
    }));
  },
  getInitialState: (players) => {
    return {
      id: '',
      code: '',
      hostId: '',
      gameType: 'telefono',
      theme: '',
      status: 'waiting',
      players: players as Player[],
      currentRound: 1,
      createdAt: Date.now(),
      cards: [],
      usedOptions: []
    };
  }
}; 