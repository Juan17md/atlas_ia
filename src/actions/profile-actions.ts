"use server";

import { adminDb, createAdminConverter } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateProfileSchema = z.object({
    name: z.string().min(2, "El nombre es muy corto").optional(),
    image: z.string().url("URL de imagen inválida").optional().or(z.literal("")),
    goal: z.string().optional(),
    level: z.string().optional(),
    phone: z.string().optional(),
    height: z.coerce.number().optional(),
    weight: z.coerce.number().optional(),
    injuries: z.array(z.string()).optional(),
    medicalConditions: z.array(z.string()).optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export async function updateProfile(data: UpdateProfileInput, targetUserId?: string) {
    const session = await auth();
    const currentUserId = session?.user?.id;

    if (!currentUserId) {
        return { success: false, error: "No autorizado: Sesión no encontrada" };
    }

    // Validar datos con Zod
    const validation = UpdateProfileSchema.safeParse(data);
    if (!validation.success) {
        const errorMsg = validation.error.issues.map(issue => issue.message).join(", ");
        return { success: false, error: `Validación fallida: ${errorMsg}` };
    }

    const userId = targetUserId || currentUserId;

    // REGLA .cursorrules: Seguridad de Coach
    if (targetUserId && targetUserId !== currentUserId) {
        if (session.user.role !== "coach") {
            return { success: false, error: "Permiso denegado: Solo coaches pueden editar perfiles de atletas" };
        }
    }

    try {
        const userRef = adminDb.collection("users").doc(userId).withConverter(createAdminConverter<UpdateProfileInput>());

        // REGLA .cursorrules: Usar .set(..., { merge: true })
        await userRef.set({
            ...validation.data,
            // @ts-expect-error - Usamos el campo de Firebase Admin para asegurar precisión de tiempo
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        // Revalidación selectiva y profunda
        revalidatePath("/profile");
        revalidatePath(`/athletes/${userId}`);

        // Si el usuario es un atleta vinculado, refrescar también su dashboard
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error: unknown) {
        console.error(">>> [updateProfile] Error CRÍTICO en Firestore:", error);
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        return {
            success: false,
            error: `Error de servidor: ${errorMessage || "No se pudo actualizar la base de datos"}`
        };
    }
}
