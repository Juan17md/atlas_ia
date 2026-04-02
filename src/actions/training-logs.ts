"use server";

import { adminDb, serializeFirestoreData } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { revalidateTag, revalidatePath } from "next/cache";
import { obtenerFechaISOLocal, inicioDelDia, finDelDia, mediodiaUTC } from "@/lib/fecha-utils";
import { TrainingLogData } from "@/types/api";

// --- TYPES ---
export interface WorkoutSessionData {
    routineId?: string;
    routineName?: string;
    exercises?: Array<{
        exerciseId?: string;
        exerciseName?: string;
        exerciseIdUsed?: string;
        variantIds?: string[];
        sets: any[];
        feedback?: string;
    }>;
    totalSets?: number;
    notes?: string;
    sessionRpe?: number;
    sessionNotes?: string;
    dayId?: string;
    assignmentId?: string;
}

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
    sessionRpe: number;
    sessionNotes: string;
    status: string;
    isRetroactive: boolean;
    startTime: Date;
    endTime: Date;
    sessionId?: string;
    exercises: any[];
    updatedAt: Date;
    createdAt?: Date;
    [key: string]: unknown;
}

// --- ACTIONS ---

export async function getTrainingLogs(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };
    const targetId = userId || session.user.id;
    if (targetId !== session.user.id && session.user.role !== "coach") return { success: false, error: "No autorizado" };

    try {
        const snapshot = await adminDb.collection("training_logs").where("athleteId", "==", targetId).orderBy("date", "desc").limit(20).get();
        const logs = snapshot.docs.map(doc => serializeFirestoreData({ id: doc.id, ...doc.data() }) as TrainingLogData);
        return { success: true, logs };
    } catch (error) {
        console.error("Error fetching logs:", error);
        return { success: false, error: "Error al cargar historial" };
    }
}

export async function logWorkoutSession(data: WorkoutSessionData) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const sessionId = `session_${Date.now()}_${session.user.id.slice(0, 6)}`;
        const fechaHoyStr = obtenerFechaISOLocal();
        const workoutDate = mediodiaUTC(fechaHoyStr);
        const batch = adminDb.batch();

        const logRef = adminDb.collection("training_logs").doc();
        batch.set(logRef, { ...data, athleteId: session.user.id, sessionId, assignmentId: data.assignmentId || null, status: "completed", date: workoutDate, createdAt: workoutDate });

        if (data.exercises) {
            for (const exercise of data.exercises) {
                for (const set of exercise.sets) {
                    if ((set.weight || 0) > 0 || (set.reps || 0) > 0) {
                        const setRef = adminDb.collection("workout_sets").doc();
                        batch.set(setRef, { exerciseId: exercise.exerciseId || "", exerciseName: exercise.exerciseName || "", weight: set.weight || 0, reps: set.reps || 0, rpe: set.rpe || null, sessionId, athleteId: session.user.id, timestamp: workoutDate.getTime(), createdAt: workoutDate });
                    }
                }
            }
        }
        await batch.commit();
        revalidateAllTags();
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
        const hoyStr = obtenerFechaISOLocal();
        const snapshot = await adminDb.collection("training_logs").where("athleteId", "==", session.user.id).where("date", ">=", inicioDelDia(hoyStr)).where("date", "<=", finDelDia(hoyStr)).get();
        return { success: true, completed: snapshot.docs.some(doc => doc.data().status !== "in_progress") };
    } catch (error) {
        console.error("Error checking completed workout:", error);
        return { success: false, completed: false };
    }
}

