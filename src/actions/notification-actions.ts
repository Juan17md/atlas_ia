"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { unstable_cache } from "next/cache";

interface TrainingSet {
    reps?: number;
    weight?: number;
    rpe?: number;
    completed?: boolean;
}

interface TrainingExercise {
    sets?: TrainingSet[];
}

interface TrainingLog {
    id?: string;
    athleteId?: string;
    athleteName?: string;
    date?: { toDate: () => Date };
    routineName?: string;
    exercises?: TrainingExercise[];
}

// Caché para notificaciones del coach (revalida cada 2 minutos)
const getCachedCoachNotifications = unstable_cache(
    async () => {
        const logsSnapshot = await adminDb.collection("training_logs")
            .orderBy("date", "desc")
            .limit(10)
            .get();

        if (logsSnapshot.empty) {
            return [];
        }

        // Batch query para nombres de atletas (evita N+1)
        const athleteIds = [...new Set(logsSnapshot.docs.map(doc => doc.data().athleteId).filter(Boolean))];
        const athleteNames = new Map<string, string>();

        if (athleteIds.length > 0) {
            const userDocs = await adminDb.collection("users")
                .where("__name__", "in", athleteIds.slice(0, 10))
                .get();
            userDocs.docs.forEach(doc => {
                athleteNames.set(doc.id, doc.data()?.name || "Sin nombre");
            });
        }

        // Agrupar logs por atleta para calcular progreso real
        const athleteLogs = new Map<string, TrainingLog[]>();
        logsSnapshot.docs.forEach(doc => {
            const data = doc.data() as TrainingLog;
            const uid = data.athleteId;
            if (uid && !athleteLogs.has(uid)) athleteLogs.set(uid, []);
            if (uid) athleteLogs.get(uid)!.push({ id: doc.id, ...data });
        });

        // Solo generar notificaciones de los últimos 5 logs completados
        const recentDocs = logsSnapshot.docs.slice(0, 5);

        const notifications = recentDocs.map(doc => {
            const data = doc.data() as TrainingLog;
            const date = data.date?.toDate();
            const athleteName = data.athleteId ? (athleteNames.get(data.athleteId) || data.athleteName || "Sin nombre") : "Sin nombre";
            const routineName = data.routineName || "Rutina";

            // Calcular volumen de esta sesión
            let currentVolume = 0;
            data.exercises?.forEach((ex: TrainingExercise) => {
                ex.sets?.forEach((s: TrainingSet) => {
                    if (s.completed && s.weight && s.reps) {
                        currentVolume += (s.weight * s.reps);
                    }
                });
            });

            // Buscar sesión anterior del mismo atleta para comparar
            const sameLogs = athleteLogs.get(data.athleteId!) || [];
            const prevLog = sameLogs.find((l: TrainingLog) => l.id !== doc.id);
            let progressMsg = `Volumen total: ${Math.round(currentVolume).toLocaleString()} kg.`;

            if (prevLog) {
                let prevVolume = 0;
                prevLog.exercises?.forEach((ex: TrainingExercise) => {
                    ex.sets?.forEach((s: TrainingSet) => {
                        if (s.completed && s.weight && s.reps) {
                            prevVolume += (s.weight * s.reps);
                        }
                    });
                });

                if (prevVolume > 0) {
                    const diff = ((currentVolume - prevVolume) / prevVolume) * 100;
                    const sign = diff >= 0 ? "+" : "";
                    progressMsg = `Volumen: ${Math.round(currentVolume).toLocaleString()} kg (${sign}${diff.toFixed(1)}% vs sesión anterior).`;
                }
            }

            return {
                id: doc.id,
                title: "Sesión Completada",
                message: `${athleteName} completó "${routineName}". ${progressMsg}`,
                time: date?.toISOString() || new Date().toISOString(),
                type: "ia_analysis",
                read: false,
                athleteId: data.athleteId
            };
        });

        return notifications;
    },
    ["coach-notifications"],
    { revalidate: 120, tags: ["notifications", "coach-notifications"] }
);

