"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";

import type { TrainingSetData, TrainingExerciseData } from "@/types";

// --- HELPERS ---

function getStartOfWeek(date: Date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const start = new Date(date.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
}

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// --- ACTIONS ---

// Función interna cacheada para actividad semanal
// NOTA: Se eliminó unstable_cache porque la clave no puede incluir userId dinámicamente
// Esto causa que usuarios diferentes compartan datos cacheados
async function getWeeklyActivityData(targetUserId: string) {
    const startOfWeek = getStartOfWeek(new Date());

    const logsSnapshot = await adminDb.collection("training_logs")
        .where("athleteId", "==", targetUserId)
        .where("date", ">=", startOfWeek)
        .get();

    const activityMap = new Map<string, number>();
    const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    days.forEach(d => activityMap.set(d, 0));

    logsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const date = data.date?.toDate?.() || new Date();
        let dayName = DAYS_ES[date.getDay()];
        if (date.getDay() === 0) dayName = "Dom";

        let sessionVolume = 0;
        data.exercises?.forEach((ex: TrainingExerciseData) => {
            ex.sets?.forEach((s: TrainingSetData) => {
                if (s.completed && s.weight && s.reps) {
                    sessionVolume += (s.weight * s.reps);
                }
            });
        });

        const current = activityMap.get(dayName) || 0;
        activityMap.set(dayName, current + sessionVolume);
    });

    return days.map(day => ({
        name: day,
        total: Math.round(activityMap.get(day) || 0)
    }));
}

export async function getWeeklyActivity(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const targetUserId = userId || session.user.id;

    try {
        const data = await getWeeklyActivityData(targetUserId);
        return { success: true, data };
    } catch (error) {
        console.error("Error fetching activity:", error);
        return { success: false, error: "Error al cargar actividad" };
    }
}

export async function getWeeklyProgress(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };
    const targetUserId = userId || session.user.id;

    try {
        const startOfWeek = getStartOfWeek(new Date());

        // 1. Get Completed Sessions Count
        const logsSnapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", targetUserId)
            .where("date", ">=", startOfWeek)
            .get();

        const completedCount = logsSnapshot.size;

        // 2. Get Target from User Profile or Routine
        // Fallback to 3 if unknown
        const userDoc = await adminDb.collection("users").doc(targetUserId).get();
        const userData = userDoc.data();

        // Try to get from active routine first, then profile
        let weeklyTarget = userData?.availableDays || 3;

        if (userData?.activeRoutine?.schedule) {
            weeklyTarget = userData.activeRoutine.schedule.length;
        }

        return {
            success: true,
            completed: completedCount,
            target: weeklyTarget
        };

    } catch {
        return { success: false, error: "Error de progreso" };
    }
}

export async function getPersonalRecords(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };
    const targetUserId = userId || session.user.id;

    try {
        const logsSnapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", targetUserId)
            .orderBy("date", "desc")
            .limit(20)
            .get();

        const prsMap = new Map(); // Exercise -> { weight, reps, rpe, date }

        logsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const dateStr = data.date.toDate().toLocaleDateString("es-ES", { day: 'numeric', month: 'short' });

            if (data.exercises) {
                data.exercises.forEach((ex: TrainingExerciseData) => {
                    const name = ex.exerciseName;
                    ex.sets.forEach((s: TrainingSetData) => {
                        if (s.completed && s.weight && s.weight > 0) {
                            const current = prsMap.get(name);
                            if (!current || s.weight > current.weight) {
                                prsMap.set(name, {
                                    weight: s.weight,
                                    reps: s.reps || 0,
                                    rpe: s.rpe || 0,
                                    date: dateStr
                                });
                            }
                        }
                    });
                });
            }
        });

        const prs = Array.from(prsMap.entries()).map(([name, val]) => ({
            exercise: name,
            weight: val.weight,
            reps: val.reps,
            rpe: val.rpe,
            date: val.date
        })).sort((a, b) => b.weight - a.weight).slice(0, 20);

        return { success: true, prs };
    } catch (error) {
        console.error("Error fetching PRs:", error);
        return { success: false, error: "Error al cargar PRs" };
    }
}

