import React from 'react';

interface HowItWorksModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({ open, onClose }: HowItWorksModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-bold"
          aria-label="Cerrar"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">¿Cómo funciona?</h2>
        <div className="space-y-6 text-gray-700 text-base">
          <div>
            <h3 className="font-semibold text-lg mb-1">📞 Teléfono Descompuesto</h3>
            <p>
              Cada jugador recibe una frase para dibujar. Luego, los dibujos se van pasando entre los jugadores, quienes deben adivinar o continuar la historia solo viendo el dibujo anterior. ¡El resultado final suele ser muy divertido y diferente al original!
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">🎯 Dibujo con Objetivo Secreto</h3>
            <p>
              A cada jugador se le asigna un objetivo especial para su dibujo (por ejemplo, "dibuja como si fueras un niño de 5 años" o "al estilo meme"). Los demás deben adivinar cuál era el objetivo secreto del dibujo. ¡Creatividad al máximo!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 