export async function getCoachNotifications() {
    const session = await auth();
    if (session?.user?.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const notifications = await getCachedCoachNotifications();

        // Obtener fecha de última lectura del coach
        const userDoc = await adminDb.collection("users").doc(session.user.id).get();
        const lastRead = userDoc.data()?.lastReadNotificationsAt?.toDate() || new Date(0);

        // Procesar estado de lectura
        const processedNotifications = notifications.map(n => ({
            ...n,
            read: new Date(n.time) <= lastRead
        }));

        return { success: true, notifications: processedNotifications };
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return { success: false, error: "Error al cargar notificaciones" };
    }
}

// Caché para notificaciones del atleta (revalida cada 5 minutos)
const getCachedAthleteNotifications = unstable_cache(
    async (userId: string) => {
        const userDoc = await adminDb.collection("users").doc(userId).get();
        if (!userDoc.exists) return [];

        const userData = userDoc.data();
        const notifications = [];
        const now = new Date();

        // 1. Verificación de medidas (Cada 30 días o si nunca se ha medido tras un tiempo)
        const measurements = userData?.measurements || {};
        // Filtramos 'updatedAt' si existe para ver si hay datos reales
        const hasMeasurements = Object.keys(measurements).filter(k => k !== 'updatedAt').length > 0;

        const createdAt = userData?.createdAt?.toDate() || new Date();

        // Intentar obtener la fecha de la última medida
        // Si no tiene fecha específica de medidas pero tiene datos, usamos la fecha de actualización del perfil (onboarding)
        let lastMeasurementDate = measurements.updatedAt?.toDate();
        if (!lastMeasurementDate && hasMeasurements) {
            lastMeasurementDate = userData?.updatedAt?.toDate() || createdAt;
        }

        let needsUpdate = false;
        let notifMessage = "Ha pasado un mes desde tu último registro. ¡Actualiza tus medidas para ver tu progreso!";

        if (lastMeasurementDate) {
            const diffTime = Math.abs(now.getTime() - lastMeasurementDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 30) needsUpdate = true;
        } else {
            // Si realmente NO tiene medidas, verificamos antigüedad de la cuenta
            const diffSinceCreation = Math.abs(now.getTime() - createdAt.getTime());
            const daysSinceCreation = Math.ceil(diffSinceCreation / (1000 * 60 * 60 * 24));

            // Solo molestamos si ya pasaron 3 días desde el registro y no hay medidas
            if (daysSinceCreation > 3) {
                needsUpdate = true;
                notifMessage = "Aún no has registrado tus medidas corporales. ¡Hazlo para empezar a medir tu progreso!";
            }
        }

        if (needsUpdate) {
            notifications.push({
                id: "measurements-update-needed",
                title: lastMeasurementDate ? "Actualizar Medidas" : "Registra tus Medidas",
                message: notifMessage,
                time: new Date().toISOString(),
                type: "alert",
                read: false, // Se actualizará fuera del cache
                link: "/profile"
            });
        }

        return notifications;
    },
    ["athlete-notifications"],
    { revalidate: 300, tags: ["notifications", "athlete-notifications"] }
);

export async function getAthleteNotifications() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const notifications = await getCachedAthleteNotifications(session.user.id);

        // Obtener fecha de última lectura
        const userDoc = await adminDb.collection("users").doc(session.user.id).get();
        const lastRead = userDoc.data()?.lastReadNotificationsAt?.toDate() || new Date(0);

        // Procesar estado de lectura
        const processedNotifications = notifications.map(n => ({
            ...n,
            read: new Date(n.time) <= lastRead
        }));

        return { success: true, notifications: processedNotifications };
    } catch (error) {
        console.error("Error fetching athlete notifications:", error);
        return { success: false, error: "Error al cargar notificaciones" };
    }
}

export async function markAllNotificationsAsRead() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        await adminDb.collection("users").doc(session.user.id).update({
            lastReadNotificationsAt: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        return { success: false, error: "Error al actualizar" };
    }
}
