/**
 * DATOS MOCK - Este archivo contiene todos los datos de ejemplo
 * que serán reemplazados por generación con OpenAI en el futuro
 */

// ===== DATOS ORGANIZADOS POR TEMA =====
export const MOCK_DATA_BY_THEME = {
  'Películas': [
    "Harry Potter en la playa",
    "Batman comiendo helado",
    "Shrek bailando salsa",
    "Elsa en el supermercado",
    "Darth Vader cocinando",
    "Woody en una montaña rusa",
    "La Sirenita usando un celular",
    "Simba con anteojos",
    "Minions en una oficina",
    "Iron Man paseando un perro"
  ],
  'Música': [
    "Guitarra tocada por un pulpo",
    "DJ con sombrero de chef",
    "Cantante en la ducha",
    "Batería hecha de frutas",
    "Piano en la luna",
    "Saxofón gigante en un desfile",
    "Banda de gatos rockeros",
    "Micrófono con bigote",
    "Violín volador",
    "Trompeta triste"
  ],
  'Animales': [
    "León en patineta",
    "Elefante pintando un cuadro",
    "Pingüino tomando sol",
    "Jirafa con bufanda",
    "Mono usando computadora",
    "Gato chef cocinando",
    "Perro con paraguas",
    "Pájaro con anteojos",
    "Mariposa haciendo yoga",
    "Oso en bicicleta"
  ],
  'Comida': [
    "Pizza voladora",
    "Hamburguesa con cara feliz",
    "Helado derritiéndose de miedo",
    "Taco bailando tango",
    "Sushi con sombrero",
    "Donut haciendo ejercicio",
    "Sandwich en la playa",
    "Pollo frito leyendo un libro",
    "Café saltando",
    "Pastel disfrazado de payaso"
  ],
  'Deportes': [
    "Fútbol en la luna",
    "Basketball bajo el agua",
    "Tenis con raquetas gigantes",
    "Boxeador bailando ballet",
    "Surfista en el desierto",
    "Golfista dormido",
    "Gimnasta en un trampolín gigante",
    "Patinador con alas",
    "Escalador en una torre de libros",
    "Paracaidista con paraguas"
  ],
  'Tecnología': [
    "Robot cocinando pizza",
    "Smartphone con patas",
    "Laptop en la playa",
    "Drone paseando un perro",
    "Realidad virtual en la selva",
    "Cargador gigante",
    "WiFi con cara feliz",
    "Impresora 3D imprimiendo una pizza",
    "Auriculares bailando",
    "Proyector en una fiesta"
  ],
  'Cultura general': [
    "Libro volador",
    "Globo terráqueo con sombrero",
    "Bandera bailando",
    "Corona en una pizza",
    "Pergamino en una carrera",
    "Lupa buscando helado",
    "Balanza con frutas",
    "Bombilla con cara de sorpresa",
    "Diploma en una fiesta",
    "Telescopio mirando un payaso"
  ],
  'Viajes': [
    "Avión con bigote",
    "Maleta bailando",
    "Pasaporte en la playa",
    "Mapa con cara feliz",
    "Cámara tomando selfies",
    "Tren en una montaña rusa",
    "Barco en el desierto",
    "Mochila con alas",
    "Hotel en la luna",
    "Playa con sombrero"
  ],
  'Historia': [
    "Pirámide egipcia con anteojos",
    "Gladiador en patineta",
    "Caballero bailando",
    "Vikingo con guitarra",
    "Samurai en la playa",
    "Faraón con celular"
  ],
  'Arte': [
    "Pincel con pintura goteando",
    "Paleta de colores mezclados",
    "Lienzo en caballete",
    "Escultura de mármol",
    "Museo con cuadros",
    "Artista pintando retrato",
    "Galería con visitantes",
    "Marco dorado elegante",
    "Estatua griega clásica",
    "Mural en pared grande",
    "Acuarela difuminándose",
    "Carboncillo dibujando",
    "Óleo espeso brillante",
    "Grabado en madera",
    "Cerámica en torno",
    "Vitral con colores",
    "Mosaico con teselas",
    "Fresco en techo",
    "Collage con papeles",
    "Instalación moderna"
  ]
};

