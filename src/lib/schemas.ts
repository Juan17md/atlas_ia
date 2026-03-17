import { z } from "zod";

// --- Enums y Constantes ---

export const RoleEnum = z.enum(["athlete", "coach", "advanced_athlete"]);
export const GenderEnum = z.enum(["male", "female", "other"]);
export const GoalEnum = z.enum(["hypertrophy", "weight_loss", "endurance", "flexibility", "strength"]);

// --- Schemas Base ---

export const RegisterInputSchema = z.object({
    name: z.string().min(2, "Mínimo 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(6),
    role: z.enum(["athlete", "coach", "advanced_athlete"]),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

// Schema para el servidor (sin confirmPassword, ya que se valida en el cliente)
export const RegisterInputSchemaServer = z.object({
    name: z.string().min(2, "Mínimo 2 caracteres"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    role: z.enum(["athlete", "coach", "advanced_athlete"]),
});

// Schema para medidas corporales (Solo Atletas)
export const BodyMeasurementsSchema = z.object({
    chest: z.number().min(20).max(200).optional(),
    waist: z.number().min(40).max(200).optional(),
    hips: z.number().min(40).max(200).optional(),
    shoulders: z.number().min(30).max(200).optional(),
    glutes: z.number().min(40).max(200).optional(),
    neck: z.number().min(20).max(60).optional(),
    bodyFat: z.number().min(2).max(60).optional(),

    // Extremidades
    bicepsLeft: z.number().min(15).max(60).optional(),
    bicepsRight: z.number().min(15).max(60).optional(),
    forearmsLeft: z.number().min(15).max(50).optional(),
    forearmsRight: z.number().min(15).max(50).optional(),
    quadsLeft: z.number().min(25).max(80).optional(),
    quadsRight: z.number().min(25).max(80).optional(),
    calvesLeft: z.number().min(15).max(50).optional(),
    calvesRight: z.number().min(15).max(50).optional(),

    weight: z.number().min(20).max(300).optional(),
    height: z.number().min(100).max(250).optional(),
    updatedAt: z.date().optional(),
});

// Schema de Usuario
export const UserSchema = z.object({
    id: z.string(),
    email: z.string().email("Email inválido"),
    name: z.string().min(1, "El nombre es obligatorio"),
    role: RoleEnum,
    image: z.string().url().optional().or(z.literal("")),

    // Datos específicos del perfil (principalmente para atletas)
    age: z.number().min(10).max(100).optional(),
    weight: z.number().optional(),
    height: z.number().optional(),
    bodyFat: z.number().optional(),
    gender: GenderEnum.optional(),
    experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    goal: z.string().optional(),
    availableDays: z.number().optional(),
    onboardingCompleted: z.boolean().default(false),

    goals: z.array(GoalEnum).optional(),
    injuries: z.array(z.string()).optional(), // Lista de lesiones
    medicalConditions: z.array(z.string()).optional(), // Condiciones médicas

    measurements: BodyMeasurementsSchema.optional(), // Ultimas medidas registradas

    coachId: z.string().optional(), // ID del coach asignado (si es atleta)

    createdAt: z.date(),
    updatedAt: z.date(),
});

export const OnboardingInputSchema = z.object({
    // Datos Personales Básicos
    age: z.coerce.number().min(10).max(100),
    gender: z.enum(["male", "female"]),
    weight: z.coerce.number().min(30).max(300),
    height: z.coerce.number().min(100).max(250),

    // Objetivos y Experiencia
    experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
    goal: z.string().min(1, "Selecciona un objetivo"),
    availableDays: z.coerce.number().min(1).max(7),

    // Perfil de Salud (Nuevos campos)
    injuries: z.array(z.string()).default([]),
    medicalConditions: z.array(z.string()).default([]),

    // Medidas Antropométricas (Nuevos campos - Opcionales pero parte del onboarding pro)
    measurements: z.object({
        chest: z.coerce.number().optional(),
        waist: z.coerce.number().optional(),
        hips: z.coerce.number().optional(),
        glutes: z.coerce.number().optional(),
        shoulders: z.coerce.number().optional(),
        neck: z.coerce.number().optional(),

        bicepsLeft: z.coerce.number().optional(),
        bicepsRight: z.coerce.number().optional(),
        forearmsLeft: z.coerce.number().optional(),
        forearmsRight: z.coerce.number().optional(),
        quadsLeft: z.coerce.number().optional(),
        quadsRight: z.coerce.number().optional(),
        calvesLeft: z.coerce.number().optional(),
        calvesRight: z.coerce.number().optional(),
    }).optional(),

    // Seguridad: Contraseña para acceso correo/password
    // Opcional a nivel de schema; la obligatoriedad se controla desde el frontend según authProvider
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
}).refine((data) => {
    // Si se proporcionó contraseña, debe coincidir con la confirmación
    if (data.password && data.password.length >= 6) {
        return data.confirmPassword === data.password;
    }
    return true;
}, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

// Schema de Ejercicio
export const ExerciseSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "El nombre del ejercicio es obligatorio"),
    description: z.string().optional(),
    muscleGroups: z.array(z.string()).min(1, "Debe seleccionar al menos un grupo muscular"), // Ej: "pecho", "espalda"
    specificMuscles: z.array(z.string()).optional(), // Ej: "pectoral mayor", "dorsal ancho"
    videoUrl: z.string().optional(),
    coachId: z.string(), // ID del coach que creó o posee este ejercicio en su librería

    createdAt: z.date(),
    updatedAt: z.date(),
});

// Schema de Serie (Set) dentro de una Rutina
export const RoutineSetSchema = z.object({
    type: z.enum(["warmup", "working", "failure", "drop"]), // Tipo de serie
    reps: z.string().optional(), // Rango de repeticiones sugerido (ej: "8-12")
    rpeTarget: z.number().min(1).max(10).optional(), // RPE Objetivo
    restSeconds: z.number().optional(), // Descanso entre series
});

// Schema de Ejercicio dentro de una Rutina (RoutineItem)
export const RoutineExerciseSchema = z.object({
    exerciseId: z.string(),
    exerciseName: z.string(), // Desnormalizado para evitar lecturas extra
    notes: z.string().optional(),
    sets: z.array(RoutineSetSchema),
    order: z.number(), // Orden en la sesión
    variantIds: z.array(z.string()).optional(), // IDs de ejercicios variantes
});

// Schema de Día de Rutina (Workout Day)
export const RoutineDaySchema = z.object({
    id: z.string(),
    name: z.string(), // Ej: "Día 1 - Pecho/Bíceps"
    exercises: z.array(RoutineExerciseSchema),
});

// Schema de Rutina Completa
export const RoutineSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "El nombre de la rutina es obligatorio"),
    description: z.string().optional(),
    coachId: z.string(),
    athleteId: z.string(), // Asignada a un atleta
    active: z.boolean().default(true), // Si es la rutina actual

    schedule: z.array(RoutineDaySchema), // Días de entrenamiento

    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().optional(), // Soft delete
});

