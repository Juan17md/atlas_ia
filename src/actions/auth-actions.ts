"use server";

import { z } from "zod";
import { RegisterInputSchemaServer, OnboardingInputSchema } from "@/lib/schemas";
import { auth } from "@/lib/auth";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

/**
 * Registra un nuevo usuario usando Firebase Admin SDK.
 * 
 * Este flujo:
 * 1. Valida los datos de entrada
 * 2. Crea el usuario en Firebase Auth (Admin SDK)
 * 3. Crea el documento del usuario en Firestore (Admin SDK)
 */
export async function registerUser(data: z.infer<typeof RegisterInputSchemaServer>) {
    const validation = RegisterInputSchemaServer.safeParse(data);

    if (!validation.success) {
        return { success: false, error: "Datos inválidos" };
    }

    const { name, email, password, role } = validation.data;

    try {
        // 1. Crear usuario en Firebase Authentication (Admin SDK)
        const firebaseUser = await adminAuth.createUser({
            email,
            password,
            displayName: name,
        });

        // 2. Crear el documento del usuario en Firestore (Admin SDK)
        const newUserData = {
            id: firebaseUser.uid,
            name,
            email,
            role,
            createdAt: new Date(),
            updatedAt: new Date(),
            onboardingCompleted: false,
        };

        await adminDb.collection("users").doc(firebaseUser.uid).set(newUserData);

        return { success: true };

    } catch (error: unknown) {
        console.error("Error registrando usuario:", error);

        const firebaseError = error as { code?: string };

        if (firebaseError.code === "auth/email-already-exists") {
            return { success: false, error: "El email ya está registrado" };
        }
        if (firebaseError.code === "auth/weak-password" || firebaseError.code === "auth/invalid-password") {
            return { success: false, error: "La contraseña es muy débil (mínimo 6 caracteres)" };
        }
        if (firebaseError.code === "auth/invalid-email") {
            return { success: false, error: "El email no es válido" };
        }

        return { success: false, error: "Error al crear usuario. Por favor intenta de nuevo." };
    }
}



/**
 * Completa el onboarding del usuario actual.
 */
export async function completeOnboarding(data: z.infer<typeof OnboardingInputSchema>) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    const validation = OnboardingInputSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Datos inválidos" };
    }

    const { password, ...profileData } = validation.data;

    try {
        // Si el usuario proporcionó una contraseña (para usuarios de Google), la validamos y actualizamos en Auth
        if (password && password.length >= 6) {
            // Validar complejidad de contraseña
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumber = /\d/.test(password);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
            
            const complexityScore = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;
            
            // Validar: mínimo 6 caracteres Y al menos 2 de los 4 criterios de complejidad
            // O mínimo 8 caracteres sin requisitos de complejidad
            const isValidPassword = password.length >= 8 || complexityScore >= 2;
            
            if (!isValidPassword) {
                return { 
                    success: false, 
                    error: "La contraseña debe tener al menos 8 caracteres, o 6 caracteres con al menos 2 de: mayúscula, número, carácter especial" 
                };
            }

            try {
                await adminAuth.updateUser(session.user.id, {
                    password: password
                });
            } catch (authError) {
                console.error("Error actualizando contraseña:", authError);
                return { success: false, error: "Error al establecer la contraseña. Intenta otra." };
            }
        }

        // Usamos set con { merge: true } para crear el documento si no existe 
        // o actualizarlo si ya existe, evitando el error NOT_FOUND.
        // Si el usuario estableció contraseña, marcar hasPassword como true
        const updateData: Record<string, unknown> = {
            ...profileData,
            onboardingCompleted: true,
            updatedAt: new Date(),
        };

        // Si el usuario de Google estableció contraseña, ahora puede acceder con ambos métodos
        if (password && password.length >= 6) {
            updateData.hasPassword = true;
        }

        await adminDb.collection("users").doc(session.user.id).set(updateData, { merge: true });

        // UNIFICACIÓN: Registrar también las medidas iniciales en el historial `body_measurements`
        // Esto permite que el gráfico del perfil tenga un punto inicial.
        if (profileData.measurements && Object.keys(profileData.measurements).length > 0) {
            try {
                const initialLog = {
                    userId: session.user.id,
                    date: new Date(),
                    createdAt: new Date(),
                    ...profileData.measurements,
                    weight: profileData.weight, // Incluir peso en el log
                    // Nota: Height es más estático, pero weight es clave para el gráfico
                };
                await adminDb.collection("body_measurements").doc(session.user.id).set(initialLog, { merge: true });
            } catch (logError) {
                console.error("Error guardando log inicial de medidas:", logError);
                // No fallamos todo el onboarding si esto falla, es secundario
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error onboarding:", error);
        return { success: false, error: "Error al guardar datos en Firestore" };
    }
}
