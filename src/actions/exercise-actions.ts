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

// Schema rápido para crear ejercicio con mínimo de campos desde el editor de rutina
const QuickExerciseSchema = z.object({
    name: z.string().min(1, "El nombre del ejercicio es obligatorio"),
    muscleGroups: z.array(z.string()).min(1, "Debe seleccionar al menos un grupo muscular"),
    description: z.string().optional(),
    tipoEjercicio: z.enum(["reps", "time"]).optional(),
    duracionSegundos: z.number().optional(),
});

export async function createQuickExercise(data: z.infer<typeof QuickExerciseSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    const validation = QuickExerciseSchema.safeParse(data);
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
        revalidatePath("/routines");
        revalidateTag("exercises", "default");

        return { success: true, id: docRef.id, name: validation.data.name };
    } catch (error) {
        console.error("Error creating quick exercise:", error);
        return { success: false, error: "Error al crear ejercicio" };
    }
}

export async function getExercises() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    try {
        let exercisesQuery: FirebaseFirestore.Query = adminDb.collection("exercises");

        // Ver ejercicios propios
        exercisesQuery = exercisesQuery.where("coachId", "==", session.user.id);

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
    if (!session?.user?.id) {
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

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating exercise:", error);
        return { success: false, error: "Error al crear ejercicio" };
    }
}

export async function updateExercise(id: string, data: ExerciseInput) {
    const session = await auth();
    if (!session?.user?.id) {
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

        if (!isCreator) {
            return { success: false, error: "No tienes permiso para editar este ejercicio" };
        }

        await docRef.update({
            ...validation.data,
            updatedAt: new Date(),
        });

        revalidatePath("/exercises");
        revalidatePath("/dashboard");
        revalidateTag("exercises", "default");

        return { success: true };
    } catch (error) {
        console.error("Error updating exercise:", error);
        return { success: false, error: "Error al actualizar ejercicio" };
    }
}

export async function deleteExercise(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
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

        if (!isCreator) {
            return { success: false, error: "No tienes permiso para eliminar este ejercicio" };
        }

        // Verificar si el ejercicio está siendo usado en cualquier rutina
        const exerciseName = docSnap.data()?.name;
        const routinesUsingExercise = await adminDb.collection("routines")
            .get();
        
        const usedInRoutines: string[] = [];
        for (const routineDoc of routinesUsingExercise.docs) {
            const routineData = routineDoc.data();
            if (routineData.deletedAt) continue;
            const schedule = routineData.schedule || [];
            for (const day of schedule) {
                const exercises = day.exercises || [];
                for (const ex of exercises) {
                    if (ex.exerciseId === id || ex.exerciseName === exerciseName) {
                        usedInRoutines.push(routineData.name || routineDoc.id);
                        break;
                    }
                }
                if (usedInRoutines.includes(routineData.name || routineDoc.id)) break;
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
