import { initializeApp, getApps, getApp } from "firebase/app";
import {
    initializeFirestore,
    persistentLocalCache,
    persistentSingleTabManager,
    getFirestore
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Configuración de Firebase con validación de variables de entorno
const requiredEnvVars = {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validar que todas las variables requeridas estén presentes
const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

if (missingVars.length > 0) {
    throw new Error(
        `Variables de entorno de Firebase faltantes: ${missingVars.join(", ")}. ` +
        `Por favor revise su archivo .env`
    );
}

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore con persistencia local para reducir lecturas de red
// Solo se activa en el cliente (browser)
let db: ReturnType<typeof getFirestore>;

if (typeof window !== "undefined" && !getApps().length) {
    // Cliente: usar persistencia local
    try {
        db = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentSingleTabManager({
                    forceOwnership: true
                })
            })
        });
    } catch {
        // Si ya está inicializado, usar la instancia existente
        db = getFirestore(app);
    }
} else {
    // Servidor o app ya inicializada: usar getFirestore normal
    db = getFirestore(app);
}

const auth = getAuth(app);

// --- Helpers para Firestore con Zod ---
import {
    CollectionReference,
    DocumentData,
    collection,
    QueryDocumentSnapshot,
    FirestoreDataConverter,
    WithFieldValue
} from "firebase/firestore";
import { z } from "zod";

const createConverter = <T extends z.ZodType>(_schema: T): FirestoreDataConverter<z.infer<T>> => ({
    toFirestore: (data: WithFieldValue<z.infer<T>>): DocumentData => {
        return data as DocumentData;
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot): z.infer<T> => {
        // Aquí podríamos validar con schema.parse(snapshot.data()) pero Firestore
        // puede devolver Timestamp que Zod espera como Date si no lo transformamos.
        // Por simplicidad en esta fase, hacemos un cast y confiamos en el input validador.
        // Para producción estricta, se debería usar un schema de "entrada" que transforme Timestamps a Date.
        const data = snapshot.data();
        // Convertir Timestamps a Date si es necesario (manejo básico)
        const convertedData = {
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
            date: data.date?.toDate ? data.date.toDate() : data.date
        };
        return convertedData as z.infer<T>;
    }
});

// Función helper para obtener colecciones tipadas
export const getCollection = <T extends z.ZodType>(collectionName: string, _schema: T) => {
    return collection(db, collectionName) as CollectionReference<z.infer<T>>;
}

export { app, db, auth, createConverter };
