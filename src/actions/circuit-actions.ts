"use server";

import { auth } from "@/lib/auth";
import { adminDb, serializeFirestoreData } from "@/lib/firebase-admin";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import type { Circuit } from "@/types";

const CircuitInputSchema = z.object({
    nombre: z.string().min(1, "El nombre del circuito es obligatorio"),
    descripcion: z.string().optional(),
    tipo: z.enum(["simple", "time"]),
    rondas: z.number().min(1).max(20),
    descansoEntreRondas: z.number().min(0).max(600).default(60),
    ejercicios: z.array(z.object({
        exerciseId: z.string(),
        exerciseName: z.string(),
        duracionSegundos: z.number().optional(),
        orden: z.number(),
    })).min(1, "El circuito debe tener al menos un ejercicio"),
});

export type CircuitInput = z.infer<typeof CircuitInputSchema>;

export async function getCircuitos() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const snapshot = await adminDb.collection("circuits")
            .orderBy("createdAt", "desc")
            .get();

        const circuitos = snapshot.docs.map(doc => 
            serializeFirestoreData({ id: doc.id, ...doc.data() })
        ) as Circuit[];

        return { success: true, circuitos };
    } catch (error) {
        console.error("Error fetching circuitos:", error);
        return { success: false, error: "Error al cargar circuitos" };
    }
}

export async function getCircuito(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const doc = await adminDb.collection("circuits").doc(id).get();
        if (!doc.exists) return { success: false, error: "Circuito no encontrado" };

        const circuito = serializeFirestoreData({ id: doc.id, ...doc.data() }) as Circuit;
        return { success: true, circuito };
    } catch (error) {
        console.error("Error fetching circuito:", error);
        return { success: false, error: "Error al cargar circuito" };
    }
}

export async function createCircuito(data: CircuitInput) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    const validation = CircuitInputSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Datos inválidos: " + validation.error.message };
    }

    try {
        const docRef = await adminDb.collection("circuits").add({
            ...validation.data,
            coachId: session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        revalidatePath("/routines");
        revalidateTag("circuits", "default");

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating circuito:", error);
        return { success: false, error: "Error al crear circuito" };
    }
}

export async function updateCircuito(id: string, data: CircuitInput) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const validation = CircuitInputSchema.safeParse(data);
    if (!validation.success) {
        return { success: false, error: "Datos inválidos" };
    }

    try {
        await adminDb.collection("circuits").doc(id).update({
            ...validation.data,
            updatedAt: new Date(),
        });

        revalidatePath("/routines");
        revalidateTag("circuits", "default");

        return { success: true };
    } catch (error) {
        console.error("Error updating circuito:", error);
        return { success: false, error: "Error al actualizar circuito" };
    }
}

export async function deleteCircuito(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        await adminDb.collection("circuits").doc(id).delete();

        revalidatePath("/routines");
        revalidateTag("circuits", "default");

        return { success: true };
    } catch (error) {
        console.error("Error deleting circuito:", error);
        return { success: false, error: "Error al eliminar circuito" };
    }
}
