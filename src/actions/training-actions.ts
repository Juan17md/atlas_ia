"use server";

import { adminDb, serializeFirestoreData } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { TrainingLogSchema } from "@/lib/schemas";
import { TrainingLogData } from "@/types/api";
import { revalidateTag, revalidatePath } from "next/cache";
import { obtenerAhoraLocal, obtenerFechaISOLocal, inicioDelDia, finDelDia, mediodiaUTC } from "@/lib/fecha-utils";

// --- TIPOS LOCALES ---

interface FirestoreSetData {
    sessionId: string;
    athleteId: string;
    exerciseId: string;
    weight: number;
    reps: number;
    rpe?: number;
    rest?: number;
    completed: boolean;
    timestamp: number;
    createdAt: Date;
}

export interface RoutineSet {
    reps?: number;
    weight?: number;
    rpe?: number;
    rest?: number;
    completed?: boolean;
}

export interface RoutineExercise {
    exerciseId?: string;
    exerciseName?: string;
    sets: RoutineSet[];
    variantIds?: string[];
}

export interface WorkoutSessionData {
    routineId?: string;
    routineName?: string;
    exercises?: Array<{
        exerciseId?: string;
        exerciseName?: string;
        exerciseIdUsed?: string;
        variantIds?: string[];
        sets: RoutineSet[];
        feedback?: string;
    }>;
    notes?: string;
    sessionRpe?: number;
    sessionNotes?: string;
    durationMinutes?: number;
    dayId?: string;
    assignmentId?: string;
}

export interface ProgressionSuggestion {
    exerciseId: string;
    suggestedWeight: number;
    reason: string;
    lastDate?: string;
    lastWeight?: number;
    lastReps?: number;
    lastRpe?: number;
}

// --- COACH ACTIONS ---

// --- ATHLETE ACTIONS ---

// Get Training Log History
export async function getTrainingLogs(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const targetId = userId || session.user.id;
    if (targetId !== session.user.id && session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const snapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", targetId)
            .orderBy("date", "desc")
            .limit(20)
            .get();

        const logs = snapshot.docs.map(doc => {
            return serializeFirestoreData({ id: doc.id, ...doc.data() }) as TrainingLogData;
        });

        return { success: true, logs };
    } catch (error) {
        console.error("Error fetching logs:", error);
        return { success: false, error: "Error al cargar historial" };
    }
}

// Log a Workout Session
export async function logWorkoutSession(data: WorkoutSessionData) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const sessionId = `session_${Date.now()}_${session.user.id.slice(0, 6)}`;
        // Usar mediodía UTC para que la conversión TZ no cambie el día
        const fechaHoyStr = obtenerFechaISOLocal();
        const workoutDate = mediodiaUTC(fechaHoyStr);

        const batch = adminDb.batch();

        // 1. Crear el training_log principal
        const logRef = adminDb.collection("training_logs").doc();
        batch.set(logRef, {
            ...data,
            athleteId: session.user.id,
            sessionId,
            assignmentId: data.assignmentId || null,
            status: "completed",
            date: workoutDate,
            createdAt: workoutDate,
        });

        // 2. Escribir workout_sets individuales para consistencia con el sistema de progresión
        if (data.exercises) {
            for (const exercise of data.exercises) {
                for (const set of exercise.sets) {
                    if ((set.weight || 0) > 0 || (set.reps || 0) > 0) {
                        const setRef = adminDb.collection("workout_sets").doc();
                        batch.set(setRef, {
                            exerciseId: exercise.exerciseId || "",
                            exerciseName: exercise.exerciseName || "",
                            weight: set.weight || 0,
                            reps: set.reps || 0,
                            rpe: set.rpe || null,
                            sessionId,
                            athleteId: session.user.id,
                            timestamp: workoutDate.getTime(),
                            createdAt: workoutDate,
                        });
                    }
                }
            }
        }

        await batch.commit();

        revalidateTag("training-logs", "default");
        revalidateTag("weekly-activity", "default");
        revalidateTag("coach-stats", "default");
        revalidateTag("recent-activity", "default");
        revalidatePath("/train");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error logging session:", error);
        return { success: false, error: "Error al guardar entrenamiento" };
    }
}

