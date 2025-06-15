'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GAME_TYPES, GAME_THEMES, Player } from '@/utils/gameUtils';
import { 
  createGameSession, 
  addHostAsPlayer, 
  subscribeToSession, 
  startGame,
  generatePlayerId,
  getGameSession
} from '@/utils/firebaseOperations';
import { generateCards } from '@/utils/cardGenerator';

export default function HostPage() {
  const [sessionCode, setSessionCode] = useState('');
  const [gameType, setGameType] = useState<'telefono' | 'dibujo'>('telefono');
  const [theme, setTheme] = useState('Películas');
  const [customTheme, setCustomTheme] = useState('');
  const [hostName, setHostName] = useState('Host');
  const [players, setPlayers] = useState<Player[]>([]);
  const [sessionCreated, setSessionCreated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hostId] = useState(() => generatePlayerId());
  const router = useRouter();

  // Suscribirse a cambios de la sesión en tiempo real
  useEffect(() => {
    if (!sessionCreated || !sessionCode) return;

    const unsubscribe = subscribeToSession(sessionCode, (session) => {
      if (session) {
        setPlayers(session.players);
        
        // Si el juego ya empezó, redirigir al lobby
        if (session.status === 'playing') {
          router.push(`/lobby/${sessionCode}`);
        }
      }
    });

    return () => unsubscribe();
  }, [sessionCreated, sessionCode, router]);

  // Cuando cambia el tipo de juego, resetear el tema apropiadamente
  useEffect(() => {
    if (gameType === 'telefono') {
      setTheme('Películas'); // Para teléfono descompuesto, usar Películas por defecto
    } else {
      setTheme(''); // Para dibujo, resetear para que el usuario elija
    }
    setCustomTheme('');
  }, [gameType]);

  const handleCreateSession = async () => {
    const finalTheme = theme === 'custom' ? customTheme : theme;
    
    if (!finalTheme) {
      setError('Por favor selecciona o escribe un tema');
      return;
    }

    if (!hostName.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Crear sesión en Firebase
      const session = await createGameSession(gameType, finalTheme, hostId);
      setSessionCode(session.code);
      
      // Guardar el hostId en localStorage para persistencia
      if (typeof window !== 'undefined') {
        localStorage.setItem('playerId_' + session.code, hostId);
      }
      
      // Agregar el host como jugador
      await addHostAsPlayer(session.code, hostName, hostId);
      
      setSessionCreated(true);
    } catch (err) {
      console.error('Error creating session:', err);
      setError('Error al crear la sesión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    if (players.length === 0) {
      setError('Necesitas al menos un jugador para empezar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generar cartas para el juego
      const finalTheme = theme === 'custom' ? customTheme : theme;
      // Obtener el historial de frases usadas de la sesión (si existe)
      let usedOptions: string[] = [];
      if (sessionCode) {
        const session = await getGameSession(sessionCode);
        if (session && session.usedOptions) {
          usedOptions = session.usedOptions;
        }
      }
      // Generar cartas y nuevo historial
      const { cards, newUsedOptions } = await generateCards(gameType, finalTheme, players, usedOptions);
      // Iniciar juego en Firebase con el historial actualizado
      await startGame(sessionCode, cards, newUsedOptions);
      // Redirigir al lobby (el useEffect detectará el cambio)
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Error al iniciar el juego. Intenta de nuevo.');
      setLoading(false);
    }
  };

  if (sessionCreated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🎮 Sesión Creada</h1>
            <div className="bg-gray-100 rounded-xl p-4 mb-4 text-gray-800">
              <p className="text-sm text-gray-800 mb-1">Código de sesión:</p>
              <p className="text-3xl font-mono font-bold text-blue-600 tracking-wider">{sessionCode}</p>
            </div>
            <p className="text-gray-800">Comparte este código con tus amigos</p>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Configuración:</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800">
              <p><span className="font-medium">Juego:</span> {GAME_TYPES.find(g => g.id === gameType)?.name}</p>
              <p><span className="font-medium">Tema:</span> {theme === 'custom' ? customTheme : theme}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Jugadores conectados ({players.length}):</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {players.length === 0 ? (
                <p className="text-gray-800 text-sm italic">Esperando jugadores...</p>
              ) : (
                players.map((player) => (
                  <div key={player.id} className="bg-gray-50 rounded-lg p-2 text-sm flex items-center justify-between">
                    <span>{player.name}</span>
                    {player.isHost && <span className="text-yellow-600">👑</span>}
                  </div>
                ))
              )}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleStartGame}
            disabled={players.length === 0 || loading}
            className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-green-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? '⏳ Iniciando...' : '🚀 Iniciar Partida'}
          </button>

          {sessionCreated && (
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
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎯 Crear Sesión</h1>
          <p className="text-gray-800">Configura tu juego</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-2">Tu nombre:</label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="Ingresa tu nombre"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-3">Tipo de juego:</label>
            <div className="space-y-2">
              {GAME_TYPES.map((type: { id: string; name: string; description: string }) => (
                <label key={type.id} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="gameType"
                    value={type.id}
                    checked={gameType === type.id}
                    onChange={(e) => setGameType(e.target.value as 'telefono' | 'dibujo')}
                    className="mt-1 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-gray-800">{type.name}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-3">
              Tema:
            </label>
            <div className="space-y-2">
              {GAME_THEMES.map((themeOption: string) => (
                <label key={themeOption} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value={themeOption}
                    checked={theme === themeOption}
                    onChange={(e) => setTheme(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-gray-800">{themeOption}</span>
                </label>
              ))}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="theme"
                  value="custom"
                  checked={theme === 'custom'}
                  onChange={(e) => setTheme(e.target.value)}
                  className="text-blue-600"
                />
                <span className="text-gray-800">Personalizado</span>
              </label>
            </div>
            
            {theme === 'custom' && (
              <input
                type="text"
                placeholder="Ej: Películas de Studio Ghibli, Memes de internet..."
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>

          {gameType === 'telefono' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <span className="font-medium">📽️ Teléfono Descompuesto:</span> Cada jugador recibirá una carta con 3 opciones del tema seleccionado para elegir y dibujar.
              </p>
            </div>
          )}

          {gameType === 'dibujo' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <span className="font-medium">🎨 Dibujo con Objetivo:</span> Todos dibujarán el mismo tema, pero cada uno con un estilo diferente y secreto.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleCreateSession}
            disabled={loading || !theme || (theme === 'custom' && !customTheme)}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Creando...' : '🎮 Crear Sesión'}
          </button>
        </div>
      </div>
    </div>
  );
} 