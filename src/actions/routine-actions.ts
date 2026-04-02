"use server";

import { z } from "zod";
import { RoutineSchema } from "@/lib/schemas";
import { Routine } from "@/types";
import { adminDb, serializeFirestoreData } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { getGroqClient, DEFAULT_AI_MODEL } from "@/lib/ai";
import { getExercises } from "./exercise-actions";
import { revalidatePath, revalidateTag } from "next/cache";

// Schema for generating a routine with AI
const GenerateRoutineSchema = z.object({
    athleteId: z.string(),
    goal: z.string(), // "hypertrophy", "strength", etc.
    daysPerWeek: z.number().min(1).max(7),
    experienceLevel: z.string().optional(),
    injuries: z.array(z.string()).optional(),
    focus: z.string().optional(), // "upper body", "legs", etc. (optional input from coach)
    routineType: z.enum(["weekly", "daily"]).optional(),
    userPrompt: z.string().optional(),
});

type RoutineInput = z.infer<typeof RoutineSchema>;

// Get Routines (Coach sees all created by them, Athlete sees assigned ones)
export async function getRoutines() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const snapshots: FirebaseFirestore.QuerySnapshot[] = [];
        if (session.user.role === "coach") {
            const snap = await adminDb.collection("routines").where("coachId", "==", session.user.id).get();
            snapshots.push(snap);
        } else if (session.user.role === "advanced_athlete") {
            // Atleta avanzado ve: rutinas asignadas, creadas por él, y las de su coach
            const assignedSnap = await adminDb.collection("routines").where("athleteId", "==", session.user.id).where("active", "==", true).get();
            const createdSnap = await adminDb.collection("routines").where("coachId", "==", session.user.id).get();
            snapshots.push(assignedSnap, createdSnap);

            // También ver rutinas del coach asignado
            const userDoc = await adminDb.collection("users").doc(session.user.id).get();
            const myCoachId = userDoc.data()?.coachId;
            if (myCoachId) {
                const coachSnap = await adminDb.collection("routines").where("coachId", "==", myCoachId).get();
                snapshots.push(coachSnap);
            }
        } else {
            const snap = await adminDb.collection("routines").where("athleteId", "==", session.user.id).where("active", "==", true).get();
            snapshots.push(snap);
        }

        const routinesRaw = snapshots.flatMap(snap => snap.docs.map(doc => {
            return serializeFirestoreData({ id: doc.id, ...doc.data() });
        }));

        console.log(">>> [GET ROUTINES] Total routines fetched:", routinesRaw.length);
        
        // Filtrar rutinas: que no tengan deletedAt y que estén activas
        // Nota: para coaches mostramos todo lo que no esté borrado suavemente
        const routines = Array.from(new Map((routinesRaw as Routine[]).map(r => [r.id, r])).values())
            .filter(r => !r.deletedAt && r.active !== false);

        console.log(">>> [GET ROUTINES] Routines after filter:", routines.length);
        console.log(">>> [GET ROUTINES] Active IDs:", routines.map(r => r.id).join(", "));
        
        return { success: true, routines };
    } catch (error) {
        console.error("Error fetching routines:", error);
        return { success: false, error: "Error al cargar rutinas" };
    }
}

// Get Athlete's Active Routine (for Coach)
export async function getAthleteRoutine(athleteId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") return null;

    try {
        const snapshot = await adminDb.collection("routines")
            .where("athleteId", "==", athleteId)
            .where("active", "==", true)
            .limit(1)
            .get();

        if (snapshot.empty) return null;

        const doc = snapshot.docs[0];
        return serializeFirestoreData({
            id: doc.id,
            ...doc.data(),
        });
    } catch (error) {
        console.error("Error fetching athlete routine:", error);
        return null; // Return null instead of object error for simpler page handling
    }
}

