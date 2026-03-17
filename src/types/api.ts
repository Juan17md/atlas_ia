/**
 * Tipos para respuestas de Server Actions y datos de API
 * Estos tipos centralizan las interfaces usadas en todo el proyecto
 * para mantener consistencia y tipo-seguridad.
 */

import type { Exercise, Routine, User, TrainingLog } from "./index";

// ============================================
// Respuestas genéricas de Server Actions
// ============================================

/** Respuesta base para operaciones exitosas */
export interface ActionSuccessResponse<T = void> {
    success: true;
    data?: T;
}

/** Respuesta base para operaciones fallidas */
export interface ActionErrorResponse {
    success: false;
    error: string;
    details?: string;
}

/** Respuesta genérica de Server Action */
export type ActionResponse<T = void> = ActionSuccessResponse<T> | ActionErrorResponse;

// ============================================
// Tipos de Ejercicios
// ============================================

/** Ejercicio con fechas serializadas (para transferencia cliente-servidor) */
export interface SerializedExercise extends Omit<Exercise, "createdAt" | "updatedAt"> {
    id: string;
    createdAt: string;
    updatedAt: string;
}

/** Respuesta de getExercises */
export interface ExercisesResponse {
    success: boolean;
    exercises?: SerializedExercise[];
    error?: string;
}

// ============================================
// Tipos de Rutinas
// ============================================

/** Rutina con fechas serializadas */
export interface SerializedRoutine extends Omit<Routine, "createdAt" | "updatedAt"> {
    id: string;
    createdAt?: string;
    updatedAt?: string;
}

/** Respuesta de getRoutines */
export interface RoutinesResponse {
    success: boolean;
    routines?: SerializedRoutine[];
    error?: string;
}

/** Respuesta de getRoutine (singular) */
export interface RoutineResponse {
    success: boolean;
    routine?: SerializedRoutine;
    error?: string;
}

// ============================================
// Tipos de Usuario y Atletas
// ============================================

/** Usuario serializado para transferencia */
export interface SerializedUser extends Omit<User, "createdAt" | "updatedAt" | "birthDate"> {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    birthDate?: string;
}

/** Atleta (vista simplificada para coaches) */
export interface Athlete {
    id: string;
    name: string;
    email: string;
    image?: string | null;
}

/** Respuesta de getCoachAthletes */
export interface AthletesResponse {
    success: boolean;
    athletes?: Athlete[];
    error?: string;
}

// ============================================
// Tipos de Dashboard y Analytics
// ============================================

/** Punto de datos para gráficos de actividad */
export interface ActivityDataPoint {
    name?: string;
    day?: string;
    total: number;
}

/** Estadísticas del coach */
export interface CoachStats {
    totalAthletes: number;
    totalRoutines: number;
    totalExercises: number;
    weeklyChartData?: ActivityDataPoint[];
}

/** Actividad reciente (para feed de coach) */
export interface RecentActivity {
    id: string;
    athleteId?: string;
    athleteName: string;
    athleteImage?: string | null;
    routineName: string;
    volume: number;
    date: string;
    exercisesCount?: number;
}

/** Récord personal */
export interface PersonalRecord {
    exercise: string;
    weight: number;
    date: string;
    reps?: number;
}

/** Respuesta de getPersonalRecords */
export interface PersonalRecordsResponse {
    success?: boolean;
    prs?: PersonalRecord[];
    error?: string;
}

/** Respuesta de getWeeklyActivity */
export interface WeeklyActivityResponse {
    success?: boolean;
    data?: ActivityDataPoint[];
    error?: string;
}

/** Respuesta de getWeeklyProgress */
export interface WeeklyProgressResponse {
    completed: number;
    target: number;
}

// ============================================
// Tipos de Entrenamiento (Training)
// ============================================

/** Log de entrenamiento serializado */
export interface SerializedTrainingLog extends Omit<TrainingLog, "startedAt" | "completedAt"> {
    id: string;
    startedAt?: string;
    completedAt?: string;
}

/** Set completado durante entrenamiento */
export interface CompletedSet {
    setIndex: number;
    weight: number;
    reps: number;
    rpe?: number;
    completedAt?: string;
}

/** Ejercicio en progreso durante entrenamiento */
export interface TrainingExerciseProgress {
    exerciseId: string;
    exerciseName: string;
    sets: CompletedSet[];
    notes?: string;
}

// ============================================
// Tipos de Entrenamiento Compartidos (Server + Client)
// ============================================

/** Set de entrenamiento — Superset de todas las variantes del proyecto */
export interface TrainingSetData {
    completed?: boolean;
    weight?: number;
    reps?: number;
    rpe?: number;
    rest?: number;
}

/** Ejercicio dentro de un log de entrenamiento */
export interface TrainingExerciseData {
    exerciseId?: string;
    exerciseName: string;
    sets: TrainingSetData[];
    feedback?: string;
    exerciseIdUsed?: string;
}

/** Log de entrenamiento (vista para componentes de historial) */
export interface TrainingLogData {
    id: string;
    date: string;
    routineId?: string;
    routineName?: string;
    durationMinutes?: number;
    sessionFeedback?: string;
    sessionRpe?: number;
    exercises?: TrainingExerciseData[];
}

// ============================================
// Tipos de Componentes UI
// ============================================

/** Usuario para componentes de dashboard */
export interface DashboardUser {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: "athlete" | "coach" | "advanced_athlete";
    onboardingCompleted?: boolean;
}

/** Props comunes para listas con ejercicios */
export interface ExerciseListItem {
    id: string;
    name: string;
    muscleGroups: string[];
    specificMuscles?: string[];
    difficulty?: "beginner" | "intermediate" | "advanced";
    equipment?: string[];
    videoUrl?: string | null;
    imageUrl?: string | null;
}

// ============================================
// Helpers de tipo
// ============================================

/** Hace todas las propiedades opcionales y permite null */
export type Nullable<T> = { [K in keyof T]: T[K] | null };

/** Extrae el tipo de datos de una respuesta exitosa */
export type ExtractData<T> = T extends ActionSuccessResponse<infer U> ? U : never;

/** Tipo para campos de fecha de Firestore (compatibilidad) */
export interface FirestoreTimestamp {
    toDate: () => Date;
    seconds: number;
    nanoseconds: number;
}

/** Campo que puede ser Date, Timestamp o string */
export type DateField = Date | FirestoreTimestamp | string;
