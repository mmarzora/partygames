'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { generatePlayerName, GameSession, Player, PhoneGameCard, DrawingGameCard, GAME_THEMES, generatePhoneCards } from '@/utils/gameUtils';
import { 
  getGameSession, 
  joinGameSession, 
  subscribeToSession,
  generatePlayerId,
  leaveSession,
  startNewRound
} from '@/utils/firebaseOperations';
import { MOCK_DRAWING_OBJECTIVES } from '@/data/mockData';

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
  const [showNewRoundModal, setShowNewRoundModal] = useState(false);
  const [newRoundTheme, setNewRoundTheme] = useState<string>('');
  const [newRoundLoading, setNewRoundLoading] = useState(false);
  const isHost = sessionData?.players.find(p => p.id === playerId)?.isHost;

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

      // Si el juego está en curso, siempre actualizar la carta y el estado de ronda
      if (session.status === 'playing') {
        setGameStarted(true);
        const card = getPlayerCard(session);
        setPlayerCard(card);
        setSelectedOption(''); // Resetear selección al cambiar de ronda
      }
    });

    return () => unsubscribe();
  }, [isJoined, sessionCode, getPlayerCard]);

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

    const usedOptions = sessionData.usedOptions || [];
    console.log('usedOptions al regenerar carta:', usedOptions);

    if (sessionData.gameType === 'telefono') {
      // Generar una nueva carta de teléfono descompuesto solo para este jugador
      const allCards = generatePhoneCards(players, sessionData.theme, usedOptions);
      const idx = players.findIndex(p => p.id === playerId);
      if (idx !== -1) {
        setPlayerCard({
          id: `card_${playerId}`,
          playerId,
          options: allCards[idx].options,
          type: 'phone'
        });
      }
    } else if (sessionData.gameType === 'dibujo') {
      const allCards = generatePhoneCards(players, sessionData.theme, usedOptions);
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
        options: allCards[idx].options,
        content: sessionData.theme,
        objective: shuffled[0],
        type: 'drawing'
      });
    }
    setSelectedOption('');
  };

  // El modal debe ir dentro del componente, antes del return final
  let newRoundModal = null;
  if (showNewRoundModal) {
    newRoundModal = (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs text-center">
          <h2 className="text-xl font-bold mb-4 text-gray-800">Selecciona el tema</h2>
          <select
            className="w-full p-3 rounded-xl border border-gray-300 mb-4 text-gray-800"
            value={newRoundTheme}
            onChange={e => setNewRoundTheme(e.target.value)}
          >
            {GAME_THEMES.map(theme => (
              <option key={theme} value={theme}>{theme}</option>
            ))}
          </select>
          <div className="flex flex-col gap-2">
            <button
              onClick={async () => {
                setNewRoundLoading(true);
                await startNewRound(
                  sessionCode,
                  newRoundTheme,
                  sessionData?.gameType || 'telefono',
                  players,
                  sessionData?.usedOptions || []
                );
                setShowNewRoundModal(false);
                setNewRoundLoading(false);
              }}
              disabled={newRoundLoading}
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-teal-600 transition-all duration-200 disabled:opacity-50"
            >
              {newRoundLoading ? 'Generando...' : 'Confirmar'}
            </button>
            <button
              onClick={() => setShowNewRoundModal(false)}
              className="w-full bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-xl hover:bg-gray-300 transition-all duration-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <>
          {newRoundModal}
          <div className="min-h-screen bg-gradient-to-br from-green-600 via-teal-600 to-blue-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">🎬 Tu Carta</h1>
                <div className="text-sm text-gray-700 font-medium flex items-center justify-center gap-2 mb-1">
                  <span>👤 {playerName}</span>
                  {sessionData?.currentRound && (
                    <span>· 🔵 Ronda {sessionData.currentRound}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">Elige una opción para dibujar</p>
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

              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={regenerateLocalCard}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-600 hover:to-teal-600 transition-all duration-200"
                >
                  🔄 Nueva carta
                </button>
                {isHost && (
                  <button
                    onClick={() => {
                      setNewRoundTheme(sessionData?.theme || '');
                      setShowNewRoundModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200"
                  >
                    ➕ Nueva ronda
                  </button>
                )}
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

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                <p className="font-semibold mb-1">¿Cómo sigue la ronda?</p>
                <ol className="list-decimal list-inside text-left space-y-1 pl-2">
                  <li>Cada jugador dibuja su frase en papel.</li>
                  <li>Pasa el dibujo al siguiente jugador (en círculo).</li>
                  <li>El siguiente jugador intenta adivinar la frase solo viendo el dibujo y la escribe.</li>
                  <li>Se repite: alterna dibujo y frase hasta terminar la ronda.</li>
                  <li>¡Al final, revelen la cadena completa y ríanse con los resultados!</li>
                </ol>
              </div>

              <div className="mt-6 bg-gray-50 rounded-lg p-3 text-sm text-gray-800">
                <p><span className="font-medium">Jugadores:</span> {players.length}</p>
                <p><span className="font-medium">Tipo:</span> Teléfono descompuesto</p>
                <p><span className="font-medium">Tema:</span> {sessionData?.theme}</p>
              </div>
            </div>
          </div>
        </>
      );
    } else {
      const drawingCard = playerCard as DrawingGameCard;
      return (
        <>
          {newRoundModal}
          <div className="min-h-screen bg-gradient-to-br from-green-600 via-teal-600 to-blue-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">🎨 ¡Juego Iniciado!</h1>
              <div className="text-sm text-gray-700 font-medium flex items-center justify-center gap-2 mb-1">
                <span>👤 {playerName}</span>
                {sessionData?.currentRound && (
                  <span>· 🔵 Ronda {sessionData.currentRound}</span>
                )}
              </div>
              <p className="text-xs text-gray-500">Elige una opción para dibujar</p>
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
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                  <p className="font-semibold mb-1">¿Cómo sigue la ronda?</p>
                  <ol className="list-decimal list-inside text-left space-y-1 pl-2">
                    <li>Cada jugador dibuja su opción en papel, siguiendo su objetivo secreto.</li>
                    <li>Los demás intentan adivinar cuál era el objetivo secreto del dibujo.</li>
                    <li>¡Comparen respuestas y vean quién adivinó mejor!</li>
                  </ol>
                </div>
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
                {isHost && (
                  <button
                    onClick={() => {
                      setNewRoundTheme(sessionData?.theme || '');
                      setShowNewRoundModal(true);
                    }}
                    className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200"
                  >
                    ➕ Nueva ronda
                  </button>
                )}
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

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
                <p className="font-semibold mb-1">¿Cómo sigue la ronda?</p>
                <ol className="list-decimal list-inside text-left space-y-1 pl-2">
                  <li>Cada jugador dibuja su frase en papel.</li>
                  <li>Pasa el dibujo al siguiente jugador (en círculo).</li>
                  <li>El siguiente jugador intenta adivinar la frase solo viendo el dibujo y la escribe.</li>
                  <li>Se repite: alterna dibujo y frase hasta terminar la ronda.</li>
                  <li>¡Al final, revelen la cadena completa y ríanse con los resultados!</li>
                </ol>
              </div>

              <div className="mt-6 bg-gray-50 rounded-lg p-3 text-sm text-gray-800">
                <p><span className="font-medium">Jugadores:</span> {players.length}</p>
                <p><span className="font-medium">Tipo:</span> Teléfono descompuesto</p>
                <p><span className="font-medium">Tema:</span> {sessionData?.theme}</p>
              </div>
            </div>
          </div>
        </>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
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
    <>
      {newRoundModal}
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
    </>
  );
} 