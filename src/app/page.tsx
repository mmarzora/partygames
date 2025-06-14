'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [sessionCode, setSessionCode] = useState('');
  const router = useRouter();

  const handleCreateSession = () => {
    router.push('/host');
  };

  const handleJoinSession = () => {
    if (sessionCode.trim().length === 5) {
      router.push(`/lobby/${sessionCode.toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-teal-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎨 Party Games</h1>
          <p className="text-gray-800">Juegos de dibujo para jugar en grupo</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleCreateSession}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            🎯 Crear Sesión
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o</span>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Código de sesión (ej: G52KX)"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              maxLength={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-wider text-gray-800"
            />
            <button
              onClick={handleJoinSession}
              disabled={sessionCode.length !== 5}
              className="w-full bg-gradient-to-r from-teal-500 to-green-500 text-white font-semibold py-4 px-6 rounded-xl hover:from-teal-600 hover:to-green-600 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              🚀 Unirse a Sesión
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-800">
          <p>Juega Dixit, teléfono descompuesto y más</p>
          <p>con tus amigos desde el celular 📱</p>
        </div>
      </div>
    </div>
  );
}
