# Atlas IA - Asistente de Entrenamiento Inteligente

Ecosistema de entrenamiento potenciado por inteligencia artificial para atletas avanzados. Optimizado para móviles, con enfoque en rendimiento, diseño y escalabilidad. Sin distinción tradicional entre coach y atleta — la IA actúa como entrenador personal automatizado.

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Privado-red?style=for-the-badge)](LICENSE)

</div>

## Características Principales

- **Dashboard Personal**: Visualización de rutina activa, récords y progreso.
- **Modo Entreno (Live)**: Interfaz optimizada para el gimnasio con cronómetro de descanso, registro de series (RPE/Peso) y validación de PRs.
- **Constructor de Rutinas con IA**: Generación automática de planes personalizados basados en objetivos, nivel y equipamiento.
- **Asistente IA en Tiempo Real**:
  - Generación de calentamientos específicos.
  - Alternativas de ejercicios si el equipamiento está ocupado.
  - Chat contextual sobre técnica y ejecución.
- **Historial y Progreso**: Gráficos SVG nativos de volumen, frecuencia y medidas corporales.
- **Biblioteca de Ejercicios**: Gestión centralizada con categorización muscular detallada.
- **Registro Retroactivo**: Posibilidad de registrar entrenamientos pasados.
- **Modo Offline**: Sincronización automática de entrenamientos sin conexión.

## Tecnologías

| Categoría | Tecnología | Propósito |
|----------|------------|-----------|
| **Framework** | [Next.js 15+](https://nextjs.org/) | App Router, Server Actions |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) | Tipado estricto |
| **Estilos** | [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) | Diseño responsivo y accesible |
| **Iconos** | [Lucide React](https://lucide.dev/) | Iconografía consistente |
| **Base de Datos** | [Firebase Firestore](https://firebase.google.com/) | Datos en tiempo real |
| **Autenticación** | [Auth.js (NextAuth v5)](https://authjs.dev/) + Firebase Auth | Email/contraseña |
| **IA** | [Groq SDK](https://groq.com/) | Llama 3 / Mixtral |
| **Gráficos** | SVG nativo | Visualización de datos |
| **Validación** | [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/) | Formularios |

## Arquitectura

```
Atlas-IA/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Autenticación
│   ├── dashboard/        # Dashboard principal
│   ├── train/            # Modo entrenamiento
│   └── api/              # API endpoints
├── components/           # Componentes reutilizables
│   ├── ui/               # Componentes de interfaz base
│   └── features/         # Componentes por funcionalidad
├── lib/                  # Utilidades y configuraciones
├── hooks/                # Hooks personalizados
├── types/                # Tipos TypeScript
└── services/             # Integraciones externas
```

## Optimizaciones Recientes

- **-185KB de bundle** eliminando dependencias pesadas (react-markdown, recharts, @imagekit/javascript).
- **Caché con `unstable_cache`** en consultas críticas (TTL 60-300s).
- **Fetching paralelo** con `Promise.all` en rutas de alta concurrencia.
- **19/19 páginas** con `loading.tsx` y Suspense boundaries.
- **Gráficos SVG nativos** reemplazando recharts (~-80KB).
- **Autenticación simplificada**: solo email/contraseña, sin Google OAuth.

## Configuración Local

### Prerrequisitos
- Node.js 18+
- npm o pnpm

### Instalación

```bash
git clone <tu-repositorio-url>
cd Atlas-IA
npm install
```

### Variables de Entorno

```env
# Auth
AUTH_SECRET="tu-secreto"
AUTH_URL="http://localhost:3000"

# Firebase Admin
FIREBASE_PROJECT_ID="tu-project-id"
FIREBASE_CLIENT_EMAIL="tu-email"
FIREBASE_PRIVATE_KEY="tu-private-key"

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY="tu-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="tu-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="tu-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="tu-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="tu-app-id"

# IA
GROQ_API_KEY="tu-api-key-groq"
```

### Desarrollo

```bash
npm run dev
```

## Autor

**Juan17MD**
