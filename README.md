# Atlas IA - Ecosistema de Entrenamiento Inteligente

Un ecosistema de entrenamiento avanzado potenciado por inteligencia artificial, diseñado para conectar entrenadores y atletas con herramientas de última generación. Optimizado para dispositivos móviles y construido con un enfoque en rendimiento, diseño y escalabilidad.

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-Privado-red?style=for-the-badge)](LICENSE)

</div>

## 🎯 Visión del Proyecto

Atlas IA nace de la necesidad de modernizar la interacción entre entrenadores y atletas, proporcionando una plataforma integral que combina tecnología de vanguardia con metodologías de entrenamiento comprobadas. El sistema permite una personalización avanzada basada en datos reales, optimizando cada sesión de entrenamiento para maximizar resultados.

## 🚀 Características Principales

### Para Entrenadores
- **Dashboard Avanzado**: Visualización completa de métricas de atletas, rutinas activas y carga de trabajo.
- **Gestión de Atletas**: Perfiles detallados, seguimiento de progreso y asignación de planes.
- **Constructor de Rutinas con IA**: Generación automática de planes de entrenamiento personalizados basados en objetivos, nivel y equipamiento.
- **Asignación Flexible**: Asignación directa de rutinas a atletas con validaciones de seguridad.
- **Biblioteca de Ejercicios**: Gestión centralizada de ejercicios con categorización muscular detallada.

### Para Atletas
- **Modo Entreno (Live)**: Interfaz optimizada para el gimnasio con cronómetro de descanso, registro de series (RPE/Peso) y validación de PRs.
- **Progreso Visual**: Gráficos interactivos de volumen, frecuencia y medidas corporales.
- **Asistente IA en Tiempo Real**: 
  - Generación de calentamientos específicos.
  - Alternativas de ejercicios si el equipamiento está ocupado.
  - Chat contextual sobre técnica y ejecución.
- **Historial Completo**: Registro detallado de cada sesión y récord personal.
- **Registro Retroactivo**: Posibilidad de registrar entrenamientos pasados con detalle de series, carga y RPE.

## 🛠️ Tecnologías Utilizadas

<div align="center">

| Categoría | Tecnología | Propósito |
|----------|------------|-----------|
| **Framework** | [Next.js 15+](https://nextjs.org/) | App Router, Server Actions |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) | Tipado estricto y seguridad |
| **Estilos** | [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) | Diseño responsivo y componentes accesibles |
| **Iconos** | [Lucide React](https://lucide.dev/) | Iconografía consistente |
| **Base de Datos** | [Firebase Firestore](https://firebase.google.com/) | Datos en tiempo real |
| **Autenticación** | [Auth.js (NextAuth v5)](https://authjs.dev/) | Gestión de sesiones segura |
| **IA** | [Groq SDK](https://groq.com/) | Llama 3 / Mixtral para generación de contenido |
| **Gráficos** | [Recharts](https://recharts.org/) | Visualización de datos |
| **Validación** | [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/) | Validación de formularios |

</div>

## 💡 Casos de Uso Detallados

### 1. Creación de Rutina Personalizada
Un entrenador puede generar una rutina completa en minutos utilizando el constructor de IA, especificando:
- Objetivo del atleta (fuerza, hipertrofia, resistencia)
- Nivel de experiencia (principiante, intermedio, avanzado)
- Equipamiento disponible en el gimnasio
- Restricciones o lesiones previas

### 2. Seguimiento en Tiempo Real
Durante el entrenamiento, los atletas pueden:
- Registrar series con peso, repeticiones y RPE
- Visualizar su progreso en comparación con sesiones anteriores
- Recibir sugerencias de calentamiento basadas en la rutina
- Obtener alternativas de ejercicios si el equipamiento está ocupado

### 3. Análisis de Datos Avanzado
El sistema proporciona:
- Gráficos de progreso con tendencias a lo largo del tiempo
- Análisis de volumen y frecuencia de entrenamiento
- Identificación de patrones y áreas de mejora
- Reportes personalizados para cada atleta

## 🏗️ Arquitectura del Sistema

```
GymIA/
├── app/                  # Aplicación Next.js (App Router)
│   ├── (auth)/           # Rutas de autenticación
│   ├── dashboard/        # Dashboard de entrenadores
│   ├── train/            # Modo entrenamiento para atletas
│   └── api/              # Endpoints de la API
├── components/           # Componentes reutilizables
│   ├── ui/               # Componentes de interfaz
│   └── features/         # Componentes específicos por funcionalidad
├── lib/                  # Utilidades y configuraciones
├── hooks/                # Hooks personalizados
├── types/                # Definiciones de tipos TypeScript
└── services/             # Integraciones con servicios externos
```

## 📊 Métricas de Rendimiento

- **Tipado Estricto**: Eliminación del 95% de tipos `any`, implementando interfaces robustas (`Routine`, `Exercise`, `SetLog`, `Athlete`).
- **Arquitectura de Componentes**: Separación clara de responsabilidades en componentes de UI (`warmup-generator`, `train-console`, `workout-session`).
- **Optimización de UI/UX**: Estandarización de estilos (bordes `rounded-4xl`, gradientes modernos), feedback visual mejorado y lazy loading de componentes pesados.

## ⚙️ Configuración Local

### Prerrequisitos
- Node.js 18+ instalado
- npm o pnpm

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
    git clone <tu-repositorio-url>
    cd Atlas-IA
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   pnpm install
   ```

3. **Variables de Entorno**
   Crea un archivo `.env` en la raíz con:
   ```env
   # Auth
   AUTH_SECRET="tu-secreto-generado"
   AUTH_URL="http://localhost:3000"

   # Firebase Admin (Service Account Minificada)
   FIREBASE_PROJECT_ID="tu-project-id"
   FIREBASE_CLIENT_EMAIL="tu-email-service-account"
   FIREBASE_PRIVATE_KEY="tu-private-key"

   # IA
   GROQ_API_KEY="tu-api-key-groq"
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 📈 Roadmap de Desarrollo

- [ ] Integración con dispositivos wearables (Apple Watch, Garmin)
- [ ] Sistema de notificaciones push para recordatorios de entrenamiento
- [ ] Marketplace de rutinas compartidas por la comunidad
- [ ] Análisis predictivo de rendimiento con machine learning
- [ ] Gamificación y sistema de recompensas

## 🤝 Contribución

Este proyecto es privado y de uso personal. No se aceptan contribuciones externas en este momento.

## 📄 Licencia

Este proyecto es privado y de uso personal.

## 👤 Autor

**Juan17MD**