export async function logRetroactiveWorkout(data: RetroactiveWorkoutData) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const validation = RetroactiveWorkoutSchema.safeParse(data);
    if (!validation.success) return { success: false, error: validation.error.issues[0]?.message || "Datos inválidos" };
    const validated = validation.data;

    try {
        const workoutDate = mediodiaUTC(validated.date);
        const currentSessionId = validated.sessionId || `retro_${Date.now()}_${session.user.id.slice(0, 6)}`;
        
        const logData: TrainingLogDbData = {
            athleteId: session.user.id, routineId: validated.routineId || null, dayId: validated.dayId || null, routineName: validated.routineName || "Registro Manual", date: workoutDate, sessionRpe: validated.sessionRpe, sessionNotes: validated.sessionNotes || "", status: "completed", isRetroactive: true, startTime: workoutDate, endTime: new Date(), sessionId: currentSessionId,
            exercises: validated.exercises.map(ex => ({ exerciseId: ex.exerciseId || "", exerciseName: ex.exerciseName, feedback: ex.feedback || "", sets: ex.sets.map(s => ({ weight: s.weight, reps: s.reps, rpe: s.rpe || null, completed: s.completed })) })), updatedAt: new Date()
        };

        const batch = adminDb.batch();
        if (validated.id) {
            batch.update(adminDb.collection("training_logs").doc(validated.id), logData);
            if (validated.sessionId) {
                const oldSetsSnap = await adminDb.collection("workout_sets").where("sessionId", "==", validated.sessionId).where("athleteId", "==", session.user.id).get();
                oldSetsSnap.docs.forEach(doc => batch.delete(doc.ref));
            }
        } else {
            logData.createdAt = new Date();
            batch.set(adminDb.collection("training_logs").doc(), logData);
        }

        for (const exercise of validated.exercises) {
            for (const set of exercise.sets) {
                if (set.weight > 0 || set.reps > 0) {
                    batch.set(adminDb.collection("workout_sets").doc(), { exerciseId: exercise.exerciseId || "", exerciseName: exercise.exerciseName, weight: set.weight, reps: set.reps, rpe: set.rpe || null, sessionId: currentSessionId, athleteId: session.user.id, timestamp: workoutDate.getTime(), createdAt: workoutDate });
                }
            }
        }
        await batch.commit();
        revalidateAllTags();
        return { success: true };
    } catch (error) {
        console.error("Error logging retroactive:", error);
        return { success: false, error: "Error al guardar el entrenamiento" };
    }
}

export async function getWorkoutLogByDate(dateStr: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado", log: null };
    try {
        const snapshot = await adminDb.collection("training_logs").where("athleteId", "==", session.user.id).where("date", ">=", inicioDelDia(dateStr)).where("date", "<=", finDelDia(dateStr)).where("status", "==", "completed").limit(1).get();
        if (snapshot.empty) return { success: true, log: null };
        return { success: true, log: serializeFirestoreData({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() }) as any };
    } catch (error) {
        return { success: false, error: "Error al buscar log", log: null };
    }
}

export async function markAsRestDay(dateStr?: string, existingLogId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };
    try {
        const fechaStr = dateStr || obtenerFechaISOLocal();
        const workoutDate = mediodiaUTC(fechaStr);
        const logIdToUse = existingLogId;
        const restLogData = { athleteId: session.user.id, routineName: "Descanso", date: workoutDate, status: "completed", isRestDay: true, sessionRpe: null, exercises: [], createdAt: new Date(), updatedAt: new Date() };

        if (logIdToUse) {
            await adminDb.collection("training_logs").doc(logIdToUse).update(restLogData);
            const setsSnap = await adminDb.collection("workout_sets").where("sessionId", "==", (await adminDb.collection("training_logs").doc(logIdToUse).get()).data()?.sessionId).where("athleteId", "==", session.user.id).get();
            const batch = adminDb.batch();
            setsSnap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        } else {
            await adminDb.collection("training_logs").add(restLogData);
        }
        revalidateAllTags();
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error al marcar descanso" };
    }
}

export async function getLastSessionExerciseData(exerciseId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const snapshot = await adminDb.collection("workout_sets")
            .where("athleteId", "==", session.user.id)
            .where("exerciseId", "==", exerciseId)
            .orderBy("timestamp", "desc")
            .limit(10) 
            .get();

        if (snapshot.empty) return { success: true, sets: [] };

        const allSets = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const latestSessionId = (allSets[0] as any).sessionId;
        const latestSets = allSets.filter((s: any) => s.sessionId === latestSessionId);

        return { success: true, sets: serializeFirestoreData(latestSets) as any[] };
    } catch (error) {
        console.error("Error fetching last session data:", error);
        return { success: false, error: "Error al cargar historial del ejercicio" };
    }
}

// Helpers
function revalidateAllTags() {
    revalidateTag("training-logs", "default");
    revalidateTag("weekly-activity", "default");
    revalidateTag("coach-stats", "default");
    revalidateTag("recent-activity", "default");
    revalidatePath("/train");
    revalidatePath("/history");
    revalidatePath("/dashboard");
}
