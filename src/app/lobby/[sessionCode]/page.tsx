'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { generatePlayerName, GameSession, Player, PhoneGameCard, DrawingGameCard } from '@/utils/gameUtils';
import { 
  getGameSession, 
  joinGameSession, 
  subscribeToSession,
  generatePlayerId,
  leaveSession
} from '@/utils/firebaseOperations';
import { generateMockPhoneCards, MOCK_DRAWING_OBJECTIVES } from '@/data/mockData';

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const sessionCode = params.sessionCode as string;
  
  const [playerName, setPlayerName] = useState('');
  const [playerId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('playerId_' + sessionCode);
      if (stored) return stored;
    }
    return generatePlayerId();
  });
  const [isJoined, setIsJoined] = useState(false);
  const [sessionData, setSessionData] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCard, setPlayerCard] = useState<PhoneGameCard | DrawingGameCard | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinError, setJoinError] = useState('');

  const getPlayerCard = useCallback((session: GameSession): PhoneGameCard | DrawingGameCard | null => {
    if (!session.cards) return null;
    
    // Buscar la carta específica del jugador
    const card = session.cards.find(c => {
      if (c.type === 'phone') {
        return (c as PhoneGameCard).playerId === playerId;
      } else {
        return c.id === `card_${playerId}`;
      }
    });
    
    return card as PhoneGameCard | DrawingGameCard || null;
  }, [playerId]);

  // Verificar si el jugador actual ya está en la sesión
  const checkIfPlayerInSession = useCallback((session: GameSession): boolean => {
    return session.players.some(player => player.id === playerId);
  }, [playerId]);

  // Cargar datos iniciales de la sesión
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await getGameSession(sessionCode);
        if (!session) {
          setError('Sesión no encontrada');
          return;
        }
        
        setSessionData(session);
        setPlayers(session.players);
        
        // Verificar si el jugador ya está en la sesión
        const playerAlreadyInSession = checkIfPlayerInSession(session);
        if (playerAlreadyInSession) {
          setIsJoined(true);
          // Obtener el nombre del jugador de la sesión
          const currentPlayer = session.players.find(p => p.id === playerId);
          if (currentPlayer) {
            setPlayerName(currentPlayer.name);
          }
        }
        
        // Si el juego ya empezó, mostrar la carta
        if (session.status === 'playing') {
          setGameStarted(true);
          const card = getPlayerCard(session);
          setPlayerCard(card);
        }
        
        // Generar nombre por defecto solo si no está en la sesión
        if (!playerAlreadyInSession) {
          setPlayerName(generatePlayerName(session.players.length));
        }
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Error al cargar la sesión');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionCode, getPlayerCard, checkIfPlayerInSession, playerId]);

  // Suscribirse a cambios en tiempo real después de unirse
  useEffect(() => {
    if (!isJoined) return;

    const unsubscribe = subscribeToSession(sessionCode, (session) => {
      if (!session) {
        setError('La sesión ha terminado');
        return;
      }

      setSessionData(session);
      setPlayers(session.players);

      // Si el juego empezó, mostrar la carta
      if (session.status === 'playing' && !gameStarted) {
        setGameStarted(true);
        const card = getPlayerCard(session);
        setPlayerCard(card);
      }
    });

    return () => unsubscribe();
  }, [isJoined, sessionCode, gameStarted, getPlayerCard]);

  // Limpiar al salir
  useEffect(() => {
    return () => {
      if (isJoined) {
        leaveSession(sessionCode, playerId);
      }
    };
  }, [isJoined, sessionCode, playerId]);

  const handleJoinSession = async () => {
    if (!playerName.trim()) {
      setJoinError('Por favor ingresa tu nombre');
      return;
    }

    setLoading(true);
    setJoinError('');

    try {
      await joinGameSession(sessionCode, playerName, playerId);
      setIsJoined(true);
    } catch (err: unknown) {
      console.error('Error joining session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al unirse a la sesión';
      setJoinError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    // TODO: Guardar la selección en Firebase
  };

  const regenerateLocalCard = () => {
    if (!sessionData || !players.length) return;

    if (sessionData.gameType === 'telefono') {
      // Generar una nueva carta de teléfono descompuesto solo para este jugador
      const allCards = generateMockPhoneCards(players.length, sessionData.theme);
      const idx = players.findIndex(p => p.id === playerId);
      if (idx !== -1) {
        setPlayerCard({
          id: `card_${playerId}`,
          playerId,
          options: allCards[idx],
          type: 'phone'
        });
      }
    } else if (sessionData.gameType === 'dibujo') {
      const allCards = generateMockPhoneCards(players.length, sessionData.theme);
      let idx = players.findIndex(p => p.id === playerId);
      console.log('DEBUG regenerateLocalCard:', { players, playerId, idx });
      if (idx === -1) {
        idx = 0; // fallback: usa la primera carta
        console.warn('Jugador no encontrado en la lista de players al regenerar carta');
      }
      const shuffled = [...MOCK_DRAWING_OBJECTIVES].sort(() => Math.random() - 0.5);
      setPlayerCard({
        id: `card_${playerId}`,
        playerId,
        options: allCards[idx],
        content: sessionData.theme,
        objective: shuffled[0],
        type: 'drawing'
      });
    }
    setSelectedOption('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-800">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-pink-600 to-purple-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">❌ Error</h1>
          <p className="text-gray-800 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
          >
            🏠 Volver al Inicio
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('playerId_' + sessionCode);
              }
              router.push('/host');
            }}
            className="w-full mt-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-teal-600 transition-all duration-200"
          >
            🎲 Crear nueva partida
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('playerId_' + sessionCode);
              }
              router.push('/');
            }}
            className="w-full mt-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
          >
            🔑 Unirse a otra sesión
          </button>
        </div>
      </div>
    );
  }

  if (gameStarted && playerCard) {
    if (playerCard.type === 'phone') {
      const phoneCard = playerCard as PhoneGameCard;
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-600 via-teal-600 to-blue-500 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">🎬 Tu Carta</h1>
              <p className="text-gray-800">Elige una opción para dibujar</p>
            </div>
            
            <div className="space-y-3 mb-6">
              {phoneCard.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedOption === option
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="font-bold text-lg mr-3 text-blue-600">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="font-medium text-gray-800">{option}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedOption && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">✅ Opción seleccionada:</h3>
                <p className="text-green-700 font-medium">&ldquo;{selectedOption}&rdquo;</p>
              </div>
            )}
            
            <div className="text-sm text-gray-800 space-y-2 text-center">
              <p>📝 Dibuja tu opción seleccionada en papel</p>
              <p>⏰ Tienes todo el tiempo que necesites</p>
              <p>🎯 ¡Que comience la diversión!</p>
            </div>

            <div className="mt-6 bg-gray-50 rounded-lg p-3 text-sm text-gray-800">
              <p><span className="font-medium">Jugadores:</span> {players.length}</p>
              <p><span className="font-medium">Tipo:</span> Teléfono descompuesto</p>
              <p><span className="font-medium">Tema:</span> {sessionData?.theme}</p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={regenerateLocalCard}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-teal-600 transition-all duration-200"
              >
                🔄 Nueva carta
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('playerId_' + sessionCode);
                  }
                  router.push('/');
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
              >
                🏠 Volver al inicio
              </button>
            </div>
          </div>
        </div>
      );
    } else {
      const drawingCard = playerCard as DrawingGameCard;
      return (
        <div className="min-h-screen bg-gradient-to-br from-green-600 via-teal-600 to-blue-500 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">🎨 ¡Juego Iniciado!</h1>
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Elige qué dibujar:</h2>
              <div className="space-y-3 mb-6">
                {drawingCard.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOption(option)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedOption === option
                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="font-bold text-lg mr-3 text-blue-600">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="font-medium text-gray-800">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
                {selectedOption && (
                  <>
                    <h3 className="font-semibold text-green-800 mb-2">✅ Opción seleccionada:</h3>
                    <p className="text-green-700 font-medium">&ldquo;{selectedOption}&rdquo;</p>
                  </>
                )}
                <h4 className="font-semibold text-blue-800 mt-4 mb-1">🎯 Tu objetivo secreto:</h4>
                <p className="text-blue-700 font-medium">{drawingCard.objective}</p>
              </div>
            </div>
            <div className="text-sm text-gray-800 space-y-2 mb-6">
              <p>📝 Dibuja tu opción seleccionada en papel, ¡pero siguiendo tu objetivo secreto!</p>
              <p>⏰ Tienes todo el tiempo que necesites</p>
              <p>🎯 ¡Que comience la diversión!</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800">
              <p><span className="font-medium">Jugadores:</span> {players.length}</p>
              <p><span className="font-medium">Tema:</span> {sessionData?.theme}</p>
              <p><span className="font-medium">Tipo:</span> Dibujo con objetivo secreto</p>
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={regenerateLocalCard}
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-teal-600 transition-all duration-200"
              >
                🔄 Nueva carta
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('playerId_' + sessionCode);
                  }
                  router.push('/');
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
              >
                🏠 Volver al inicio
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🚀 Unirse a Sesión</h1>
            <div className="bg-gray-100 rounded-xl p-4 mb-4 text-gray-800">
              <p className="text-sm text-gray-800 mb-1">Código de sesión:</p>
              <p className="text-3xl font-mono font-bold text-blue-600 tracking-wider">{sessionCode}</p>
            </div>
          </div>

          {sessionData && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Información del juego:</h3>
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1 text-gray-800">
                <p><span className="font-medium">Tipo:</span> {sessionData.gameType === 'telefono' ? 'Teléfono descompuesto' : 'Dibujo con objetivo'}</p>
                <p><span className="font-medium">Tema:</span> {sessionData.gameType === 'telefono' ? 'Películas' : sessionData.theme}</p>
                <p><span className="font-medium">Estado:</span> {sessionData.status === 'waiting' ? 'Esperando jugadores' : 'En juego'}</p>
                <p><span className="font-medium">Jugadores:</span> {players.length}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-2">Tu nombre:</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ingresa tu nombre"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={20}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
              />
            </div>

            {joinError && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                {joinError}
              </div>
            )}

            <button
              onClick={handleJoinSession}
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-green-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-teal-600 hover:to-green-600 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Uniéndose...' : '🎯 Unirse al Juego'}
            </button>
          </div>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('playerId_' + sessionCode);
              }
              router.push('/');
            }}
            className="w-full mt-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
          >
            🏠 Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">⏳ Sala de Espera</h1>
          <div className="bg-gray-100 rounded-xl p-3 mb-4">
            <p className="text-sm text-gray-800 mb-1">Sesión:</p>
            <p className="text-2xl font-mono font-bold text-blue-600 tracking-wider">{sessionCode}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">Jugadores conectados ({players.length}):</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {players.map((player) => (
              <div 
                key={player.id} 
                className={`rounded-lg p-3 text-sm flex items-center justify-between ${
                  player.id === playerId 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50'
                }`}
              >
                <span className={`font-medium ${player.id === playerId ? 'text-green-800' : 'text-gray-800'}`}>
                  {player.name}
                </span>
                <div className="flex items-center space-x-1">
                  {player.isHost && <span className="text-yellow-600">👑</span>}
                  {player.id === playerId && <span className="text-green-600 text-xs">(Tú)</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-2">Configuración del juego:</h3>
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1 text-gray-800">
            <p><span className="font-medium">Tipo:</span> {sessionData?.gameType === 'telefono' ? 'Teléfono descompuesto' : 'Dibujo con objetivo'}</p>
            <p><span className="font-medium">Tema:</span> {sessionData?.gameType === 'telefono' ? 'Películas' : sessionData?.theme}</p>
          </div>
        </div>

        <div className="text-center text-sm text-gray-800">
          <p>💡 Esperando a que el host inicie la partida</p>
          <p>Mientras tanto, prepara papel y lápiz 📝</p>
        </div>
        <button
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('playerId_' + sessionCode);
            }
            router.push('/');
          }}
          className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
        >
          🏠 Volver al inicio
        </button>
      </div>
    </div>
  );
} 