export async function checkCompletedWorkoutToday() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, completed: false };

    try {
        // Usar fecha del usuario (no UTC del servidor) para calcular el rango del día
        const hoyStr = obtenerFechaISOLocal();
        const startOfDay = inicioDelDia(hoyStr);
        const endOfDay = finDelDia(hoyStr);

        const snapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", session.user.id)
            .where("date", ">=", startOfDay)
            .where("date", "<=", endOfDay)
            .get();

        const isCompleted = snapshot.docs.some(doc => {
            const data = doc.data();
            return data.status !== "in_progress";
        });

        return { success: true, completed: isCompleted };
    } catch (error) {
        console.error("Error checking completed workout:", error);
        return { success: false, completed: false };
    }
}

// Get a single Training Log by ID
export async function getTrainingLog(logId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const docRef = adminDb.collection("training_logs").doc(logId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return { success: false, error: "Log no encontrado" };
        }

        const data = docSnap.data();
        if (data?.athleteId !== session.user.id && session.user.role !== "coach") {
            return { success: false, error: "No autorizado" };
        }

        return {
            success: true,
            log: serializeFirestoreData({
                id: docSnap.id,
                ...data,
            })
        };
    } catch (error) {
        console.error("Error fetching log:", error);
        return { success: false, error: "Error al cargar log" };
    }
}

// Complete a Workout Session
export async function completeWorkout(logId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const docRef = adminDb.collection("training_logs").doc(logId);
        await docRef.update({
            status: "completed",
            endTime: new Date(),
            updatedAt: new Date()
        });

        revalidateTag("training-logs", "default");
        revalidateTag("weekly-activity", "default");
        revalidateTag("coach-stats", "default");
        revalidateTag("recent-activity", "default");
        revalidatePath("/train");
        revalidatePath("/history");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("Error completing workout:", error);
        return { success: false, error: "Error al completar entrenamiento" };
    }
}

// Get Routines Assigned to Athlete
export async function getAthleteRoutines() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const snapshot = await adminDb.collection("routines")
            .where("athleteId", "==", session.user.id)
            .where("active", "==", true)
            .get();

        const routines = snapshot.docs.map(doc => {
            return serializeFirestoreData({ id: doc.id, ...doc.data() });
        });

        return { success: true, routines };
    } catch (error) {
        console.error("Error fetching athlete routines:", error);
        return { success: false, error: "Error al cargar rutinas" };
    }
}

// Start a New Workout Session
export async function startWorkout(routineId: string, dayIndex: number = 0) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const routineRef = adminDb.collection("routines").doc(routineId);
        const routineSnap = await routineRef.get();
        if (!routineSnap.exists) return { success: false, error: "Rutina no encontrada" };

        const routineData = routineSnap.data();
        const schedule = routineData?.schedule || [];
        const targetDay = schedule[dayIndex] ?? schedule[0] ?? { name: "Día 1", exercises: [] };

        const workoutRef = await adminDb.collection("training_logs").add({
            athleteId: session.user.id,
            routineId: routineId,
            routineName: routineData?.name || "Rutina",
            dayName: targetDay.name,
            exercises: targetDay.exercises.map((ex: RoutineExercise) => ({
                ...ex,
                sets: ex.sets.map((set: RoutineSet) => ({
                    ...set,
                    completed: false
                }))
            })),
            status: "in_progress",
            startTime: new Date(),
            createdAt: new Date()
        });

        return { success: true, workoutId: workoutRef.id };
    } catch (error) {
        console.error("Error starting workout:", error);
        return { success: false, error: "Error al iniciar entrenamiento" };
    }
}

// Get Athlete Training History
export async function getAthleteHistory() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const snapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", session.user.id)
            .where("status", "==", "completed")
            .orderBy("date", "desc")
            .limit(50)
            .get();

        const history = snapshot.docs.map(doc => {
            return serializeFirestoreData({ id: doc.id, ...doc.data() });
        });

        return { success: true, history };
    } catch (error) {
        console.error("Error fetching history:", error);
        return { success: false, error: "Error al cargar historial" };
    }
}

