# 🎨 Party Games

Una web app para jugar en grupo, en persona, a juegos de dibujo estilo Dixit o teléfono descompuesto, donde cada jugador accede desde su celular con un código de sesión.

## 🚀 Características

- **Juegos multijugador**: Teléfono descompuesto y Dibujo con objetivo secreto
- **Acceso móvil**: Cada jugador usa su celular con un código de sesión
- **Temas personalizables**: Películas, música, cultura general, o temas personalizados
- **Cartas generadas por IA**: Usando GPT para crear contenido dinámico
- **Juego offline**: Los dibujos se hacen en papel, no se suben a la app

## 🛠️ Tecnologías

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Firebase (Firestore + Authentication)
- **IA**: OpenAI API para generar cartas
- **Deployment**: Vercel

## 📱 Flujo del Juego

1. **Crear sesión**: El host elige tipo de juego y tema
2. **Unirse**: Los jugadores ingresan el código desde sus celulares
3. **Jugar**: Cada jugador recibe su carta/objetivo en el celular
4. **Dibujar**: Se dibuja en papel (offline)
5. **Nueva ronda**: El host puede generar nuevas cartas

## 🔧 Instalación y Configuración

### 1. Clonar e instalar dependencias

```bash
git clone <tu-repo>
cd partygames
npm install
```

### 2. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto
3. Habilita **Firestore Database**
4. Habilita **Authentication** (modo anónimo opcional)
5. Ve a Configuración del proyecto > General > Tus apps
6. Crea una app web y copia la configuración

### 3. Configurar variables de entorno

Crea un archivo `.env.local` basado en `env.example`:

```bash
cp env.example .env.local
```

Edita `.env.local` y reemplaza con tus datos de Firebase:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_real
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id_real
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id_real
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id_real

# OpenAI Configuration (opcional por ahora)
OPENAI_API_KEY=tu_openai_api_key
```

### 4. Actualizar configuración de Firebase

Edita `src/utils/firebase.ts` y reemplaza los valores de ejemplo con tus variables de entorno:

```typescript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:3000`

## 📂 Estructura del Proyecto

```
src/
├── app/
│   ├── page.tsx              # Pantalla inicial (Crear/Unirse)
│   ├── host/page.tsx         # Panel del creador de sesión
│   ├── lobby/[sessionCode]/  # Sala de espera
│   └── layout.tsx            # Layout principal
├── utils/
│   ├── firebase.ts           # Configuración de Firebase
│   ├── openai.ts            # Integración con OpenAI
│   └── gameUtils.ts         # Utilidades del juego
└── components/              # Componentes reutilizables
```

## 🎮 Tipos de Juego

### Teléfono Descompuesto
- Cada jugador recibe una frase diferente para dibujar
- Ejemplo: "Una película que tu abuela amaría"

### Dibujo con Objetivo Secreto
- Todos dibujan el mismo tema
- Cada jugador tiene un estilo/objetivo diferente
- Ejemplo: "Dibuja un gato como si fueras Picasso"

## 🔄 Próximos Pasos

- [ ] Implementar lógica de Firebase para sesiones reales
- [ ] Integrar OpenAI para generar cartas dinámicas
- [ ] Añadir sistema de rondas múltiples
- [ ] Implementar PWA para mejor experiencia móvil
- [ ] Añadir más tipos de juegos

## 📱 Uso

1. **Host**: Ve a la app y crea una sesión
2. **Jugadores**: Ingresan el código de 5 letras desde sus celulares
3. **Jugar**: Cada uno ve su carta en el celular y dibuja en papel
4. **Repetir**: El host puede generar nuevas cartas para más rondas

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.
