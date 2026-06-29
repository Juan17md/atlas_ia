"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import { BodyMeasurementLogSchema } from "@/lib/schemas";
import { calcularGrasaCorporal } from "@/lib/body-fat";

type BodyMeasurementInput = Partial<Omit<z.input<typeof BodyMeasurementLogSchema>, "date">> & { date?: Date | string };

export async function logBodyMeasurements(data: BodyMeasurementInput, targetUserId?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    const userId = targetUserId || session.user.id;

    try {
        // Obtener datos del usuario objetivo (no necesariamente el usuario actual)
        const userSnapshot = await adminDb.collection("users").doc(userId).get();
        const userData = userSnapshot.data();
        const height = userData?.height; // centímetros
        const gender = userData?.gender || "male";

        // ... resto de la lógica usando userId ...

        const { bodyFat: calculatedBodyFat, warning: bodyFatWarning } = height && data.waist && data.neck
            ? calcularGrasaCorporal({ height, waist: data.waist, neck: data.neck, hips: data.hips, gender })
            : { bodyFat: undefined, warning: undefined };

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

        // Sincronizar con el perfil del usuario (Colección users)
        await syncUserLatestMeasurements(userId);

        revalidatePath("/profile");
        revalidatePath("/progress");
        revalidatePath("/progress/history");
        revalidateTag("body-measurements", "default");

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

/**
 * Sincroniza la última medida registrada en la colección body_measurements 
 * con el campo 'measurements' del documento del usuario.
 */
async function syncUserLatestMeasurements(userId: string) {
    const latestSnapshot = await adminDb.collection("body_measurements")
        .where("userId", "==", userId)
        .orderBy("date", "desc")
        .limit(1)
        .get();

    if (latestSnapshot.empty) {
        await adminDb.collection("users").doc(userId).update({
            measurements: null,
            weight: null,
            bodyFat: null
        });
        return;
    }

    const latest = latestSnapshot.docs[0].data();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId: _, date: __, notes: ___, createdAt: ____, id: _____, ...fields } = latest;

    await adminDb.collection("users").doc(userId).update({
        measurements: {
            ...fields,
            updatedAt: new Date()
        },
        weight: latest.weight || null,
        bodyFat: latest.bodyFat || null
    });
}

export async function deleteBodyMeasurement(measurementId: string, targetUserId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const docRef = adminDb.collection("body_measurements").doc(measurementId);
        const doc = await docRef.get();

        if (!doc.exists) return { success: false, error: "Registro no encontrado" };

        await docRef.delete();
        await syncUserLatestMeasurements(targetUserId);

        revalidatePath("/profile");
        revalidatePath("/analytics");
        revalidatePath("/progress");
        revalidatePath("/progress/history");
        
        return { success: true };
    } catch (error) {
        console.error("Error deleting measurement:", error);
        return { success: false, error: "Error al eliminar registro" };
    }
}

export async function updateBodyMeasurement(measurementId: string, targetUserId: string, data: BodyMeasurementInput) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const docRef = adminDb.collection("body_measurements").doc(measurementId);
        const doc = await docRef.get();

        if (!doc.exists) return { success: false, error: "Registro no encontrado" };

        const existingData = doc.data();

        // Recalcular Body Fat para este registro específico
        const userSnapshot = await adminDb.collection("users").doc(targetUserId).get();
        const userData = userSnapshot.data();
        const height = userData?.height;
        const gender = userData?.gender || "male";

        let calculatedBodyFat: number | undefined = undefined;
        if (height && data.waist && data.neck) {
            const log10 = Math.log10;
            if (data.waist > data.neck) {
                if (gender === "male" || (gender !== "female")) {
                    const denom = 1.0324 - 0.19077 * log10(data.waist - data.neck) + 0.15456 * log10(height);
                    if (denom !== 0) calculatedBodyFat = (495 / denom) - 450;
                } else if (gender === "female" && data.hips) {
                    const denom = 1.29579 - 0.35004 * log10(data.waist + data.hips - data.neck) + 0.22100 * log10(height);
                    if (denom !== 0) calculatedBodyFat = (495 / denom) - 450;
                }
            }
        }

        if (calculatedBodyFat !== undefined && !isNaN(calculatedBodyFat)) {
            calculatedBodyFat = Math.max(2, Math.min(60, calculatedBodyFat));
            calculatedBodyFat = parseFloat(calculatedBodyFat.toFixed(1));
        }

        const updateData = {
            ...data,
            date: data.date ? new Date(data.date) : existingData?.date,
            bodyFat: calculatedBodyFat ?? existingData?.bodyFat,
            updatedAt: new Date()
        };

        await docRef.update(updateData);
        await syncUserLatestMeasurements(targetUserId);

        revalidatePath("/profile");
        revalidatePath("/analytics");
        revalidatePath("/progress");
        revalidatePath("/progress/history");

        return { success: true };
    } catch (error) {
        console.error("Error updating measurement:", error);
        return { success: false, error: "Error al actualizar registro" };
    }
}

const getCachedBodyMeasurementsHistory = unstable_cache(
    async (userId: string) => {
        const snapshot = await adminDb
            .collection("body_measurements")
            .where("userId", "==", userId)
            .orderBy("date", "asc")
            .get();

        return snapshot.docs.map(doc => {
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
                abdomen: typeof d.abdomen === 'number' ? d.abdomen : (d.abdomen ? parseFloat(d.abdomen) : undefined),
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
    },
    ["body-measurements"],
    { revalidate: 300, tags: ["body-measurements"] }
);

export async function getBodyMeasurementsHistory(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    const targetId = userId || session.user.id;

    try {
        const data = await getCachedBodyMeasurementsHistory(targetId);
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching measurement history:", error);
        return { success: false, error: "Error al obtener historial" };
    }
}
