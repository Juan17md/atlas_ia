export interface BodyMetrics {
    name: string;
    weight: number;
    bodyFat: number | null;
    height: number;
    measurements: Record<string, number>;
    startWeight: number;
}

export interface PersonalRecord {
    exercise: string;
    weight: number;
    date: string;
    reps?: number;
    rpe?: number;
}

export interface MeasurementEntry {
    date: string;
    weight?: number;
    bodyFat?: number;
    measurements?: Record<string, number>;
}

export interface Athlete {
    id: string;
    name?: string;
    image?: string;
    email?: string;
    [key: string]: unknown;
}

export async function getLatestBodyMetrics(userId: string): Promise<BodyMetrics | null> {
    const { adminDb } = await import("@/lib/firebase-admin");
    
    try {
        const userDoc = await adminDb.collection("users").doc(userId).get();
        if (!userDoc.exists) return null;

        const userData = userDoc.data();

        const rawMeasurements = userData?.measurements || {};
        const cleanMeasurements: Record<string, number> = {};

        Object.entries(rawMeasurements).forEach(([key, value]) => {
            if (typeof value === 'number') {
                cleanMeasurements[key] = value;
            }
        });

        let bodyFat = userData?.bodyFat;

        if (!bodyFat && userData?.height && cleanMeasurements.waist && cleanMeasurements.neck) {
            const h = userData.height;
            const w = cleanMeasurements.waist;
            const n = cleanMeasurements.neck;
            const gender = userData?.gender || "male";

            if (gender === "male" || gender !== "female") {
                const diff = w - n;
                if (diff > 0) {
                    const denom = 1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(h);
                    bodyFat = (495 / denom) - 450;
                }
            } else if (gender === "female" && cleanMeasurements.hips) {
                const hip = cleanMeasurements.hips;
                const diff = (w + hip) - n;
                if (diff > 0) {
                    const denom = 1.29579 - 0.35004 * Math.log10(diff) + 0.22100 * Math.log10(h);
                    bodyFat = (495 / denom) - 450;
                }
            }

            if (bodyFat !== undefined && !isNaN(bodyFat)) {
                bodyFat = Math.max(2, Math.min(60, bodyFat));
                bodyFat = parseFloat(bodyFat.toFixed(1));
            }
        }

        return {
            name: userData?.name || "Usuario",
            weight: userData?.weight || 0,
            bodyFat: bodyFat || null,
            height: userData?.height || 0,
            measurements: cleanMeasurements,
            startWeight: userData?.startWeight || userData?.weight || 0,
        };
    } catch (e) {
        console.error("Error in getLatestBodyMetrics:", e);
        return null;
    }
}

export async function getProgressData(userId: string) {
    const { getPersonalRecords, getStrengthProgress } = await import("@/actions/analytics-actions");
    const { getBodyMeasurementsHistory } = await import("@/actions/measurement-actions");
    const { getAllAthletes } = await import("@/actions/coach-actions");

    const [prsResult, metrics, strengthResult, historyResult] = await Promise.all([
        getPersonalRecords(userId),
        getLatestBodyMetrics(userId),
        getStrengthProgress(userId),
        getBodyMeasurementsHistory(userId)
    ]);

    return {
        prs: prsResult.success ? prsResult.prs : [],
        metrics,
        strengthProgress: strengthResult.success && strengthResult.progress ? strengthResult.progress : 0,
        measurementHistory: historyResult.success && historyResult.data ? historyResult.data : [],
    };
}