// Get Coach's Routines (for assigning to athletes)
export async function getCoachRoutines() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const snapshot = await adminDb.collection("routines")
            .where("coachId", "==", session.user.id)
            .where("deletedAt", "==", null)
            .get();

        const routines = snapshot.docs.map(doc => {
            return serializeFirestoreData({ id: doc.id, ...doc.data() });
        });

        return { success: true, routines };
    } catch (error) {
        console.error("Error fetching coach routines:", error);
        return { success: false, error: "Error al cargar rutinas" };
    }
}

// Assign Routine to Athlete (creates a copy for the athlete)
export async function assignRoutineToAthlete(athleteId: string, routineId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        // 1. Verify routine ownership
        const routineRef = adminDb.collection("routines").doc(routineId);
        const routineSnap = await routineRef.get();
        if (!routineSnap.exists || routineSnap.data()?.coachId !== session.user.id) {
            return { success: false, error: "Rutina no encontrada o sin permisos" };
        }

        // 2. Check if this routine is already assigned to this athlete
        const existingAssignment = await adminDb.collection("routines")
            .where("athleteId", "==", athleteId)
            .where("originalRoutineId", "==", routineId)
            .where("active", "==", true)
            .get();

        if (!existingAssignment.empty) {
            return { success: false, error: "Esta rutina ya está asignada actualmente al atleta" };
        }

        // 3. Deactivate previous active routines for this athlete
        const batch = adminDb.batch();
        const oldRoutines = await adminDb.collection("routines")
            .where("athleteId", "==", athleteId)
            .where("active", "==", true)
            .get();

        oldRoutines.forEach(doc => {
            batch.update(doc.ref, { active: false });
        });

        // 3. Create a COPY of the routine assigned to the athlete
        const templateData = routineSnap.data() || {};
        const newRoutineRef = adminDb.collection("routines").doc();

        // Lógica de programación inteligente para rutinas semanales
        let finalSchedule = templateData.schedule || [];
        const isWeekly = templateData.type === "weekly";

        if (isWeekly) {
            const WEEK_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
            const trainingDaysCount = finalSchedule.length;

            // Determinar mapping de días (índices 0-6: Lun-Dom)
            let mapping: number[] = [];
            if (trainingDaysCount === 1) mapping = [0]; // Lun
            else if (trainingDaysCount === 2) mapping = [0, 3]; // Lun, Jue
            else if (trainingDaysCount === 3) mapping = [0, 2, 4]; // Lun, Mie, Vie
            else if (trainingDaysCount === 4) mapping = [0, 1, 3, 4]; // Lun, Mar, Jue, Vie
            else if (trainingDaysCount === 5) mapping = [0, 1, 2, 3, 4]; // Lun-Vie
            else if (trainingDaysCount === 6) mapping = [0, 1, 2, 3, 4, 5]; // Lun-Sab
            else mapping = [0, 1, 2, 3, 4, 5, 6]; // Lun-Dom

            const newSchedule = [];
            let trainingPointer = 0;

            for (let i = 0; i < 7; i++) {
                const isTrainingDay = mapping.includes(i) && trainingPointer < trainingDaysCount;
                if (isTrainingDay) {
                    newSchedule.push({
                        ...finalSchedule[trainingPointer],
                        name: WEEK_DAYS[i],
                        isRest: false
                    });
                    trainingPointer++;
                } else {
                    newSchedule.push({
                        name: WEEK_DAYS[i],
                        isRest: true,
                        exercises: []
                    });
                }
            }
            finalSchedule = newSchedule;
        }

        // Calcular el próximo lunes como fecha de inicio
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Dom) a 6 (Sab)
        const daysUntilMonday = (dayOfWeek === 0) ? 1 : (8 - dayOfWeek);
        const nextMonday = new Date(today.getTime()); // Clonar la fecha
        nextMonday.setDate(today.getDate() + daysUntilMonday);
        nextMonday.setHours(0, 0, 0, 0);

        batch.set(newRoutineRef, {
            ...templateData,
            name: templateData.name,
            coachId: session.user.id,
            athleteId: athleteId,
            active: true,
            originalRoutineId: routineId,
            schedule: finalSchedule,
            startDate: nextMonday,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error("Error assigning routine:", error);
        return { success: false, error: "Error al asignar rutina" };
    }
}

