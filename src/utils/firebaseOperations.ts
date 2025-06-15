import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  arrayUnion, 
  arrayRemove
} from 'firebase/firestore';
import { db } from './firebase';
import { GameSession, Player, generateSessionCode, GameCard } from './gameUtils';
import { getGameTypeById } from '@/games';

// Colección de sesiones en Firestore
const SESSIONS_COLLECTION = 'gameSessions';

/**
 * Crear una nueva sesión de juego
 */
export async function createGameSession(
  gameType: 'telefono' | 'dibujo',
  theme: string,
  hostId: string
): Promise<GameSession> {
  const sessionCode = generateSessionCode();
  
  // Verificar que el código no exista
  const existingSession = await getGameSession(sessionCode);
  if (existingSession) {
    // Si existe, generar otro código recursivamente
    return createGameSession(gameType, theme, hostId);
  }

  const session: GameSession = {
    id: sessionCode,
    code: sessionCode,
    hostId,
    gameType,
    theme,
    status: 'waiting',
    players: [],
    currentRound: 0,
    createdAt: Date.now(),
    cards: []
  };

  await setDoc(doc(db, SESSIONS_COLLECTION, sessionCode), session);
  return session;
}

/**
 * Obtener una sesión por código
 */
export async function getGameSession(sessionCode: string): Promise<GameSession | null> {
  try {
    const sessionDoc = await getDoc(doc(db, SESSIONS_COLLECTION, sessionCode));
    if (sessionDoc.exists()) {
      return sessionDoc.data() as GameSession;
    }
    return null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Unirse a una sesión como jugador
 */
export async function joinGameSession(
  sessionCode: string,
  playerName: string,
  playerId: string
): Promise<boolean> {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error('Sesión no encontrada');
    }

    const session = sessionDoc.data() as GameSession;
    
    // Verificar que el nombre no esté duplicado
    const nameExists = session.players.some(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (nameExists) {
      throw new Error('Ese nombre ya está en uso');
    }

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      isHost: false,
      joinedAt: Date.now()
    };

    await updateDoc(sessionRef, {
      players: arrayUnion(newPlayer)
    });

    return true;
  } catch (error) {
    console.error('Error joining session:', error);
    throw error;
  }
}

/**
 * Agregar el host como jugador inicial
 */
export async function addHostAsPlayer(
  sessionCode: string,
  hostName: string,
  hostId: string
): Promise<void> {
  const hostPlayer: Player = {
    id: hostId,
    name: hostName,
    isHost: true,
    joinedAt: Date.now()
  };

  await updateDoc(doc(db, SESSIONS_COLLECTION, sessionCode), {
    players: arrayUnion(hostPlayer)
  });
}

/**
 * Iniciar el juego (cambiar estado a 'playing')
 */
export async function startGame(sessionCode: string, cards: GameCard[], usedOptions: string[]): Promise<void> {
  await updateDoc(doc(db, SESSIONS_COLLECTION, sessionCode), {
    status: 'playing',
    cards: cards,
    currentRound: 1,
    usedOptions: usedOptions
  });
}

/**
 * Escuchar cambios en una sesión en tiempo real
 */
export function subscribeToSession(
  sessionCode: string,
  callback: (session: GameSession | null) => void
): () => void {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  
  return onSnapshot(sessionRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as GameSession);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to session:', error);
    callback(null);
  });
}

/**
 * Salir de una sesión
 */
export async function leaveSession(sessionCode: string, playerId: string): Promise<void> {
  try {
    const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) return;
    
    const session = sessionDoc.data() as GameSession;
    const playerToRemove = session.players.find(p => p.id === playerId);
    
    if (playerToRemove) {
      await updateDoc(sessionRef, {
        players: arrayRemove(playerToRemove)
      });
    }
  } catch (error) {
    console.error('Error leaving session:', error);
  }
}

/**
 * Finalizar una sesión
 */
export async function endSession(sessionCode: string): Promise<void> {
  await updateDoc(doc(db, SESSIONS_COLLECTION, sessionCode), {
    status: 'finished'
  });
}

/**
 * Generar un ID único para jugadores
 */
export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Iniciar una nueva ronda (puede cambiar el tema)
 */
export async function startNewRound(
  sessionCode: string,
  theme: string,
  gameType: string,
  players: Player[],
  usedOptions: string[] = []
): Promise<void> {
  const game = getGameTypeById(gameType);
  if (!game) throw new Error('Tipo de juego no soportado');
  const cards = game.generateCards(players, theme, usedOptions);
  // Calcular el nuevo historial de frases usadas
  const allOptions = cards.flatMap(card => card.options);
  const newUsedOptions = [...usedOptions, ...allOptions];
  console.log('usedOptions al iniciar nueva ronda:', newUsedOptions);

  // Obtener la sesión actual para incrementar la ronda
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionCode);
  const sessionDoc = await getDoc(sessionRef);
  let currentRound = 1;
  if (sessionDoc.exists()) {
    const session = sessionDoc.data() as GameSession;
    currentRound = (session.currentRound || 0) + 1;
  }

  await updateDoc(sessionRef, {
    status: 'playing',
    theme,
    cards,
    currentRound,
    usedOptions: newUsedOptions
  });
}