// Log a single set
export async function logSet(data: {
    exerciseId: string;
    exerciseName: string;
    weight: number;
    reps: number;
    rpe?: number;
    sessionId: string;
    timestamp: number;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        await adminDb.collection("workout_sets").add({
            ...data,
            athleteId: session.user.id,
            createdAt: new Date(),
        });
        return { success: true };
    } catch (error) {
        console.error("Error logging set:", error);
        return { success: false, error: "Error al guardar serie" };
    }
}

// Finish a workout session
export async function finishWorkoutSession(
    sessionId: string,
    durationSeconds: number,
    totalVolume: number,
    totalSets: number
) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const setsSnapshot = await adminDb.collection("workout_sets")
            .where("sessionId", "==", sessionId)
            .where("athleteId", "==", session.user.id)
            .get();

        const sets = setsSnapshot.docs.map(doc => doc.data());
        const calculatedVolume = sets.reduce((acc, set) => acc + (set.weight * set.reps), 0);
        const actualSets = sets.length;

        // Agrupar sets por exerciseId para que cada ejercicio aparezca una sola vez
        const exerciseMap = new Map<string, { exerciseId: string; exerciseName: string; sets: { reps: number; weight: number; rpe?: number }[] }>();

        for (const set of sets) {
            const key = set.exerciseId || set.exerciseName;
            if (!exerciseMap.has(key)) {
                exerciseMap.set(key, {
                    exerciseId: set.exerciseId,
                    exerciseName: set.exerciseName,
                    sets: []
                });
            }
            exerciseMap.get(key)!.sets.push({
                reps: set.reps,
                weight: set.weight,
                rpe: set.rpe || undefined,
            });
        }

        // Usar mediodía UTC para que la conversión TZ no cambie el día
        const fechaHoyStr = obtenerFechaISOLocal();
        const fechaHoy = mediodiaUTC(fechaHoyStr);

        await adminDb.collection("training_logs").add({
            athleteId: session.user.id,
            sessionId: sessionId,
            durationMinutes: Math.round(durationSeconds / 60),
            totalVolume: calculatedVolume || totalVolume,
            totalSets: actualSets || totalSets,
            status: "completed",
            date: fechaHoy,
            endTime: new Date(),
            createdAt: new Date(),
            exercises: Array.from(exerciseMap.values())
        });

        revalidateTag("training-logs", "default");
        revalidateTag("weekly-activity", "default");
        revalidateTag("coach-stats", "default");
        revalidateTag("recent-activity", "default");
        revalidatePath("/train");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("Error finishing session:", error);
        return { success: false, error: "Error al finalizar entrenamiento" };
    }
}

// --- INTELLIGENT PROGRESSION ---

export async function getLastSessionExerciseData(exerciseId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        // Obtener historial reciente
        const setsSnapshot = await adminDb.collection("workout_sets")
            .where("exerciseId", "==", exerciseId)
            .where("athleteId", "==", session.user.id)
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();

        if (setsSnapshot.empty) return { success: true, sets: [] };

        const sets: FirestoreSetData[] = setsSnapshot.docs.map(doc => ({ ...doc.data(), createdAt: doc.data().createdAt.toDate() })) as FirestoreSetData[];

        // La última sesión es la del primer set devuelto (están ordenados por fecha desc)
        const lastSessionId = sets[0].sessionId;

        // Filtrar solo los sets de esa última sesión
        // Invertimos el orden para que coincida con Set 1, Set 2, Set 3... (cronológico dentro de la sesión)
        // Aunque createdAt desc significa que el último set hecho aparece primero. 
        // Normalmente queremos mostrarlos en orden de ejecución (ascendente).
        const lastSessionSets = sets
            .filter((s) => s.sessionId === lastSessionId)
            .sort((a, b) => a.timestamp - b.timestamp); // Ordenar cronólogicamente

        return { success: true, sets: lastSessionSets };
    } catch (error) {
        console.error("Error fetching last session data:", error);
        return { success: false, error: "Error al obtener historial" };
    }
}