// Unassign/Deactivate Routine from Athlete
export async function unassignRoutineFromAthlete(athleteId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const snapshot = await adminDb.collection("routines")
            .where("athleteId", "==", athleteId)
            .where("active", "==", true)
            .get();

        if (snapshot.empty) {
            return { success: true };
        }

        const batch = adminDb.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
                active: false,
                deletedAt: new Date(),
                updatedAt: new Date()
            });
        });

        await batch.commit();

        revalidatePath(`/athletes/${athleteId}`);
        revalidatePath("/athletes");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("Error unassigning routine:", error);
        return { success: false, error: "Error al desasignar rutina" };
    }
}

// Get athletes assigned to a routine template
export async function getAssignedAthletes(routineId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        // 1. Encontrar todas las rutinas activas que provienen de esta plantilla
        const activeAssignments = await adminDb.collection("routines")
            .where("originalRoutineId", "==", routineId)
            .where("active", "==", true)
            .get();

        if (activeAssignments.empty) {
            return { success: true, athletes: [] };
        }

        const athleteIds = activeAssignments.docs.map(doc => doc.data().athleteId);

        // 2. Obtener los perfiles de esos atletas
        const athletesSnapshot = await adminDb.collection("users")
            .where("__name__", "in", athleteIds)
            .get();

        const athletes = athletesSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || "Atleta",
            image: doc.data().image || null,
            email: doc.data().email,
        }));

        return { success: true, athletes };
    } catch (error) {
        console.error("Error fetching assigned athletes:", error);
        return { success: false, error: "Error al obtener atletas asignados" };
    }
}

// Get Single Routine
export async function getRoutine(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const docSnap = await adminDb.collection("routines").doc(id).get();
        if (!docSnap.exists) return { success: false, error: "Rutina no encontrada" };

        const data = docSnap.data();
        const isOwner = data?.athleteId === session.user.id;
        const isCoachOfAthlete = (session.user.role as string) === "coach" && data?.coachId === session.user.id;

        if (!isOwner && !isCoachOfAthlete && (session.user.role as string) !== "coach") {
            return { success: false, error: "No autorizado" };
        }
        if ((session.user.role as string) === "coach" && data?.coachId !== session.user.id) {
            return { success: false, error: "No autorizado" };
        }

        return {
            success: true,
            routine: serializeFirestoreData({
                id: docSnap.id,
                ...data,
            })
        };
    } catch (error) {
        return { success: false, error: "Error al cargar rutina" };
    }
}

