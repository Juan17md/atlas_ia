import * as admin from "firebase-admin";

const getAdminApp = () => {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!key) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is missing in .env");
    }

    try {
        let cleanedKey = key.trim();
        // Eliminar comillas simples envolventes
        if (cleanedKey.startsWith("'") && cleanedKey.endsWith("'")) {
            cleanedKey = cleanedKey.slice(1, -1);
        }
        // Eliminar comillas dobles envolventes
        else if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
            cleanedKey = cleanedKey.slice(1, -1);
        }

        // Intentar parsear
        const serviceAccount = JSON.parse(cleanedKey);

        // Corregir saltos de línea en private_key (Firebase espera \n, usualmente presente como \\n en JSON)
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        console.log(">>> [Firebase Admin] ✅ Credenciales cargadas para:", serviceAccount.project_id);

        return admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        console.error(">>> [Firebase Admin] ❌ ERROR CRÍTICO al parsear credenciales de Firebase:", errorMessage);
        // No fallback a app no autenticada; lanzar error para forzar corrección.
        throw new Error("Failed to initialize Firebase Admin: " + errorMessage);
    }
};

const app = getAdminApp();
export const adminDb = admin.firestore(app);
export const adminAuth = admin.auth(app);
export { app };

/**
 * Generic converter for Firestore Admin SDK
 */
export const createAdminConverter = <T extends admin.firestore.DocumentData>() => ({
    toFirestore(data: T): admin.firestore.DocumentData {
        return data;
    },
    fromFirestore(snapshot: admin.firestore.QueryDocumentSnapshot): T {
        return snapshot.data() as T;
    },
});

/**
 * Utilidad para serializar datos de Firestore (convierte Timestamps a strings)
 */
export const serializeFirestoreData = (data: unknown): unknown => {
    if (!data) return data;

    // Manejar Firestore Timestamp (admin y cliente tienen estructuras diferentes pero ambos suelen tener toDate)
    if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        if (obj.toDate || "_seconds" in obj) {
            try {
                const date = obj.toDate ? (obj.toDate as () => Date)() : new Date((obj._seconds as number) * 1000);
                return date.toISOString();
            } catch {
                return data;
            }
        }
    }

    // Manejar Arrays
    if (Array.isArray(data)) {
        return data.map(item => serializeFirestoreData(item));
    }

    // Manejar Objetos
    if (typeof data === "object" && data !== null) {
        const serialized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
            serialized[key] = serializeFirestoreData(value);
        }
        return serialized;
    }

    return data;
};
