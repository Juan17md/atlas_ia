"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";

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

export interface ProgressionSuggestion {
    exerciseId: string;
    suggestedWeight: number;
    reason: string;
    lastDate?: string;
    lastWeight?: number;
    lastReps?: number;
    lastRpe?: number;
}

import { getLastSessionExerciseData } from "./training-logs";

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

        const sets: FirestoreSetData[] = setsSnapshot.docs.map(doc => ({ 
            ...doc.data(), 
            createdAt: doc.data().createdAt.toDate() 
        })) as FirestoreSetData[];
        
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