// Create Routine
export async function createRoutine(data: Partial<RoutineInput>) {
    const session = await auth();
    const role = session?.user?.role as string;
    if (!session?.user?.id || (role !== "coach" && role !== "advanced_athlete")) {
        return { success: false, error: "Solo coaches y atletas avanzados pueden crear rutinas" };
    }

    try {
        const newRoutine = {
            ...data,
            coachId: session.user.id,
            active: data.active ?? true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await adminDb.collection("routines").add(newRoutine);
        revalidatePath("/routines");
        revalidatePath("/dashboard");
        revalidateTag("routines", "default");
        revalidateTag("coach-stats", "default");
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error creating routine:", error);
        return { success: false, error: "Error al crear rutina" };
    }
}

// Update Routine
export async function updateRoutine(id: string, data: Partial<RoutineInput>) {
    const session = await auth();
    const role = session?.user?.role as string;
    if (!session?.user?.id || (role !== "coach" && role !== "advanced_athlete")) {
        return { success: false, error: "No autorizado" };
    }

    try {
        // Verificar que el usuario es propietario de la rutina
        const docSnap = await adminDb.collection("routines").doc(id).get();
        if (!docSnap.exists) {
            return { success: false, error: "Rutina no encontrada" };
        }
        
        const routineData = docSnap.data();
        const isOwner = routineData?.coachId === session.user.id;
        const isAssignedAthlete = routineData?.athleteId === session.user.id;
        
        // Coaches pueden editar sus rutinas, atletas avanzados sus propias rutinas
        if (!isOwner && (role === "coach" || role !== "advanced_athlete")) {
            return { success: false, error: "No autorizado: no eres el propietario de esta rutina" };
        }
        
        // Atletas pueden editar sus rutinas asignadas solo si son advanced_athlete
        if (!isOwner && !isAssignedAthlete) {
            return { success: false, error: "No autorizado" };
        }

        await adminDb.collection("routines").doc(id).update({
            ...data,
            updatedAt: new Date(),
        });
        revalidatePath("/routines");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Error al actualizar" }
    }
}

// Delete Routine (Soft Delete)
export async function deleteRoutine(id: string) {
    const session = await auth();
    const userId = session?.user?.id;
    const role = session?.user?.role as string;
    
    console.log(`>>> [DELETE ROUTINE] User ${userId} (${role}) attempting to delete: ${id}`);
    
    if (!userId || (role !== "coach" && role !== "advanced_athlete")) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const docRef = adminDb.collection("routines").doc(id);
        const docSnap = await docRef.get();
        if (!docSnap.exists) {
            console.log(">>> [DELETE ROUTINE] Routine not found:", id);
            return { success: false, error: "Rutina no encontrada" };
        }
        
        const routineData = docSnap.data();
        
        // Verificar que es el propietario (coachId) o el atleta asignado (si es advanced_athlete)
        const isCoachOwner = routineData?.coachId === userId;
        const isAthleteOwner = routineData?.athleteId === userId && role === "advanced_athlete";

        if (!isCoachOwner && !isAthleteOwner) {
            console.log(">>> [DELETE ROUTINE] Unauthorized access to routine:", id);
            return { success: false, error: "No tienes permisos para eliminar esta rutina" };
        }

        console.log(">>> [DELETE ROUTINE] Marking routine as deleted and inactive...");
        
        // Si es una rutina del coach (plantilla), la eliminamos físicamente para limpiar la DB
        // ya que los duplicados están causando confusión.
        if (isCoachOwner && !routineData?.athleteId) {
            console.log(">>> [DELETE ROUTINE] Hard deleting coach template:", id);
            await docRef.delete();
        } else {
            // Borrado suave para rutinas de atletas (historial)
            await docRef.update({
                deletedAt: new Date(),
                active: false,
                updatedAt: new Date(),
            });
        }
        
        console.log(">>> [DELETE ROUTINE] Successfully processed deletion for id:", id);
        
        revalidatePath("/routines");
        revalidatePath("/dashboard");
        revalidateTag("routines", "default");
        
        return { success: true };
    } catch (error: any) {
        console.error(">>> [DELETE ROUTINE] Error:", error);
        return { success: false, error: "Error al eliminar la rutina: " + (error.message || "Unknown error") };
    }
}

