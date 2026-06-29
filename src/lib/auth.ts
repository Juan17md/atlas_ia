import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { auth as firebaseAuth } from "@/lib/firebase";
import { adminDb } from "@/lib/firebase-admin";
import { signInWithEmailAndPassword, AuthError } from "firebase/auth";
import { z } from "zod";
import { authConfig } from "./auth.config";

export type UserRole = "advanced_athlete";

interface AuthUser {
    id: string;
    email: string;
    name: string;
    image: string | null;
    role: UserRole;
    emailVerified?: Date | null;
    onboardingCompleted: boolean;
    authProvider: "password";
}

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
            role: d.role || "advanced_athlete",
            onboardingCompleted: d.onboardingCompleted ?? false,
            authProvider: "password",
        } as AuthUser;
    } catch (error) {
        console.error("Error obteniendo usuario por email:", error);
        return null;
    }
}

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
            role: d.role || "advanced_athlete",
            onboardingCompleted: d.onboardingCompleted ?? false,
            authProvider: "password",
        } as AuthUser;
    } catch (error) {
        console.error("Error obteniendo usuario por ID:", error);
        return null;
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (!parsedCredentials.success) {
                    console.error("Credenciales inválidas");
                    return null;
                }

                const { email, password } = parsedCredentials.data;

                try {
                    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
                    const uid = userCredential.user.uid;

                    const existingUser = await getUserById(uid);

                    if (existingUser) {
                        return {
                            ...existingUser,
                            authProvider: "password" as const,
                        };
                    }

                    const newUser: AuthUser = {
                        id: uid,
                        name: userCredential.user.displayName || email.split("@")[0],
                        email: email,
                        image: userCredential.user.photoURL,
                        role: "advanced_athlete",
                        emailVerified: new Date(),
                        onboardingCompleted: false,
                        authProvider: "password",
                    };

                    await adminDb.collection("users").doc(uid).set({
                        ...newUser,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    return newUser;
                } catch (error) {
                    const authError = error as AuthError;
                    console.error("Error de autenticación:", authError.code);
                    return null;
                }
            },
        }),
    ],
});
