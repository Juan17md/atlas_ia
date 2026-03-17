"use server";

import { z } from "zod";
import { ExerciseSchema } from "@/lib/schemas";
import { adminDb, serializeFirestoreData } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { ExerciseListItem } from "@/types/api";
import { revalidatePath, revalidateTag } from "next/cache";

// Input schema for creating/updating exercises (excludes system fields)
const ExerciseInputSchema = ExerciseSchema.omit({
    id: true,
    coachId: true,
    createdAt: true,
    updatedAt: true
});

export type ExerciseInput = z.infer<typeof ExerciseInputSchema>;

export async function getExercises() {
    const session = await auth();
    const role = session?.user?.role as string;
    if (!session?.user?.id || (role !== "coach" && role !== "advanced_athlete")) {
        return { success: false, error: "No autorizado" };
    }

    try {
        let exercisesQuery: FirebaseFirestore.Query = adminDb.collection("exercises");

        // Coach ve solo sus propios ejercicios; atleta avanzado ve los suyos y los de su coach
        if (session.user.role === "coach") {
            exercisesQuery = exercisesQuery.where("coachId", "==", session.user.id);
        } else {
            // Atleta avanzado: ver ejercicios propios y de su coach
            const userDoc = await adminDb.collection("users").doc(session.user.id).get();
            const coachId = userDoc.data()?.coachId;
            const ownerIds = [session.user.id];
            if (coachId) ownerIds.push(coachId);
            exercisesQuery = exercisesQuery.where("coachId", "in", ownerIds);
        }

        const snapshot = await exercisesQuery.get();

        if (snapshot.empty) {
            return { success: true, exercises: [] };
        }

        const exercises = snapshot.docs.map(doc => {
            return serializeFirestoreData({ id: doc.id, ...doc.data() }) as ExerciseListItem;
        });

        return { success: true, exercises };
    } catch (error) {
        console.error("Error fetching exercises:", error);
        return { success: false, error: "Error al cargar ejercicios" };
    }
}

export async function createExercise(data: ExerciseInput) {
    const session = await auth();
    const role = session?.user?.role as string;
    if (!session?.user?.id || (role !== "coach" && role !== "advanced_athlete")) {
        return { success: false, error: "No autorizado" };
    }

    const validation = ExerciseInputSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Datos inválidos" };
    }

    try {
        const newExercise = {
            ...validation.data,
            coachId: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await adminDb.collection("exercises").add(newExercise);

        revalidatePath("/exercises");
        revalidatePath("/dashboard");
        revalidateTag("exercises", "default");
        revalidateTag("coach-stats", "default");

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating exercise:", error);
        return { success: false, error: "Error al crear ejercicio" };
    }
}

export async function updateExercise(id: string, data: ExerciseInput) {
    const session = await auth();
    const role = session?.user?.role as string;
    if (!session?.user?.id || (role !== "coach" && role !== "advanced_athlete")) {
        return { success: false, error: "No autorizado" };
    }

    const validation = ExerciseInputSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Datos inválidos" };
    }

    try {
        const docRef = adminDb.collection("exercises").doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return { success: false, error: "Ejercicio no encontrado" };
        }

        const exerciseCoachId = docSnap.data()?.coachId;
        const isCreator = exerciseCoachId === session.user.id;

        // Atleta avanzado puede editar ejercicios de su coach
        let isAdvancedWithAccess = false;
        if (!isCreator && role === 'advanced_athlete') {
            const userDoc = await adminDb.collection('users').doc(session.user.id).get();
            const myCoachId = userDoc.data()?.coachId;
            isAdvancedWithAccess = !!myCoachId && exerciseCoachId === myCoachId;
        }

        if (!isCreator && !isAdvancedWithAccess) {
            return { success: false, error: "No tienes permiso para editar este ejercicio" };
        }

        await docRef.update({
            ...validation.data,
            updatedAt: new Date(),
        });

        revalidatePath("/exercises");
        revalidatePath("/dashboard");
        revalidateTag("exercises", "default");
        revalidateTag("coach-stats", "default");

        return { success: true };
    } catch (error) {
        console.error("Error updating exercise:", error);
        return { success: false, error: "Error al actualizar ejercicio" };
    }
}

export async function deleteExercise(id: string) {
    const session = await auth();
    const role = session?.user?.role as string;
    if (!session?.user?.id || (role !== "coach" && role !== "advanced_athlete")) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const docRef = adminDb.collection("exercises").doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return { success: false, error: "Ejercicio no encontrado" };
        }

        const exerciseCoachId = docSnap.data()?.coachId;
        const isCreator = exerciseCoachId === session.user.id;

        // Atleta avanzado puede eliminar ejercicios de su coach
        let isAdvancedWithAccess = false;
        if (!isCreator && role === 'advanced_athlete') {
            const userDoc = await adminDb.collection('users').doc(session.user.id).get();
            const myCoachId = userDoc.data()?.coachId;
            isAdvancedWithAccess = !!myCoachId && exerciseCoachId === myCoachId;
        }

        if (!isCreator && !isAdvancedWithAccess) {
            return { success: false, error: "No tienes permiso para eliminar este ejercicio" };
        }

        // Verificar si el ejercicio está siendo usado en rutinas activas
        const exerciseName = docSnap.data()?.name;
        const routinesUsingExercise = await adminDb.collection("routines")
            .where("active", "==", true)
            .get();
        
        const usedInRoutines: string[] = [];
        for (const routineDoc of routinesUsingExercise.docs) {
            const routineData = routineDoc.data();
            const schedule = routineData.schedule || [];
            for (const day of schedule) {
                const exercises = day.exercises || [];
                for (const ex of exercises) {
                    if (ex.exerciseId === id || ex.exerciseName === exerciseName) {
                        usedInRoutines.push(routineDoc.data().name || routineDoc.id);
                        break;
                    }
                }
                if (usedInRoutines.includes(routineDoc.data().name || routineDoc.id)) break;
            }
        }

        if (usedInRoutines.length > 0) {
            return { 
                success: false, 
                error: `El ejercicio está siendo usado en las siguientes rutinas activas: ${usedInRoutines.join(", ")}. Elimina el ejercicio de las rutinas primero.` 
            };
        }

        await docRef.delete();

        revalidatePath("/exercises");
        revalidatePath("/dashboard");
        revalidateTag("exercises", "default");
        revalidateTag("coach-stats", "default");

        return { success: true };
    } catch (error) {
        console.error("Error deleting exercise:", error);
        return { success: false, error: "Error al eliminar ejercicio" };
    }
}
export async function getExerciseNames(ids: string[]) {
    if (!ids || ids.length === 0) return { success: true, names: {} };

    try {
        const names: Record<string, string> = {};

        // Firestore 'in' query soporta máximo 30 IDs, así que dividimos en chunks
        const CHUNK_SIZE = 30;
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            chunks.push(ids.slice(i, i + CHUNK_SIZE));
        }

        for (const chunk of chunks) {
            const snapshot = await adminDb.collection("exercises")
                .where("__name__", "in", chunk)
                .get();

            snapshot.docs.forEach(doc => {
                names[doc.id] = doc.data().name;
            });
        }

        return { success: true, names };
    } catch (error) {
        console.error("Error fetching exercise names:", error);
        return { success: false, error: "Error al cargar nombres de ejercicios" };
    }
}
