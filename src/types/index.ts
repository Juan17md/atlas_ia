import { z } from "zod";
import {
    UserSchema,
    ExerciseSchema,
    RoutineSchema,
    RoutineDaySchema,
    RoutineExerciseSchema,
    RoutineSetSchema,
    TrainingLogSchema,
    TrainingLogExerciseSchema,
    TrainingLogSetSchema,
    CircuitSchema,
    CircuitExerciseSchema,
    EjercicioTipoEnum,
    ComboTipoEnum,
    CircuitTipoEnum,
} from "@/lib/schemas";

export type User = z.infer<typeof UserSchema>;
export type Exercise = z.infer<typeof ExerciseSchema>;
export type Routine = z.infer<typeof RoutineSchema>;
export type RoutineDay = z.infer<typeof RoutineDaySchema>;
export type RoutineExercise = z.infer<typeof RoutineExerciseSchema>;
export type RoutineSet = z.infer<typeof RoutineSetSchema>;
export type TrainingLog = z.infer<typeof TrainingLogSchema>;
export type TrainingLogExercise = z.infer<typeof TrainingLogExerciseSchema>;
export type TrainingLogSet = z.infer<typeof TrainingLogSetSchema>;
export type Circuit = z.infer<typeof CircuitSchema>;
export type CircuitExercise = z.infer<typeof CircuitExerciseSchema>;

export type EjercicioTipo = z.infer<typeof EjercicioTipoEnum>;
export type ComboTipo = z.infer<typeof ComboTipoEnum>;
export type CircuitTipo = z.infer<typeof CircuitTipoEnum>;

// Tipos de Rol y Género para uso directo
export type UserRole = "advanced_athlete";
export type Gender = "male" | "female" | "other";

// Re-exportar tipos de API para uso centralizado
export * from "./api";

