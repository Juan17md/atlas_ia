"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { unstable_cache } from "next/cache";
import type { TrainingSetData, TrainingExerciseData } from "@/types";

// Caché para estadísticas del coach (revalida cada 60 segundos)
const getCachedCoachStats = unstable_cache(
    async (coachId: string) => {
        // Obtener IDs de atletas vinculados al coach
        const athletesSnap = await adminDb.collection("users")
            .where("coachId", "==", coachId)
            .where("role", "in", ["athlete", "advanced_athlete"])
            .get();
        const athleteIds = athletesSnap.docs.map(d => d.id);
        const totalAthletes = athleteIds.length;

        // 1 y 2. Contar rutinas y ejercicios del coach en paralelo
        const [routinesSnapshot, exercisesSnapshot] = await Promise.all([
            adminDb.collection("routines").where("coachId", "==", coachId).count().get(),
            adminDb.collection("exercises").where("coachId", "==", coachId).count().get()
        ]);

        const totalRoutines = routinesSnapshot.data().count;
        const totalExercises = exercisesSnapshot.data().count;

        // 3. Calcular volumen semanal SOLO de atletas del coach
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        startOfWeek.setHours(0, 0, 0, 0);

        let weeklyVolume = 0;
        const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
        const activityMap = new Map<string, number>();
        days.forEach(d => activityMap.set(d, 0));

        const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

        if (athleteIds.length > 0) {
            // Procesar en chunks de 30 (límite de Firestore para `in`)
            const CHUNK_SIZE = 30;
            for (let i = 0; i < athleteIds.length; i += CHUNK_SIZE) {
                const chunk = athleteIds.slice(i, i + CHUNK_SIZE);
                const globalLogs = await adminDb.collection("training_logs")
                    .where("athleteId", "in", chunk)
                    .where("date", ">=", startOfWeek)
                    .get();

                globalLogs.docs.forEach(doc => {
                    const data = doc.data();
                    let sessionVol = 0;

                    data.exercises?.forEach((ex: TrainingExerciseData) => {
                        ex.sets?.forEach((s: TrainingSetData) => {
                            if (s.completed && s.weight && s.reps) {
                                sessionVol += (s.weight * s.reps);
                                weeklyVolume += (s.weight * s.reps);
                            }
                        });
                    });

                    const date = data.date?.toDate?.() || new Date();
                    const dayName = DAYS_ES[date.getDay()];
                    activityMap.set(dayName, (activityMap.get(dayName) || 0) + sessionVol);
                });
            }
        }

        const weeklyChartData = days.map(d => ({ name: d, total: activityMap.get(d) || 0 }));

        return {
            totalAthletes,
            totalRoutines,
            totalExercises,
            weeklyVolume,
            weeklyChartData
        };
    },
    ["coach-stats"],
    { revalidate: 60, tags: ["coach-stats"] }
);

export async function getCoachStats() {
    const session = await auth();
    if (session?.user?.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const stats = await getCachedCoachStats(session.user.id);
        return { success: true, stats };
    } catch (error) {
        console.error("Error fetching coach stats:", error);
        return {
            success: false,
            stats: {
                totalAthletes: 0,
                totalRoutines: 0,
                totalExercises: 0,
                weeklyVolume: 0,
                weeklyChartData: []
            }
        };
    }
}

// Caché para actividad reciente con datos de usuario pre-cargados
const getCachedRecentActivity = unstable_cache(
    async () => {
        const snapshot = await adminDb.collection("training_logs")
            .orderBy("date", "desc")
            .limit(5)
            .get();

        // Obtener IDs únicos de usuarios para hacer una sola consulta batch
        const userIds = new Set<string>();
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const uid = data.userId || data.athleteId;
            if (uid) userIds.add(uid);
        });

        // Fetch de usuarios en batch (una sola consulta)
        const userMap = new Map<string, { name: string; image: string | null }>();
        if (userIds.size > 0) {
            const userDocs = await adminDb.collection("users")
                .where("__name__", "in", Array.from(userIds).slice(0, 10)) // Limit de Firestore
                .get();

            userDocs.docs.forEach(doc => {
                const data = doc.data();
                userMap.set(doc.id, {
                    name: data.name || "Atleta",
                    image: data.image || null
                });
            });
        }

        const activities = snapshot.docs.map(doc => {
            const data = doc.data();
            const uid = data.userId || data.athleteId;
            const user = userMap.get(uid) || { name: "Atleta Desconocido", image: null };

            let sessionVol = 0;
            data.exercises?.forEach((ex: TrainingExerciseData) => {
                ex.sets?.forEach((s: TrainingSetData) => {
                    if (s.completed && s.weight && s.reps) sessionVol += (s.weight * s.reps);
                });
            });

            return {
                id: doc.id,
                athleteName: user.name,
                athleteImage: user.image,
                routineName: data.routineName || "Entrenamiento Libre",
                date: data.date?.toDate?.()?.toISOString() || new Date().toISOString(),
                volume: sessionVol,
                exercisesCount: data.exercises?.length || 0
            };
        });

        return activities;
    },
    ["recent-activity"],
    { revalidate: 30, tags: ["recent-activity"] } // Revalida cada 30 segundos
);

export async function getRecentActivity() {
    const session = await auth();
    if (session?.user?.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const activities = await getCachedRecentActivity();
        return { success: true, activities };
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        return { success: false, activities: [] };
    }
}
