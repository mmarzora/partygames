# 📁 Datos Mock - Transición a OpenAI

Este directorio contiene todos los **datos de ejemplo (mock)** que actualmente usa la aplicación. Estos datos serán reemplazados por generación dinámica con **OpenAI** en el futuro.

## 📋 Archivos

### `mockData.ts`
Contiene todos los datos estáticos que se usan mientras no tenemos OpenAI implementado:

- **`MOCK_MOVIE_OPTIONS`**: 40+ opciones de películas para teléfono descompuesto
- **`MOCK_DRAWING_OBJECTIVES`**: 15+ estilos de dibujo para el juego de objetivos
- **Funciones helper**: Para generar combinaciones aleatorias

## 🔄 Cómo Reemplazar con OpenAI

### 1. **Instalar OpenAI SDK**
```bash
npm install openai
```

### 2. **Configurar API Key**
Agregar a `.env.local`:
```env
OPENAI_API_KEY=tu_api_key_aqui
```

### 3. **Implementar en `src/utils/openai.ts`**

#### Para Teléfono Descompuesto:
```typescript
export async function generatePhoneCardsWithAI(
  theme: string,
  playerCount: number
): Promise<Array<[string, string, string]>> {
  const prompt = `Genera ${playerCount * 3} opciones diferentes de ${theme} para dibujar. 
  Cada opción debe ser específica y objetiva, como "Titanic hundiéndose" o "Harry Potter con su varita".
  Devuelve solo las opciones, una por línea.`;
  
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 500
  });
  
  const options = response.choices[0].message.content?.split('\n').filter(line => line.trim());
  // Agrupar en sets de 3 para cada jugador
  // ...
}
```

#### Para Dibujo con Objetivo:
```typescript
export async function generateDrawingObjectivesWithAI(
  theme: string,
  playerCount: number
): Promise<string[]> {
  const prompt = `Genera ${playerCount} estilos diferentes para dibujar ${theme}. 
  Ejemplos: "como si fueras un niño de 5 años", "al estilo Picasso", "lo más triste posible".
  Devuelve solo los estilos, uno por línea.`;
  
  // Implementar llamada similar...
}
```

### 4. **Actualizar la función principal**
En `src/utils/openai.ts`, cambiar `generateCards()`:

```typescript
export async function generateCards(
  gameType: 'telefono' | 'dibujo',
  theme: string,
  players: Player[]
): Promise<GameCard[]> {
  if (gameType === 'telefono') {
    // Usar OpenAI en lugar de mock
    const aiOptions = await generatePhoneCardsWithAI('películas', players.length);
    return players.map((player, index) => ({
      id: `card_${player.id}`,
      playerId: player.id,
      options: aiOptions[index],
      type: 'phone' as const
    }));
  } else {
    // Similar para dibujo...
  }
}
```

## 🧪 Testing

### Modo Mock (Actual)
- ✅ **Rápido**: No requiere API calls
- ✅ **Confiable**: Siempre funciona
- ❌ **Limitado**: Opciones fijas

### Modo OpenAI (Futuro)
- ✅ **Dinámico**: Opciones infinitas
- ✅ **Temático**: Basado en el tema elegido
- ❌ **Dependiente**: Requiere internet y API key
- ❌ **Costo**: Cada generación cuesta dinero

## 🔧 Configuración Híbrida

Puedes implementar un sistema híbrido:

```typescript
const USE_OPENAI = process.env.OPENAI_API_KEY && process.env.NODE_ENV === 'production';

export async function generateCards(...) {
  if (USE_OPENAI) {
    return await generateCardsWithAI(...);
  } else {
    return generateCardsWithMock(...);
  }
}
```

## 📝 TODOs

- [ ] Implementar `generatePhoneCardsWithAI()`
- [ ] Implementar `generateDrawingObjectivesWithAI()`
- [ ] Agregar manejo de errores para OpenAI
- [ ] Implementar fallback a mock si OpenAI falla
- [ ] Agregar cache para evitar regenerar las mismas cartas
- [ ] Optimizar prompts para mejores resultados 