import { GameType } from './GameType';
import { generateMockPhoneCards, MOCK_DRAWING_OBJECTIVES } from '@/data/mockData';
import { Player } from '@/utils/gameUtils';

export const DibujoGame: GameType = {
  id: 'dibujo',
  name: 'Dibujo con objetivo',
  description: 'Todos dibujan el mismo tema, pero cada uno con un estilo diferente y secreto.',
  generateCards: (players: Player[], theme: string, usedOptions: string[]) => {
    const mockCards = generateMockPhoneCards(players.length, theme, usedOptions);
    const shuffledObjectives = [...MOCK_DRAWING_OBJECTIVES].sort(() => Math.random() - 0.5);
    return players.map((player, idx) => ({
      id: `card_${player.id}`,
      playerId: player.id,
      options: mockCards[idx],
      content: theme,
      objective: shuffledObjectives[idx % shuffledObjectives.length],
      type: 'drawing'
    }));
  },
  getInitialState: (players) => {
    return {
      id: '',
      code: '',
      hostId: '',
      gameType: 'dibujo',
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