// Duplicate Routine
export async function duplicateRoutine(id: string) {
    const session = await auth();
    const role = session?.user?.role as string;
    if (!session?.user?.id || (role !== "coach" && role !== "advanced_athlete")) {
        return { success: false, error: "No autorizado" };
    }

    try {
        const docSnap = await adminDb.collection("routines").doc(id).get();
        if (!docSnap.exists) return { success: false, error: "Rutina no encontrada" };

        const data = docSnap.data();
        const duplicatedRoutine = {
            ...data,
            name: `Copia de ${data?.name}`,
            coachId: session.user.id,
            athleteId: null, // No asignar automáticamente a ningún atleta
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const docRef = await adminDb.collection("routines").add(duplicatedRoutine);
        revalidatePath("/routines");
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error("Error duplicating routine:", error);
        return { success: false, error: "Error al duplicar la rutina" };
    }
}

// --- AI GENERATION ---

export async function generateRoutineWithAI(data: z.infer<typeof GenerateRoutineSchema>) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        // 1. Obtener ejercicios disponibles de la biblioteca del coach
        const exercisesResult = await getExercises();
        const exercisesList = exercisesResult.exercises as Array<{
            id: string;
            name: string;
            muscleGroups: string[];
            createdAt: string;
            updatedAt: string;
        }> | undefined;

        const simplifiedExercises = exercisesList?.map(e => `${e.name} (${e.muscleGroups.join(", ")})`).join("; ");

        // 2. Prepare Prompt
        const prompt = `
            Actúa como un entrenador experto de hipertirofia y fuerza.
            Genera una rutina de entrenamiento completa en formato JSON para un atleta con el siguiente perfil:
            - Objetivo: ${data.goal}
            - Días disponibles: ${data.daysPerWeek}
            - Nivel: ${data.experienceLevel || "Intermedio"}
            - Tipo de Routine: ${data.routineType === "daily" ? "Sesión Diaria Única (Full Body o similar)" : "Planificación Semanal de varios días"}
            - Lesiones/Limitaciones: ${data.injuries?.join(", ") || "Ninguna"}
            ${data.focus ? `- Enfoque especial: ${data.focus}` : ""}
            ${data.userPrompt ? `- REQUERIMIENTOS ESPECÍFICOS DEL USUARIO: "${data.userPrompt}"` : ""}

            Usa PREFERENTEMENTE los siguientes ejercicios disponibles en mi biblioteca, pero puedes sugerir variantes comunes si faltan básicos:
            [${simplifiedExercises}]

            Tu respuesta DEBE ser un objeto JSON válido que siga esta estructura exacta (sin markdown, solo JSON):
            {
                "name": "Nombre creativo de la rutina",
                "description": "Breve explicación de la estrategia (periodización, intensidad, etc.)",
                "schedule": [
                    {
                        "name": "Día 1 - Pecho y Espalda",
                        "exercises": [
                            {
                                "exerciseName": "Press Banca",
                                "sets": [
                                    { "type": "warmup", "reps": "15", "rpeTarget": 5, "restSeconds": 60 },
                                    { "type": "working", "reps": "8-10", "rpeTarget": 8, "restSeconds": 120 }
                                ],
                                "notes": "Codos a 45 grados",
                                "order": 1
                            }
                        ]
                    }
                ]
            }
            Asegúrate de respetar las lesiones indicadas evitando ejercicios peligrosos para esas zonas.
        `;

        // 3. Call AI
        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: DEFAULT_AI_MODEL,
            temperature: 0.5,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "La IA no generó respuesta" };

        const generatedRoutine = JSON.parse(content);

        // 4. Matching fuzzy: vincular exerciseName de la IA con exerciseId de la biblioteca
        if (exercisesList && generatedRoutine.schedule) {
            const normalizeStr = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

            for (const day of generatedRoutine.schedule) {
                if (!day.exercises) continue;
                for (const ex of day.exercises) {
                    const normalizedName = normalizeStr(ex.exerciseName);

                    // Buscar match exacto primero, luego parcial
                    const exactMatch = exercisesList.find(e => normalizeStr(e.name) === normalizedName);
                    const partialMatch = !exactMatch
                        ? exercisesList.find(e =>
                            normalizeStr(e.name).includes(normalizedName) ||
                            normalizedName.includes(normalizeStr(e.name))
                        )
                        : null;

                    const match = exactMatch || partialMatch;
                    if (match) {
                        ex.exerciseId = match.id;
                    }
                }
            }
        }

        return { success: true, routine: generatedRoutine };

    } catch (error) {
        console.error("AI Generation Error:", error);
        return { success: false, error: "Error generando rutina con IA", details: error instanceof Error ? error.message : "Unknown" };
    }
}
