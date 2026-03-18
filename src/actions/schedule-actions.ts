"use server";

import { adminDb, serializeFirestoreData } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { inicioDelDia, finDelDia, fechaAString } from "@/lib/fecha-utils";

interface RoutineDay {
    id?: string;
    name?: string;
    exercises?: unknown[];
}

interface AssignmentInput {
    athleteId: string;
    routineId: string; // The Template Routine ID
    dayId: string; // The ID of the day within the routine
    date: string; // YYYY-MM-DD
}

interface BatchAssignmentInput {
    athleteId: string;
    routineId: string;
    startDate: string; // YYYY-MM-DD
    days: {
        dayId: string;
        date: string; // YYYY-MM-DD
    }[];
}

async function getRoutineCopyId(athleteId: string, originalRoutineId: string, coachId: string) {
    // Check if there is an active copy for this athlete derived from originalRoutineId
    const snapshot = await adminDb.collection("routines")
        .where("athleteId", "==", athleteId)
        .where("originalRoutineId", "==", originalRoutineId)
        .where("active", "==", true)
        .limit(1)
        .get();

    if (!snapshot.empty) {
        return snapshot.docs[0].id;
    }

    // Capture the original routine to copy
    const originalSnap = await adminDb.collection("routines").doc(originalRoutineId).get();
    if (!originalSnap.exists) {
        throw new Error("Rutina original no encontrada");
    }
    const templateData = originalSnap.data();

    // Create new copy
    const newRoutineRef = adminDb.collection("routines").doc();
    await newRoutineRef.set({
        ...templateData,
        name: templateData?.name,
        coachId,
        athleteId,
        active: true,
        originalRoutineId,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    return newRoutineRef.id;
}

export async function checkAssignmentConflict(athleteId: string, date: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const snapshot = await adminDb.collection("users").doc(athleteId)
        .collection("assignments")
        .where("date", "==", date)
        .limit(1)
        .get();

    if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        return {
            conflict: true,
            existingAssignment: {
                id: snapshot.docs[0].id,
                ...data
            }
        };
    }

    return { conflict: false };
}

export async function checkWeekConflicts(athleteId: string, dates: string[]) {
    // Helper to check multiple dates
    // Firestore 'in' query supports up to 10 items, but dates might be more suitable for individual checks or range if needed.
    // For a week (7 days), Promise.all is fine.

    const conflicts = [];

    for (const date of dates) {
        const res = await checkAssignmentConflict(athleteId, date);
        if (res.conflict) {
            conflicts.push({ date, ...res.existingAssignment });
        }
    }

    return {
        hasConflicts: conflicts.length > 0,
        conflicts
    };
}

export async function assignRoutineDay(data: AssignmentInput, confirmReplace: boolean = false) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        // 1. Check Conflicts
        const conflictCheck = await checkAssignmentConflict(data.athleteId, data.date);

        if (conflictCheck.conflict && !confirmReplace) {
            return {
                success: false,
                requiresConfirmation: true,
                message: "Ya existe una rutina asignada para este día."
            };
        }

        // 2. Get or Create Routine Copy
        const routineCopyId = await getRoutineCopyId(data.athleteId, data.routineId, session.user.id);

        // 3. Create/Overwrite Assignment
        // Use date as doc ID to ensure uniqueness per day? 
        // Or generic ID? Using generic ID allows multiple workouts per day technically, 
        // but prompt implies checking constraints. Let's assume 1 per day for now for simplicity, 
        // or just use add() and let conflict check handle it.
        // If we want to replace, we should delete existing ones.

        const assignmentsRef = adminDb.collection("users").doc(data.athleteId).collection("assignments");

        if (conflictCheck.conflict && confirmReplace) {
            // Delete existing
            await assignmentsRef.doc(conflictCheck.existingAssignment!.id).delete();
        }

        // Fetch routine details for denormalization (optional, but good for calendar display)
        const routineSnap = await adminDb.collection("routines").doc(routineCopyId).get();
        const routineDoc = routineSnap.data();
        const routineData = routineDoc as { name?: string; schedule?: RoutineDay[] } | undefined;
        const dayName = routineData?.schedule?.find((d) => d.id === data.dayId)?.name || "Día de Rutina";

        await assignmentsRef.add({
            routineId: routineCopyId,
            originalRoutineId: data.routineId,
            dayId: data.dayId,
            date: data.date,
            routineName: routineData?.name,
            dayName: dayName,
            assignedBy: session.user.id,
            createdAt: new Date(),
        });

        revalidatePath(`/athletes/${data.athleteId}`);
        return { success: true };

    } catch (error) {
        console.error("Error assigning routine:", error);
        return { success: false, error: "Error al asignar rutina" };
    }
}