export async function getStrengthProgress(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };
    const targetUserId = userId || session.user.id;

    try {
        // Obtenemos los últimos 20 logs para encontrar suficientes pares de comparación
        const logsSnapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", targetUserId)
            .orderBy("date", "desc")
            .limit(20)
            .get();

        if (logsSnapshot.empty || logsSnapshot.size < 2) {
            return { success: true, progress: 0 };
        }

        // Estructura: Ejercicio -> [E1RM_sesión_más_reciente, E1RM_sesión_anterior, ...]
        const exerciseHistory = new Map<string, number[]>();

        const calculateMaxE1RM = (exercise: TrainingExerciseData) => {
            let maxE1RM = 0;
            exercise.sets.forEach((s: TrainingSetData) => {
                if (s.completed && s.weight && s.reps) {
                    const rpe = s.rpe || 8;
                    // Fórmula E1RM: Weight * (1 + (Reps + (10 - RPE)) / 30)
                    const e1rm = s.weight * (1 + (s.reps + (10 - rpe)) / 30);
                    if (e1rm > maxE1RM) maxE1RM = e1rm;
                }
            });
            return maxE1RM;
        };

        // Procesar logs desde el más nuevo al más viejo
        logsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.exercises) {
                data.exercises.forEach((ex: TrainingExerciseData) => {
                    const name = ex.exerciseName;
                    const maxE1RM = calculateMaxE1RM(ex);

                    if (maxE1RM > 0) {
                        if (!exerciseHistory.has(name)) {
                            exerciseHistory.set(name, []);
                        }
                        // Solo añadimos si es una sesión distinta (un log por sesión)
                        exerciseHistory.get(name)?.push(maxE1RM);
                    }
                });
            }
        });

        let totalProgress = 0;
        let comparableExercisesCount = 0;

        // Comparar cada ejercicio consigo mismo de la sesión anterior
        exerciseHistory.forEach((history, exerciseName) => {
            if (history.length >= 2) {
                const latest = history[0];   // El más reciente (primero en el slice desc)
                const previous = history[1]; // El anterior

                if (previous > 0) {
                    const diff = ((latest - previous) / previous) * 100;
                    totalProgress += diff;
                    comparableExercisesCount++;
                }
            }
        });

        const finalProgress = comparableExercisesCount > 0
            ? parseFloat((totalProgress / comparableExercisesCount).toFixed(1))
            : 0;

        return { success: true, progress: finalProgress };

    } catch (error) {
        console.error("Error calculating strength progress:", error);
        return { success: false, error: "Error al calcular progreso" };
    }
}

export interface StrengthDataPoint {
    date: string;
    e1rm: number;
    weight: number;
    reps: number;
    rpe: number;
}

export interface ExerciseStrengthHistory {
    exerciseName: string;
    dataPoints: StrengthDataPoint[];
    latestE1RM: number;
    previousE1RM: number;
    changePercent: number;
}

export async function getStrengthHistory(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };
    const targetUserId = userId || session.user.id;

    try {
        const logsSnapshot = await adminDb.collection("training_logs")
            .where("athleteId", "==", targetUserId)
            .orderBy("date", "desc")
            .limit(50)
            .get();

        if (logsSnapshot.empty) {
            return { success: true, exercises: [] };
        }

        const exerciseMap = new Map<string, StrengthDataPoint[]>();

        const calculateMaxE1RM = (sets: TrainingSetData[]) => {
            let maxE1RM = 0;
            let bestWeight = 0;
            let bestReps = 0;
            let bestRpe = 8;

            sets.forEach((s) => {
                if (s.completed && s.weight && s.reps) {
                    const rpe = s.rpe || 8;
                    const e1rm = s.weight * (1 + (s.reps + (10 - rpe)) / 30);
                    if (e1rm > maxE1RM) {
                        maxE1RM = e1rm;
                        bestWeight = s.weight;
                        bestReps = s.reps;
                        bestRpe = rpe;
                    }
                }
            });

            return { e1rm: Math.round(maxE1RM * 10) / 10, weight: bestWeight, reps: bestReps, rpe: bestRpe };
        };

        // Procesar todos los logs (vienen desc, los invertimos al final)
        logsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const dateObj = data.date?.toDate?.() || new Date();
            const dateStr = dateObj.toLocaleDateString("es-ES", { day: "numeric", month: "short" });

            if (data.exercises) {
                data.exercises.forEach((ex: TrainingExerciseData) => {
                    const name = ex.exerciseName;
                    const result = calculateMaxE1RM(ex.sets);

                    if (result.e1rm > 0) {
                        if (!exerciseMap.has(name)) {
                            exerciseMap.set(name, []);
                        }
                        exerciseMap.get(name)!.push({
                            date: dateStr,
                            e1rm: result.e1rm,
                            weight: result.weight,
                            reps: result.reps,
                            rpe: result.rpe,
                        });
                    }
                });
            }
        });

        // Construir resultado: invertir para que sea cronológico (viejo -> nuevo)
        const exercises: ExerciseStrengthHistory[] = [];

        exerciseMap.forEach((dataPoints, exerciseName) => {
            const reversed = [...dataPoints].reverse();
            const latest = reversed[reversed.length - 1]?.e1rm || 0;
            const previous = reversed.length >= 2 ? reversed[reversed.length - 2]?.e1rm || 0 : 0;
            const changePercent = previous > 0 ? parseFloat(((latest - previous) / previous * 100).toFixed(1)) : 0;

            if (reversed.length >= 1) {
                exercises.push({
                    exerciseName,
                    dataPoints: reversed,
                    latestE1RM: latest,
                    previousE1RM: previous,
                    changePercent,
                });
            }
        });

        // Ordenar por nombre
        exercises.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));

        return { success: true, exercises };
    } catch (error) {
        console.error("Error fetching strength history:", error);
        return { success: false, error: "Error al cargar historial de fuerza" };
    }
}

