"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BodyMeasurementLogSchema } from "@/lib/schemas";

type BodyMeasurementInput = Partial<Omit<z.input<typeof BodyMeasurementLogSchema>, "date">> & { date?: Date | string };

export async function logBodyMeasurements(data: BodyMeasurementInput, targetUserId?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    const userId = targetUserId || session.user.id;

    // Si un coach intenta guardar para un atleta, verificar que sea SU atleta
    if (targetUserId && targetUserId !== session.user.id) {
        if (session.user.role !== "coach") {
            return { success: false, error: "No autorizado para editar otros perfiles" };
        }
        // Verificar relación coach-atleta
        const athleteDoc = await adminDb.collection("users").doc(targetUserId).get();
        if (!athleteDoc.exists || athleteDoc.data()?.coachId !== session.user.id) {
            return { success: false, error: "Este atleta no está vinculado a tu cuenta" };
        }
    }

    try {
        // Obtener datos del usuario objetivo (no necesariamente el usuario actual)
        const userSnapshot = await adminDb.collection("users").doc(userId).get();
        const userData = userSnapshot.data();
        const height = userData?.height; // centímetros
        const gender = userData?.gender || "male";

        // ... resto de la lógica usando userId ...

        // Calcular porcentaje de grasa corporal si es posible (Método Oficial US Navy)
        let calculatedBodyFat: number | undefined = undefined;
        let bodyFatWarning: string | undefined = undefined;

        if (height && data.waist && data.neck) {
            // Fórmula Navy (Versión Métrica)
            // Hombres: BF = 495 / (1.0324 - 0.19077 * log10(cintura - cuello) + 0.15456 * log10(altura)) - 450
            // Mujeres: BF = 495 / (1.29579 - 0.35004 * log10(cintura + cadera - cuello) + 0.22100 * log10(altura)) - 450

            const log10 = Math.log10;
            const h = height;
            const w = data.waist;
            const n = data.neck;

            // Validar medidas fisiológicamente posibles
            if (w <= n) {
                bodyFatWarning = "La cintura debe ser mayor que el cuello para calcular grasa corporal";
            } else if (gender === "male" || (gender !== "female")) { // Por defecto usar masculino si se desconoce
                const diff = w - n;
                if (diff > 0 && h > 0) {
                    const denom = 1.0324 - 0.19077 * log10(diff) + 0.15456 * log10(h);
                    if (denom !== 0 && !isNaN(denom)) {
                        calculatedBodyFat = (495 / denom) - 450;
                    }
                }
            } else if (gender === "female" && data.hips) {
                const hip = data.hips;
                const diff = (w + hip) - n;
                if (diff > 0 && h > 0) {
                    const denom = 1.29579 - 0.35004 * log10(diff) + 0.22100 * log10(h);
                    if (denom !== 0 && !isNaN(denom)) {
                        calculatedBodyFat = (495 / denom) - 450;
                    }
                }
            }
        }

        if (calculatedBodyFat !== undefined && !isNaN(calculatedBodyFat)) {
            // Clamp value between 2 and 60% for sanity
            calculatedBodyFat = Math.max(2, Math.min(60, calculatedBodyFat));
            calculatedBodyFat = parseFloat(calculatedBodyFat.toFixed(1));
        }

        const logData = {
            ...data,
            userId: userId,
            date: data.date ? new Date(data.date) : new Date(),
            createdAt: new Date(),
            bodyFat: calculatedBodyFat ?? undefined,
        };

        // Asegurar que date sea un objeto Date para Firestore
        if (typeof logData.date === 'string') {
            logData.date = new Date(logData.date);
        }

        const docRef = await adminDb.collection("body_measurements").add(logData);

        // Limpiar datos para perfil (eliminar campos que no son de medidas)
        const { date: _date, notes: _notes, ...measurementFields } = data;

        type MeasurementFields = typeof measurementFields;

        const updateData: Record<string, unknown> = {
            measurements: {
                ...userData?.measurements,
                ...measurementFields,
                weight: data.weight,
                updatedAt: new Date()
            },
            weight: data.weight
        };

        if (calculatedBodyFat) {
            updateData.bodyFat = calculatedBodyFat;
            (updateData.measurements as Record<string, unknown>).bodyFat = calculatedBodyFat;
        }

        await adminDb.collection("users").doc(userId).update(updateData);

        revalidatePath("/profile");
        revalidatePath("/analytics");
        revalidatePath(`/progress`);
        if (targetUserId) {
            revalidatePath(`/progress?athleteId=${targetUserId}`);
        }

        return { 
            success: true, 
            id: docRef.id,
            bodyFat: calculatedBodyFat,
            warning: bodyFatWarning
        };
    } catch (error) {
        console.error("Error logging measurements:", error);
        return { success: false, error: "Error al guardar medidas" };
    }
}

export async function getBodyMeasurementsHistory(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    const targetId = userId || session.user.id;

    // Verificar acceso si se consultan datos de otro usuario (debe ser coach)
    if (userId && userId !== session.user.id && session.user.role !== "coach") {
        return { success: false, error: "No autorizado para ver estos datos" };
    }

    try {
        const snapshot = await adminDb
            .collection("body_measurements")
            .where("userId", "==", targetId)
            .orderBy("date", "asc")
            .get();

        const data = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                userId: d.userId,
                date: d.date?.toDate ? d.date.toDate().toISOString() : new Date(d.date).toISOString(),
                createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : new Date().toISOString(),
                weight: d.weight,
                bodyFat: d.bodyFat,
                neck: d.neck,
                chest: d.chest,
                waist: d.waist,
                hips: d.hips,
                shoulders: d.shoulders,
                glutes: d.glutes,
                bicepsLeft: d.bicepsLeft,
                bicepsRight: d.bicepsRight,
                forearmsLeft: d.forearmsLeft,
                forearmsRight: d.forearmsRight,
                quadsLeft: d.quadsLeft,
                quadsRight: d.quadsRight,
                calvesLeft: d.calvesLeft,
                calvesRight: d.calvesRight,
                notes: d.notes
            };
        });

        return { success: true, data };
    } catch (error) {
        console.error("Error fetching measurement history:", error);
        return { success: false, error: "Error al obtener historial" };
    }
}
