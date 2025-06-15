import { GameType } from './GameType';
import { TelefonoGame } from './telefono';
import { DibujoGame } from './dibujo';

export const GAME_TYPES: GameType[] = [TelefonoGame, DibujoGame];

export function getGameTypeById(id: string): GameType | undefined {
  return GAME_TYPES.find(g => g.id === id);
} 