// ===== TELÉFONO DESCOMPUESTO - PELÍCULAS (LEGACY) =====
export const MOCK_MOVIE_OPTIONS = MOCK_DATA_BY_THEME['Películas'];

// ===== DIBUJO CON OBJETIVO - ESTILOS =====
export const MOCK_DRAWING_OBJECTIVES = [
  "como si fueras un niño de 5 años",
  "al estilo Picasso",
  "lo más triste posible",
  "como si fuera un meme",
  "con los ojos cerrados",
  "solo con líneas rectas",
  "como si fuera un logo",
  "en versión kawaii/tierno",
  "como si fuera un emoji",
  "al estilo de caricatura",
  "como si fuera un garabato",
  "en versión minimalista",
  "como si fuera un sticker",
  "al estilo de cómic",
  "como si fuera un tatuaje"
];

// ===== FUNCIONES PARA GENERAR DATOS MOCK =====

/**
 * Genera opciones basadas en el tema seleccionado
 * TODO: Reemplazar con llamada a OpenAI
 */
export function generateMockOptionsByTheme(theme: string, count: number): string[] {
  const themeData = MOCK_DATA_BY_THEME[theme as keyof typeof MOCK_DATA_BY_THEME];
  
  if (!themeData) {
    // Si no tenemos datos para ese tema, usar películas como fallback
    console.warn(`No hay datos mock para el tema "${theme}", usando Películas como fallback`);
    const fallbackData = MOCK_DATA_BY_THEME['Películas'];
    const shuffled = [...fallbackData].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
  
  const shuffled = [...themeData].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Genera opciones de películas para teléfono descompuesto (LEGACY)
 * TODO: Reemplazar con llamada a OpenAI
 */
export function generateMockMovieOptions(count: number): string[] {
  return generateMockOptionsByTheme('Películas', count);
}

/**
 * Genera objetivos de dibujo para el juego de dibujo con objetivo
 * TODO: Reemplazar con llamada a OpenAI
 */
export function generateMockDrawingObjectives(theme: string, count: number): string[] {
  const shuffled = [...MOCK_DRAWING_OBJECTIVES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(objective => `Dibuja ${theme} ${objective}`);
}

/**
 * Genera cartas de teléfono descompuesto con opciones basadas en tema
 * TODO: Reemplazar con llamada a OpenAI que genere opciones basadas en el tema
 */
export function generateMockPhoneCards(playerCount: number, theme: string = 'Películas'): Array<[string, string, string]> {
  const allOptions = generateMockOptionsByTheme(theme, playerCount * 3);
  const cards: Array<[string, string, string]> = [];
  
  for (let i = 0; i < playerCount; i++) {
    const startIndex = i * 3;
    cards.push([
      allOptions[startIndex] || allOptions[startIndex % allOptions.length],
      allOptions[startIndex + 1] || allOptions[(startIndex + 1) % allOptions.length],
      allOptions[startIndex + 2] || allOptions[(startIndex + 2) % allOptions.length]
    ]);
  }
  
  return cards;
}

// ===== DATOS LEGACY (para compatibilidad) =====
export const LEGACY_PHONE_EXAMPLES = [
  "Una película que tu abuela amaría",
  "El libro más aburrido del mundo",
  "Una canción que te hace llorar",
  "La comida más extraña que has probado",
  "Un lugar donde nunca irías de vacaciones"
];

export const LEGACY_DRAWING_EXAMPLES = [
  "Dibuja como si fueras un niño de 5 años",
  "Dibuja al estilo Picasso", 
  "Dibuja lo más triste posible",
  "Dibuja como si fuera un meme",
  "Dibuja con los ojos cerrados"
]; 