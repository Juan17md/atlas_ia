import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { auth as firebaseAuth } from "@/lib/firebase"; // Auth de cliente para validar contraseña
import { adminDb } from "@/lib/firebase-admin"; // Firestore de admin para datos
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { z } from "zod";
import { authConfig } from "./auth.config";

/**
 * Tipo para la respuesta de usuario de Firebase Identity Toolkit API
 */
interface FirebaseIdentityUser {
    localId: string;
    displayName?: string;
    email: string;
    photoUrl?: string;
}

/**
 * Tipo para la respuesta de Identity Toolkit API
 */
interface IdentityToolkitResponse {
    users?: FirebaseIdentityUser[];
    error?: { message: string };
}

/**
 * Tipo de rol de usuario - unificado en un solo lugar
 */
export type UserRole = "athlete" | "coach" | "advanced_athlete";

/**
 * Tipo de usuario para autenticación (compatible con NextAuth)
 */
interface AuthUser {
    id: string;
    email: string;
    name: string;
    image: string | null;
    role: UserRole;
    emailVerified?: Date | null;
    onboardingCompleted: boolean;
    authProvider: "google" | "password";
}

/**
 * Obtiene un usuario de Firestore por email (Admin SDK)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getUserByEmail(email: string): Promise<AuthUser | null> {
    try {
        const querySnapshot = await adminDb.collection("users")
            .where("email", "==", email)
            .limit(1)
            .get();

        if (querySnapshot.empty) return null;
        const doc = querySnapshot.docs[0];
        const d = doc.data();
        return {
            id: doc.id,
            name: d.name || "Usuario",
            email: d.email,
            image: d.image || null,
            role: d.role || "athlete",
            onboardingCompleted: d.onboardingCompleted ?? false,
            authProvider: d.authProvider || "password",
        } as AuthUser;
    } catch (error) {
        console.error("Error obteniendo usuario por email:", error);
        return null;
    }
}

/**
 * Obtiene un usuario de Firestore por ID (Admin SDK)
 */
async function getUserById(id: string): Promise<AuthUser | null> {
    try {
        const userDoc = await adminDb.collection("users").doc(id).get();
        if (!userDoc.exists) return null;
        const d = userDoc.data();
        if (!d) return null;

        return {
            id: userDoc.id,
            name: d.name || "Usuario",
            email: d.email,
            image: d.image || null,
            role: d.role || "athlete",
            onboardingCompleted: d.onboardingCompleted ?? false,
            authProvider: d.authProvider || "password",
        } as AuthUser;
    } catch (error) {
        console.error("Error obteniendo usuario por ID:", error);
        return null;
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    // Eliminamos el adapter de cliente para evitar errores de permisos y tipos.
    // Manejamos la persistencia manualmente en `authorize` usando el Admin SDK.
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
                idToken: { label: "Identity Token", type: "text" },
            },
            async authorize(credentials) {
                // Estrategia 1: Login con Token de Firebase (Google Auth del lado del cliente)
                if (credentials?.idToken) {
                    try {
                        const idToken = credentials.idToken as string;

                        // Verificar el token con la API REST de Google Identity Toolkit
                        const res = await fetch(
                            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
                            {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ idToken })
                            }
                        );

                        const data: IdentityToolkitResponse = await res.json();

                        if (!res.ok || !data.users || data.users.length === 0) {
                            console.error("Error validando token de Firebase:", data);
                            return null;
                        }

                        const firebaseUser = data.users[0];
                        const userId = firebaseUser.localId;
                        const userEmail = firebaseUser.email;
                        const userName = firebaseUser.displayName || "Usuario";
                        const userImage = firebaseUser.photoUrl || null;

                        // Buscar usuario en Firestore
                        const existingUser = await getUserById(userId);

                        if (existingUser) {
                            // Usuario existe: Actualizamos datos básicos para mantener sincronía
                            // PERO mantenemos el rol existente y el estado de onboarding
                            const updatedData = {
                                name: userName,
                                email: userEmail,
                                image: userImage,
                                updatedAt: new Date() // Admin SDK acepta Date
                            };

                            await adminDb.collection("users").doc(userId).set(updatedData, { merge: true });

                            return {
                                ...existingUser,
                                name: userName,
                                email: userEmail,
                                image: userImage,
                                authProvider: existingUser.authProvider || "google",
                            };
                        } else {
                            // Usuario nuevo: Lo creamos con todos los campos necesarios
                            // Usuario nuevo vía Google: marcar como proveedor Google
                            const newUser: AuthUser = {
                                id: userId,
                                name: userName,
                                email: userEmail,
                                image: userImage,
                                role: "athlete", // Por defecto
                                emailVerified: new Date(),
                                onboardingCompleted: false,
                                authProvider: "google",
                            };

                            await adminDb.collection("users").doc(userId).set({
                                ...newUser,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            });

                            return newUser;
                        }
                    } catch (error) {
                        console.error("Error en autenticación con token:", error);
                        return null;
                    }
                }

                // Estrategia 2: Login con Email/Password usando Firebase Authentication
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (!parsedCredentials.success) {
                    console.error("Credenciales inválidas");
                    return null;
                }

                const { email, password } = parsedCredentials.data;

                try {
                    // Autenticar con Firebase Client SDK (para validar contraseña)
                    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
                    const firebaseUser = userCredential.user;

                    // Buscar datos adicionales del usuario en Firestore (usando Admin SDK)
                    const userData = await getUserById(firebaseUser.uid);

                    // Cerrar sesión de Firebase Auth (NextAuth maneja la sesión)
                    // Importante: cerrar después de obtener datos para evitar race conditions
                    await firebaseAuth.signOut();

                    if (userData) {
                        return userData;
                    }

                    // Si no hay datos en Firestore, retornamos datos básicos de Firebase Auth
                    const fallbackUser: AuthUser = {
                        id: firebaseUser.uid,
                        email: firebaseUser.email || email,
                        name: firebaseUser.displayName || email,
                        image: firebaseUser.photoURL || null,
                        emailVerified: firebaseUser.emailVerified ? new Date() : null,
                        role: "athlete",
                        onboardingCompleted: false,
                        authProvider: "password",
                    };
                    return fallbackUser;

                } catch (error) {
                    const authError = error as AuthError;
                    console.error("Error en login con email/password:", authError.code, authError.message);
                    return null;
                }
            },
        }),
    ],
    session: { strategy: "jwt" }
});
