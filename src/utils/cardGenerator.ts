// TODO: Instalar openai con: npm install openai
// import OpenAI from 'openai';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

import { GameCard, Player } from './gameUtils';
import { getGameTypeById } from '@/games';

/**
 * Función principal para generar cartas
 * Ahora usa la arquitectura modular de juegos
 */
export async function generateCards(
  gameType: string,
  theme: string,
  players: Player[],
  usedOptions: string[] = []
): Promise<{ cards: GameCard[], newUsedOptions: string[] }> {
  const game = getGameTypeById(gameType);
  if (!game) throw new Error('Tipo de juego no soportado');
  const cards = game.generateCards(players, theme, usedOptions);
  // Calcular el nuevo historial de frases usadas
  const allOptions = cards.flatMap(card => card.options);
  const newUsedOptions = [...usedOptions, ...allOptions];
  return { cards, newUsedOptions };
}

// ===== FUNCIONES PARA CUANDO IMPLEMENTEMOS OPENAI =====

/**
 * Genera cartas de teléfono descompuesto usando OpenAI
 * TODO: Implementar esta función
 */
export async function generatePhoneCardsWithAI(
  theme: string,
  playerCount: number
): Promise<Array<[string, string, string]>> {
  // TODO: Implementar llamada a OpenAI
  console.log(`Generando ${playerCount * 3} opciones de ${theme} para ${playerCount} jugadores`);
  
  // const prompt = `Genera ${playerCount * 3} opciones diferentes de ${theme} para dibujar. 
  // Cada opción debe ser específica y objetiva, como "Titanic hundiéndose" o "Harry Potter con su varita".
  // Devuelve solo las opciones, una por línea.`;
  
  // const response = await openai.chat.completions.create({
  //   model: "gpt-3.5-turbo",
  //   messages: [{ role: "user", content: prompt }],
  //   max_tokens: 500
  // });
  
  // const options = response.choices[0].message.content?.split('\n').filter(line => line.trim());
  // // Agrupar en sets de 3 para cada jugador
  
  throw new Error('OpenAI no implementado aún. Usa generateCards() que usa datos mock.');
}

/**
 * Genera objetivos de dibujo usando OpenAI
 * TODO: Implementar esta función
 */
export async function generateDrawingObjectivesWithAI(
  theme: string,
  playerCount: number
): Promise<string[]> {
  // TODO: Implementar llamada a OpenAI
  console.log(`Generando ${playerCount} objetivos de dibujo para tema: ${theme}`);
  
  // const prompt = `Genera ${playerCount} estilos diferentes para dibujar ${theme}. 
  // Ejemplos: "como si fueras un niño de 5 años", "al estilo Picasso", "lo más triste posible".
  // Devuelve solo los estilos, uno por línea.`;
  
  throw new Error('OpenAI no implementado aún. Usa generateCards() que usa datos mock.');
}

// ===== FUNCIONES LEGACY (mantenidas para compatibilidad) =====

export async function generatePhoneCards_Legacy(theme: string, count: number = 5): Promise<string[]> {
  // Función legacy que devuelve ejemplos genéricos
  return LEGACY_PHONE_EXAMPLES.slice(0, count).map(example => 
    example.replace('${theme}', theme)
  );
}

export async function generateDrawingObjectives(theme: string, count: number = 5): Promise<string[]> {
  // Función legacy que devuelve ejemplos genéricos
  return LEGACY_DRAWING_EXAMPLES.slice(0, count).map(example => 
    example.replace('${theme}', theme)
  );
} 