export async function getProgressionSuggestion(exerciseId: string): Promise<{ success: boolean; suggestion?: ProgressionSuggestion; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const setsSnapshot = await adminDb.collection("workout_sets")
            .where("exerciseId", "==", exerciseId)
            .where("athleteId", "==", session.user.id)
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();

        if (setsSnapshot.empty) return { success: true, suggestion: undefined };

        const sets: FirestoreSetData[] = setsSnapshot.docs.map(doc => ({ ...doc.data(), createdAt: doc.data().createdAt.toDate() })) as FirestoreSetData[];
        const lastSessionId = sets[0].sessionId;
        const lastSessionSets = sets.filter((s) => s.sessionId === lastSessionId);

        if (lastSessionSets.length === 0) return { success: true };

        lastSessionSets.sort((a, b) => {
            if (b.weight !== a.weight) return b.weight - a.weight;
            return b.reps - a.reps;
        });

        const topSet = lastSessionSets[0];
        const { weight, reps, rpe, createdAt } = topSet;

        let suggestedWeight = weight;
        let reason = "Mantenimiento";
        const RPE_THRESHOLD_LOW = 7;
        const RPE_THRESHOLD_HIGH = 9;

        if (rpe == null || rpe === undefined) {
            suggestedWeight = weight;
            reason = "Sin RPE registrado. Registra tu esfuerzo percibido para mejores sugerencias.";
        } else if (rpe <= RPE_THRESHOLD_LOW) {
            suggestedWeight = weight + 2.5;
            reason = `RPE bajo (${rpe}) en última sesión. ¡Sube la carga!`;
        } else if (rpe > RPE_THRESHOLD_HIGH) {
            suggestedWeight = weight;
            reason = `RPE alto (${rpe}). Consolida este peso.`;
        } else {
            suggestedWeight = weight;
            reason = `Zona de buen esfuerzo. Intenta superar las repeticiones.`;
        }

        if (weight === 0) {
            reason = "Ejercicio de peso corporal. Intenta agregar reps o lastre.";
            suggestedWeight = 0;
        }

        return {
            success: true,
            suggestion: {
                exerciseId,
                suggestedWeight,
                reason,
                lastDate: createdAt.toISOString(),
                lastWeight: weight,
                lastReps: reps,
                lastRpe: rpe
            }
        };

    } catch (error) {
        console.error("Error calculating progression:", error);
        return { success: false, error: "Error al calcular progresión" };
    }
}



// --- REGISTRO RETROACTIVO ---

// Schema de validación para entrenamiento retroactivo
const RetroactiveSetSchema = z.object({
    weight: z.coerce.number().min(0, "El peso no puede ser negativo"),
    reps: z.coerce.number().min(0, "Las reps no pueden ser negativas"),
    rpe: z.coerce.number().min(1).max(10).optional(),
    completed: z.boolean().default(true),
});

const RetroactiveExerciseSchema = z.object({
    exerciseId: z.string().optional(),
    exerciseName: z.string().min(1, "El nombre del ejercicio es obligatorio"),
    feedback: z.string().optional(),
    sets: z.array(RetroactiveSetSchema).min(1, "Se requiere al menos una serie"),
});

const RetroactiveWorkoutSchema = z.object({
    id: z.string().optional(),
    sessionId: z.string().optional(),
    routineId: z.string().optional(),
    routineName: z.string().optional(),
    dayId: z.string().optional(),
    date: z.string().min(1, "La fecha es obligatoria"),
    durationMinutes: z.coerce.number().min(1, "La duración debe ser al menos 1 minuto"),
    sessionRpe: z.coerce.number().min(1).max(10),
    sessionNotes: z.string().optional(),
    exercises: z.array(RetroactiveExerciseSchema).min(1, "Se requiere al menos un ejercicio"),
});

export type RetroactiveWorkoutData = z.infer<typeof RetroactiveWorkoutSchema>;

export interface TrainingLogDbData {
    id?: string;
    athleteId: string;
    routineId: string | null;
    dayId: string | null;
    routineName: string;
    date: Date;
    durationMinutes: number;
    sessionRpe: number;
    sessionNotes: string;
    status: string;
    isRetroactive: boolean;
    startTime: Date;
    endTime: Date;
    sessionId?: string;
    exercises: Array<{
        exerciseId: string;
        exerciseName: string;
        feedback: string;
        sets: Array<{
            weight: number;
            reps: number;
            rpe: number | null;
            completed: boolean;
        }>;
    }>;
    updatedAt: Date;
    createdAt?: Date;
    [key: string]: unknown;
}