import { getGroqClient, DEFAULT_AI_MODEL } from "@/lib/ai";

export async function analyzeAthleteProgress(userId: string) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") return { success: false, error: "No autorizado" };

    try {
        // 1. Obtener perfil del atleta para contexto de salud
        const userDoc = await adminDb.collection("users").doc(userId).get();
        const userData = userDoc.data();
        const healthProfile = {
            goal: userData?.goal || "No definido",
            injuries: userData?.injuries || [],
            medicalConditions: userData?.medicalConditions || []
        };

        // 2. Obtener últimos 10 entrenamientos y últimas 5 medidas
        const [logsSnapshot, measurementsSnapshot] = await Promise.all([
            adminDb.collection("training_logs")
                .where("athleteId", "==", userId)
                .orderBy("date", "desc")
                .limit(10)
                .get(),
            adminDb.collection("body_measurements")
                .where("userId", "==", userId)
                .orderBy("date", "desc")
                .limit(5)
                .get()
        ]);

        if (logsSnapshot.empty) {
            return {
                success: true,
                alerts: [],
                suggestions: ["No hay suficientes datos para analizar."]
            };
        }

        // Simplificar logs para contexto de IA
        const workoutHistory = logsSnapshot.docs.map(doc => {
            const d = doc.data();
            return {
                date: d.date.toDate().toISOString().split('T')[0],
                exercises: d.exercises.map((e: TrainingExerciseData) => ({
                    name: e.exerciseName,
                    topSet: e.sets.reduce((max: number, s: TrainingSetData) => s.completed && s.weight ? Math.max(max, s.weight) : max, 0),
                    feedback: e.feedback
                }))
            };
        });

        const measurementHistory = measurementsSnapshot.docs.map(doc => {
            const d = doc.data();
            return {
                date: d.date.toDate().toISOString().split('T')[0],
                weight: d.weight,
                bodyFat: d.bodyFat,
                measurements: {
                    chest: d.chest,
                    waist: d.waist,
                    hips: d.hips,
                    biceps: d.bicepsRight || d.bicepsLeft,
                    quads: d.quadsRight || d.quadsLeft
                }
            };
        });

        const prompt = `
            Actúa como un Entrenador Experto y Fisioterapeuta. Analiza el progreso y salud de este atleta.
            
            PERFIL DE SALUD Y OBJETIVO:
            - Objetivo: ${healthProfile.goal}
            - Lesiones/Molestias: ${healthProfile.injuries.length > 0 ? healthProfile.injuries.join(", ") : "Ninguna"}
            - Condiciones Médicas: ${healthProfile.medicalConditions.length > 0 ? healthProfile.medicalConditions.join(", ") : "Ninguna"}

            HISTORIAL DE ENTRENAMIENTO (Últimos 10):
            ${JSON.stringify(workoutHistory)}

            HISTORIAL DE MEDIDAS CORPORALES (Últimas 5):
            ${JSON.stringify(measurementHistory)}

            TAREAS:
            1. ESTANCAMIENTO: Detecta ejercicios donde el topSet no ha subido en 3 sesiones.
            2. CORRECCIÓN FÍSICA: Correlaciona si el volumen de entrenamiento coincide con los cambios en las medidas (ej: si busca hipertrofia y el peso/medidas no suben pero el volumen sí).
            3. RECOMENDACIONES: Sugiere sobrecarga progresiva, ajustes de volumen o nutrición basándote en los nexos encontrados.
            
            REGLA CRÍTICA DE SEGURIDAD: 
            Si el atleta tiene una lesión, NO sugieras aumentar peso en ejercicios que la comprometan.

            Responde ÚNICAMENTE con este JSON en ESPAÑOL:
            {
                "alerts": [
                    { "type": "stagnation" | "health_warning" | "body_composition", "message": "...", "severity": "low" | "medium" | "high" }
                ],
                "suggestions": [
                    "Sugerencia clara y accionable..."
                ]
            }
        `;

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: DEFAULT_AI_MODEL,
            temperature: 0.2,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "Error de análisis IA" };

        const result = JSON.parse(content);
        return { success: true, ...result };

    } catch (error) {
        console.error("Analysis Error:", error);
        return {
            success: true,
            alerts: [],
            suggestions: ["Error conectando con el motor de análisis."]
        };
    }
}