// Schema de Log de Entrenamiento (Ejecución real)
export const TrainingLogSetSchema = z.object({
    reps: z.number(),
    weight: z.number(),
    rpe: z.number().optional(),
    completed: z.boolean().default(true),
});

export const TrainingLogExerciseSchema = z.object({
    exerciseId: z.string(),
    exerciseName: z.string(),
    exerciseIdUsed: z.string().optional(), // ID del ejercicio específico realizado (puede ser el principal o una variante)
    sets: z.array(TrainingLogSetSchema),
    feedback: z.string().optional(), // Feedback del atleta sobre este ejercicio particular
});

export const TrainingLogSchema = z.object({
    id: z.string(),
    athleteId: z.string(),
    routineId: z.string().optional(),
    dayId: z.string().optional(), // Referencia al día de la rutina
    date: z.date(),

    exercises: z.array(TrainingLogExerciseSchema),

    sessionFeedback: z.string().optional(), // Feedback general de la sesión
    durationMinutes: z.number().optional(),

    createdAt: z.date(),
});

export const BodyMeasurementLogSchema = z.object({
    id: z.string(),
    userId: z.string(),
    date: z.date(),
    weight: z.number().min(20).max(300).optional(),

    chest: z.number().min(20).max(200).optional(),
    waist: z.number().min(40).max(200).optional(),
    hips: z.number().min(40).max(200).optional(),
    shoulders: z.number().min(30).max(200).optional(),
    glutes: z.number().min(40).max(200).optional(),
    neck: z.number().min(20).max(60).optional(),
    bodyFat: z.number().min(2).max(60).optional(),

    bicepsLeft: z.number().min(15).max(60).optional(),
    bicepsRight: z.number().min(15).max(60).optional(),
    forearmsLeft: z.number().min(15).max(50).optional(),
    forearmsRight: z.number().min(15).max(50).optional(),
    quadsLeft: z.number().min(25).max(80).optional(),
    quadsRight: z.number().min(25).max(80).optional(),
    calvesLeft: z.number().min(15).max(50).optional(),
    calvesRight: z.number().min(15).max(50).optional(),

    notes: z.string().optional(),
    createdAt: z.date(),
});