export async function logRetroactiveWorkout(data: RetroactiveWorkoutData) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const validation = RetroactiveWorkoutSchema.safeParse(data);
    if (!validation.success) {
        const firstError = validation.error.issues[0]?.message || "Datos inválidos";
        return { success: false, error: firstError };
    }

    const validated = validation.data;

    try {
        // Usar mediodía UTC para que la conversión TZ no cambie el día
        const workoutDate = mediodiaUTC(validated.date);

        const logData: TrainingLogDbData = {
            athleteId: session.user.id,
            routineId: validated.routineId || null,
            dayId: validated.dayId || null,
            routineName: validated.routineName || "Registro Manual",
            date: workoutDate,
            durationMinutes: validated.durationMinutes,
            sessionRpe: validated.sessionRpe,
            sessionNotes: validated.sessionNotes || "",
            status: "completed",
            isRetroactive: true,
            startTime: workoutDate,
            endTime: new Date(workoutDate.getTime() + validated.durationMinutes * 60000),
            exercises: validated.exercises.map(ex => ({
                exerciseId: ex.exerciseId || "",
                exerciseName: ex.exerciseName,
                feedback: ex.feedback || "",
                sets: ex.sets.map(s => ({
                    weight: s.weight,
                    reps: s.reps,
                    rpe: s.rpe || null,
                    completed: s.completed,
                })),
            })),
            updatedAt: new Date(),
        };

        const batch = adminDb.batch();
        const currentSessionId = validated.sessionId || `retro_${Date.now()}_${session.user.id.slice(0, 6)}`;
        logData.sessionId = currentSessionId;

        if (validated.id) {
            // Actualizar log existente
            const logRef = adminDb.collection("training_logs").doc(validated.id);
            batch.update(logRef, logData);

            // Borramos los sets anteriores subidos con este sessionId
            if (validated.sessionId) {
                const oldSetsSnap = await adminDb.collection("workout_sets")
                    .where("sessionId", "==", validated.sessionId)
                    .where("athleteId", "==", session.user.id)
                    .get();
                oldSetsSnap.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
            }
        } else {
            // Crear log nuevo
            logData.createdAt = new Date();
            const logRef = adminDb.collection("training_logs").doc();
            batch.set(logRef, logData);
        }

        // Guardar sets individuales nuevos/reemplazados para historial de progresión
        for (const exercise of validated.exercises) {
            for (const set of exercise.sets) {
                if (set.weight > 0 || set.reps > 0) {
                    const setRef = adminDb.collection("workout_sets").doc();
                    batch.set(setRef, {
                        exerciseId: exercise.exerciseId || "",
                        exerciseName: exercise.exerciseName,
                        weight: set.weight,
                        reps: set.reps,
                        rpe: set.rpe || null,
                        sessionId: currentSessionId,
                        athleteId: session.user.id,
                        timestamp: workoutDate.getTime(),
                        createdAt: workoutDate,
                    });
                }
            }
        }

        await batch.commit();

        // Invalidar cache de historial
        revalidateTag("training-logs", "default");
        revalidateTag("weekly-activity", "default");
        revalidateTag("coach-stats", "default");
        revalidateTag("recent-activity", "default");
        revalidatePath("/train");
        revalidatePath("/history");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("Error al registrar entrenamiento retroactivo:", error);
        return { success: false, error: "Error al guardar el entrenamiento" };
    }
}

// Obtener registro completado para la fecha de hoy/especificada
export async function getWorkoutLogByDate(dateStr: string): Promise<{ success: boolean; log: TrainingLogDbData | null; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado", log: null };

    try {
        // Usar UTC consistente para queries de Firestore
        const startOfDay = inicioDelDia(dateStr);
        const endOfDay = finDelDia(dateStr);

        const snapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", session.user.id)
            .where("date", ">=", startOfDay)
            .where("date", "<=", endOfDay)
            .where("status", "==", "completed")
            .limit(1)
            .get();

        if (snapshot.empty) {
            return { success: true, log: null };
        }

        const doc = snapshot.docs[0];

        return {
            success: true,
            log: serializeFirestoreData({ id: doc.id, ...doc.data() }) as TrainingLogDbData
        };
    } catch (error) {
        console.error("Error fetching log by date:", error);
        return { success: false, error: "Error al buscar entrenamiento por fecha", log: null };
    }
}
