"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function linkWithCoach(coachCode: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "No autorizado" };
    }

    if (!coachCode || coachCode.length < 5) {
        return { success: false, error: "Código inválido" };
    }

    try {
        // Buscar al coach por su ID (usaremos el ID como código por simplicidad inicial)
        // Opcionalmente podríamos tener un campo "inviteCode" en el documento del coach.
        const coachDoc = await adminDb.collection("users").doc(coachCode).get();

        if (!coachDoc.exists) {
            return { success: false, error: "Coach no encontrado con ese código" };
        }

        const coachData = coachDoc.data();
        if (coachData?.role !== "coach") {
            return { success: false, error: "El usuario no es un coach" };
        }

        // Actualizar al atleta
        await adminDb.collection("users").doc(session.user.id).update({
            coachId: coachCode,
            coachName: coachData?.name || "Coach",
            linkedAt: new Date()
        });

        // Opcional: Añadir el atleta a la lista del coach (si desnormalizamos)
        // Pero es mejor query on-demand: users where coachId == myId

        revalidatePath("/profile");
        return { success: true, coachName: coachData?.name };

    } catch (error) {
        console.error("Error linking coach:", error);
        return { success: false, error: "Error al vincular coach" };
    }
}

export async function unlinkCoach() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        await adminDb.collection("users").doc(session.user.id).update({
            coachId: null, // o admin.firestore.FieldValue.delete()
            coachName: null,
            linkedAt: null
        });

        revalidatePath("/profile");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error al desvincular" };
    }
}

export async function getCoachAthletes() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const snapshot = await adminDb.collection("users")
            .where("coachId", "==", session.user.id)
            .get();

        const athletes = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || "Usuario",
            email: doc.data().email || "",
            image: doc.data().image || null
        }));

        return { success: true, athletes };
    } catch (error) {
        console.error("Error fetching athletes:", error);
        return { success: false, error: "Error al cargar atletas" };
    }
}
export async function getAllUsers() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const snapshot = await adminDb.collection("users")
            .orderBy("name", "asc")
            .get();

        const users = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || "Usuario",
            email: doc.data().email || "",
            role: doc.data().role || "athlete",
            image: doc.data().image || null,
        }));

        return { success: true, users };
    } catch (error) {
        console.error("Error fetching all users:", error);
        return { success: false, error: "Error al cargar usuarios" };
    }
}

export async function updateUserRole(userId: string, newRole: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    // Validar el rol
    const validRoles = ["athlete", "coach", "advanced_athlete"];
    if (!validRoles.includes(newRole)) {
        return { success: false, error: "Rol inválido" };
    }

    // Impedir que un usuario se cambie el rol a sí mismo
    if (userId === session.user.id) {
        return { success: false, error: "No puedes cambiar tu propio rol" };
    }

    try {
        await adminDb.collection("users").doc(userId).update({
            role: newRole,
            updatedAt: new Date()
        });

        revalidatePath("/users");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error updating user role:", error);
        return { success: false, error: "Error al actualizar el rol" };
    }
}

export async function deleteUser(userId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    if (userId === session.user.id) {
        return { success: false, error: "No puedes eliminarte a ti mismo" };
    }

    try {
        const { adminAuth } = await import("@/lib/firebase-admin");
        const batch = adminDb.batch();

        // 1. Eliminar rutinas del atleta
        const routinesSnap = await adminDb.collection("routines")
            .where("athleteId", "==", userId)
            .get();
        routinesSnap.docs.forEach(doc => batch.delete(doc.ref));

        // 2. Eliminar training_logs del atleta
        const logsSnap = await adminDb.collection("training_logs")
            .where("athleteId", "==", userId)
            .get();
        logsSnap.docs.forEach(doc => batch.delete(doc.ref));

        // 3. Eliminar workout_sets del atleta
        const setsSnap = await adminDb.collection("workout_sets")
            .where("athleteId", "==", userId)
            .get();
        setsSnap.docs.forEach(doc => batch.delete(doc.ref));

        // 4. Eliminar body_measurements del atleta
        const measurementsSnap = await adminDb.collection("body_measurements")
            .where("userId", "==", userId)
            .get();
        measurementsSnap.docs.forEach(doc => batch.delete(doc.ref));

        // 5. Eliminar notificaciones del atleta
        const notifSnap1 = await adminDb.collection("notifications")
            .where("userId", "==", userId)
            .get();
        notifSnap1.docs.forEach(doc => batch.delete(doc.ref));
        const notifSnap2 = await adminDb.collection("notifications")
            .where("athleteId", "==", userId)
            .get();
        notifSnap2.docs.forEach(doc => batch.delete(doc.ref));

        // 6. Eliminar vivi_intelligence del atleta
        batch.delete(adminDb.collection("vivi_intelligence").doc(userId));

        // 7. Eliminar documento del usuario en Firestore
        batch.delete(adminDb.collection("users").doc(userId));

        await batch.commit();

        // 8. Eliminar usuario de Firebase Auth (Admin SDK)
        try {
            await adminAuth.deleteUser(userId);
        } catch (authError: any) {
            if (authError.code !== "auth/user-not-found") {
                console.error("Error eliminando usuario de Firebase Auth:", authError);
            }
        }

        // 9. Si el usuario eliminado era coach, desvincular sus atletas
        const linkedAthletes = await adminDb.collection("users")
            .where("coachId", "==", userId)
            .get();
        if (!linkedAthletes.empty) {
            const unlinkBatch = adminDb.batch();
            linkedAthletes.docs.forEach(doc => {
                unlinkBatch.update(doc.ref, {
                    coachId: null,
                    coachName: null,
                    linkedAt: null
                });
            });
            await unlinkBatch.commit();
        }

        revalidatePath("/users");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, error: "Error al eliminar el usuario" };
    }
}