export async function assignRoutineWeek(data: BatchAssignmentInput, confirmReplace: boolean = false) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const dates = data.days.map(d => d.date);
        const conflictCheck = await checkWeekConflicts(data.athleteId, dates);

        if (conflictCheck.hasConflicts && !confirmReplace) {
            return {
                success: false,
                requiresConfirmation: true,
                message: `Existen rutinas asignadas en ${conflictCheck.conflicts.length} de los días seleccionados.`,
                conflicts: conflictCheck.conflicts
            };
        }

        const routineCopyId = await getRoutineCopyId(data.athleteId, data.routineId, session.user.id);
        const assignmentsRef = adminDb.collection("users").doc(data.athleteId).collection("assignments");
        const routineSnap = await adminDb.collection("routines").doc(routineCopyId).get();
        const routineData = routineSnap.data() as { name?: string; schedule?: RoutineDay[] } | undefined;

        const BATCH_LIMIT = 500; // Límite de Firestore

        // If replacing, delete conflicts first
        if (conflictCheck.hasConflicts && confirmReplace) {
            const deleteBatch = adminDb.batch();
            for (const conflict of conflictCheck.conflicts) {
                deleteBatch.delete(assignmentsRef.doc(conflict.id!));
            }
            await deleteBatch.commit();
        }

        // Add new assignments - dividir en batches si es necesario
        const days = data.days;
        const deleteCount = conflictCheck.hasConflicts && confirmReplace ? conflictCheck.conflicts.length : 0;
        
        // Calcular máximo de asignaciones que podemos hacer
        const maxAssignments = Math.min(days.length, BATCH_LIMIT - deleteCount);
        const daysToAssign = days.slice(0, maxAssignments);

        if (daysToAssign.length > 0) {
            const writeBatch = adminDb.batch();
            for (const day of daysToAssign) {
                const dayName = routineData?.schedule?.find((d) => d.id === day.dayId)?.name || "Día de Rutina";
                const docRef = assignmentsRef.doc();
                writeBatch.set(docRef, {
                    routineId: routineCopyId,
                    originalRoutineId: data.routineId,
                    dayId: day.dayId,
                    date: day.date,
                    routineName: routineData?.name,
                    dayName: dayName,
                    assignedBy: session.user.id,
                    createdAt: new Date(),
                });
            }
            await writeBatch.commit();
        }

        if (days.length > maxAssignments) {
            console.warn(`Se asignaron solo ${maxAssignments} de ${days.length} días debido al límite de batch`);
        }
        revalidatePath(`/athletes/${data.athleteId}`);
        return { success: true };

    } catch (error) {
        console.error("Error batch assigning:", error);
        return { success: false, error: "Error en asignación masiva" };
    }
}

export async function getAthleteAssignments(athleteId: string, start: string, end: string) {
    // Very basic query not strictly filtering by range if string comparison fails on edge cases, 
    // but ISO strings YYYY-MM-DD work well for lexicographical comparison.
    try {
        const snapshot = await adminDb.collection("users").doc(athleteId).collection("assignments")
            .where("date", ">=", start)
            .where("date", "<=", end)
            .get();

        const assignments = snapshot.docs.map(doc => {
            return serializeFirestoreData({ id: doc.id, ...doc.data() });
        });

        return { success: true, assignments };
    } catch (error) {
        console.error("Error fetching assignments:", error);
        return { success: false, error: "Error al cargar calendario" };
    }
}

export async function getTodayAssignment(athleteId: string, date: string) {
    try {
        const snapshot = await adminDb.collection("users").doc(athleteId)
            .collection("assignments")
            .where("date", "==", date)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return { success: true, assignment: null };
        }

        const doc = snapshot.docs[0];
        const assignment = serializeFirestoreData({
            id: doc.id,
            ...doc.data()
        });

        return { success: true, assignment };
    } catch (error) {
        console.error("Error checking today assignment:", error);
        return { success: false, error: "Error verificando sesión de hoy" };
    }
}

export async function getRecordedWorkoutDays(athleteId: string, start: string, end: string) {
    try {
        // start y end son YYYY-MM-DD — usar UTC consistente para queries
        const startDate = inicioDelDia(start);
        const endDate = finDelDia(end);

        const snapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", athleteId)
            .where("date", ">=", startDate)
            .where("date", "<=", endDate)
            .get();

        const dates = snapshot.docs
            .map(doc => {
                const data = doc.data();
                // Ignorar explícitamente los que están 'in_progress'
                if (data.status === 'in_progress') return null;

                const logDate = data.date.toDate();
                // Usar zona horaria del usuario para convertir a string
                return fechaAString(logDate);
            })
            .filter((d): d is string => d !== null);

        // Unique dates
        const uniqueDates = Array.from(new Set(dates));

        return { success: true, recordedDates: uniqueDates };
    } catch (error) {
        console.error("Error fetching recorded days:", error);
        return { success: false, error: "Error al cargar días registrados" };
    }
}
