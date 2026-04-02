"use server";

import { adminDb, serializeFirestoreData } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { revalidateTag, revalidatePath } from "next/cache";

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

        revalidatePath("/train");
        return { success: true, workoutId: workoutRef.id };
    } catch (error) {
        console.error("Error starting workout:", error);
        return { success: false, error: "Error al iniciar entrenamiento" };
    }
}
