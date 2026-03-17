"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { getGroqClient, getAthleteContext, DEFAULT_AI_MODEL } from "@/lib/ai";
import { RoutineDaySchema } from "@/lib/schemas";
import { z } from "zod";

type RoutineSchedule = z.infer<typeof RoutineDaySchema>[];

export async function generateWarmup(muscleGroups: string[]) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        // Inyectar contexto del atleta para personalizar el calentamiento
        const athleteCtx = await getAthleteContext(session.user.id);

        const prompt = `
            Genera una rutina de calentamiento específica y rápida (5-10 min) para preparar los siguientes grupos musculares: ${muscleGroups.join(", ")}.

            La respuesta DEBE ser un objeto JSON con esta estructura:
            {
                "warmupRoutine": [
                    { "name": "Nombre Movimiento", "duration": "30s" or "15 reps", "notes": "Tip técnico breve" }
                ]
            }
            Incluye movilidad articular, activación y aproximación.
            IMPORTANTE: Si el atleta tiene lesiones, adapta el calentamiento para proteger las zonas afectadas.
        `;

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: `Eres un preparador físico experto. ${athleteCtx}` },
                { role: "user", content: prompt }
            ],
            model: DEFAULT_AI_MODEL,
            temperature: 0.5,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            console.error("IA no generó contenido en generateWarmup");
            return { success: false, error: "La IA no generó una respuesta válida" };
        }

        let result;
        try {
            result = JSON.parse(content);
        } catch (parseError) {
            console.error("Error parseando JSON de IA en generateWarmup:", parseError);
            return { success: false, error: "Error al procesar la respuesta de la IA" };
        }

        if (!result.warmupRoutine || !Array.isArray(result.warmupRoutine)) {
            console.error("Respuesta inválida de IA en generateWarmup:", result);
            return { success: false, error: "La IA generó una respuesta con formato incorrecto" };
        }

        return { success: true, data: result.warmupRoutine };

    } catch (error) {
        console.error("Warmup Gen Error:", error);
        return { success: false, error: "Error al generar calentamiento" };
    }
}

export async function suggestSubstitute(exerciseName: string, reason: "busy" | "pain" | "equipment") {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        // Inyectar contexto del atleta para considerar lesiones al sugerir alternativas
        const athleteCtx = await getAthleteContext(session.user.id);

        const reasonText = reason === "busy" ? "la máquina está ocupada" : reason === "pain" ? "siento dolor/molestia" : "falta equipo";

        const prompt = `
            Soy un atleta en medio de mi entrenamiento. Tenía que hacer "${exerciseName}" pero no puedo porque: ${reasonText}.

            Sugiéreme 3 alternativas biomecánicamente equivalentes (mismo patrón de movimiento y músculo objetivo).
            IMPORTANTE: Si tengo lesiones, NO sugieras ejercicios que puedan agravarlas.

            Respuesta JSON estricta:
            {
                "alternatives": [
                    { "name": "Nombre Ejercicio", "why": "Breve explicación de por qué sirve" }
                ]
            }
        `;

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: `Eres un biomecánico deportivo experto. ${athleteCtx}` },
                { role: "user", content: prompt }
            ],
            model: DEFAULT_AI_MODEL,
            temperature: 0.4,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            console.error("IA no generó contenido en suggestSubstitute");
            return { success: false, error: "La IA no generó una respuesta válida" };
        }

        let result;
        try {
            result = JSON.parse(content);
        } catch (parseError) {
            console.error("Error parseando JSON de IA en suggestSubstitute:", parseError);
            return { success: false, error: "Error al procesar la respuesta de la IA" };
        }

        if (!result.alternatives || !Array.isArray(result.alternatives)) {
            console.error("Respuesta inválida de IA en suggestSubstitute:", result);
            return { success: false, error: "La IA generó una respuesta con formato incorrecto" };
        }

        return { success: true, data: result.alternatives };

    } catch (error) {
        console.error("Substitute Gen Error:", error);
        return { success: false, error: "Error al buscar alternativas" };
    }
}

export async function generateRoutinePlan(goal: string, level: string, days: string, type: "weekly" | "daily" = "weekly") {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        return { success: false, error: "No autorizado" };
    }

    try {
        const prompt = `
            Eres un entrenador personal experto. Genera un plan de rutina de ${days} días para un atleta de nivel ${level} con objetivo de ${goal}.
            TIPO DE PLANIFICACIÓN: ${type === "daily" ? "Rutina diaria única (Full Body o similar)" : "Estructura semanal de varios días"}.
            
            La respuesta DEBE ser un objeto JSON con esta estructura:
            {
                "exercises": [
                    {
                        "id": "day-1",
                        "name": "Día 1 - [Nombre descriptivo]",
                        "exercises": [
                            {
                                "exerciseId": "temp-1",
                                "exerciseName": "Nombre del Ejercicio",
                                "notes": "Notas técnicas",
                                "order": 0,
                                "sets": [
                                    { "type": "working", "reps": "8-12", "rpeTarget": 8, "restSeconds": 90 }
                                ]
                            }
                        ]
                    }
                ]
            }
            
            Incluye 4-6 ejercicios por día, variando grupos musculares según el split elegido.
            Usa nombres de ejercicios comunes en español.
        `;

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: DEFAULT_AI_MODEL,
            temperature: 0.6,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "Error de IA" };

        const result = JSON.parse(content);
        return { success: true, exercises: result.exercises };

    } catch (error) {
        console.error("Routine Plan Gen Error:", error);
        return { success: false, error: "Error al generar rutina" };
    }
}

// Alias para generateWarmup - usado por warmup-generator.tsx
export async function generateSmartWarmup(muscleGroups: string[]) {
    return generateWarmup(muscleGroups);
}

// Alias para suggestSubstitute - usado por exercise-swap-dialog.tsx
export async function suggestAlternativeExercise(exerciseName: string, reason: "busy" | "pain" | "equipment") {
    return suggestSubstitute(exerciseName, reason);
}

import { analyzeViviIntelligence, saveViviMemory } from "@/actions/vivi-intelligence-actions";

// Chat con el coach AI - usado por ai-coach-chat.tsx
export async function chatWithCoachAI(message: string, context?: { exerciseName?: string; muscleGroups?: string[] }) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        // 1. Ejecutar análisis rápido de inteligencia si es necesario (o proactivamente)
        // Esto asegura que Vivi tenga los datos más frescos de los últimos entrenos
        await analyzeViviIntelligence(session.user.id);

        // 2. Inyectar contexto enriquecido (incluye los nuevos insights y memorias)
        const athleteCtx = await getAthleteContext(session.user.id);

        const contextStr = context?.exerciseName
            ? `Contexto: El atleta está haciendo "${context.exerciseName}" (músculos: ${context.muscleGroups?.join(", ") || "no especificado"}).`
            : "";

        const prompt = `
            El atleta te hace la siguiente pregunta:
            "${message}"
            
            ${contextStr}
            
            Responde de manera concisa y útil. Eres Vivi, su coach personal.
            
            REGLAS PROACTIVAS:
            1. Si detectas fatiga en el contexto, adviértele.
            2. Si hay un PR sugerido en el contexto, motívalo.
            3. Si el atleta te da un dato importante (ej: "me duele el hombro", "voy a viajar"), IDENTIFÍCALO para guardarlo en tu memoria.

            Respuesta JSON:
            {
                "response": "Tu respuesta aquí",
                "importantInsight": "Algo importante que recordar (opcional, solo si el usuario dijo algo clave)",
                "insightCategory": "health" | "technique" | "personal"
            }
        `;

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: `Eres un coach de fitness experto y amigable llamado Vivi. ${athleteCtx}` },
                { role: "user", content: prompt }
            ],
            model: DEFAULT_AI_MODEL,
            temperature: 0.7,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "Error de IA" };

        const result = JSON.parse(content);

        // 3. Si Vivi identificó un insight importante en la conversación, guardarlo en memoria
        if (result.importantInsight) {
            await saveViviMemory(result.importantInsight, result.insightCategory || "general");
        }

        return { success: true, response: result.response };

    } catch (error) {
        console.error("Coach Chat Error:", error);
        return { success: false, error: "Error al procesar tu mensaje" };
    }
}

interface RoutineData {
    name?: string;
    description?: string;
    schedule?: Array<{
        id?: string;
        name?: string;
        exercises?: Array<{
            exerciseId?: string;
            exerciseName?: string;
            notes?: string;
            sets?: Array<{
                type?: string;
                reps?: string;
                rpeTarget?: number;
                restSeconds?: number;
            }>;
            order?: number;
        }>;
    }>;
}

export async function analyzeRoutineSafety(routineData: RoutineData, athleteId: string) {
    const session = await auth();
    // Verify coach role or self (if athlete wants to check their own routine safety? Maybe only coach feature for now)
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const groq = getGroqClient();

        // Usar helper centralizado para obtener perfil del atleta
        const athleteCtx = athleteId ? await getAthleteContext(athleteId) : "Sin perfil disponible.";

        const prompt = `
            Actúa como un fisioterapeuta deportivo experto. Analiza la siguiente rutina de entrenamiento en busca de riesgos de seguridad graves, considerando el perfil del atleta.

            ${athleteCtx}

            RUTINA A ANALIZAR:
            ${JSON.stringify(routineData, null, 2)}

            TAREA:
            Evalúa:
            1. Volumen excesivo para el nivel/lesiones.
            2. Selección de ejercicios peligrosos para las lesiones citadas.
            3. Frecuencia inadecuada.

            Responde ÚNICAMENTE en JSON:
            {
                "score": 85, // 0-100 (100 = muy seguro)
                "riskLevel": "Bajo" | "Medio" | "Alto",
                "warnings": [
                    { "title": "Riesgo en Hombro", "description": "Demasiado press militar para lesión de manguito.", "severity": "high" }
                ],
                "goodPoints": ["Buen equilibrio de empuje/tracción"],
                "recommendation": "Reducir volumen de hombro y añadir facepulls."
            }
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: DEFAULT_AI_MODEL,
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "Error de análisis" };

        return { success: true, analysis: JSON.parse(content) };

    } catch (error) {
        console.error("Safety Analysis Error:", error);
        return { success: false, error: "Error al analizar seguridad" };
    }
}

export async function generateExerciseDetails(exerciseName: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const prompt = `
            Actúa como un experto en biomecánica y cinesiología deportiva. Tu objetivo es analizar el ejercicio "${exerciseName}" y determinar con precisión qué músculos trabaja.

            INSTRUCCIONES CLAVE:
            1. Identifica los **Músculos Agonistas** (principales ejecutores).
            2. Identifica los **Músculos Sinergistas** (ayudantes importantes).
            3. Selecciona los "Grupos Musculares Principales" que engloben a AMBOS (agonistas y sinergistas importantes). Por ejemplo, en un Press de Banca, incluye "Pecho" (agonista) y "Tríceps" (sinergista), y también "Hombros" si la implicación del deltoides anterior es alta.
            4. Selecciona los músculos anatómicos específicos de la lista validada.

            LISTA DE GRUPOS VÁLIDOS:
            "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Isquiotibiales", "Glúteos", "Pantorrillas", "Abdominales", "Cardio", "Full Body"

            LISTA DE MÚSCULOS ESPECÍFICOS VÁLIDOS (Usa EXACTAMENTE estos nombres):
            - Pecho: "Pectoral Mayor", "Pectoral Menor", "Serrato Anterior"
            - Espalda: "Dorsal Ancho", "Trapecio", "Romboides", "Redondo Mayor", "Redondo Menor", "Erector de la Columna", "Lumbar"
            - Hombros: "Deltoides Anterior", "Deltoides Medio", "Deltoides Posterior", "Manguito Rotador"
            - Bíceps: "Bíceps Braquial", "Braquial", "Braquiorradial"
            - Tríceps: "Tríceps Braquial (Cabeza Larga)", "Tríceps Braquial (Cabeza Lateral)", "Tríceps Braquial (Cabeza Medial)"
            - Cuádriceps: "Recto Femoral", "Vasto Lateral", "Vasto Medial", "Vasto Intermedio"
            - Isquiotibiales: "Bíceps Femoral", "Semitendinoso", "Semimembranoso"
            - Glúteos: "Glúteo Mayor", "Glúteo Medio", "Glúteo Menor"
            - Pantorrillas: "Gastrocnemio", "Sóleo"
            - Abdominales: "Recto Abdominal", "Oblicuos", "Transverso del Abdomen"
            - Cardio: "Corazón", "Resistencia General"
            - Full Body: "Cuerpo Completo"

            Respuesta JSON estricta:
            {
                "muscleGroups": ["Pecho", "Tríceps", "Hombros"], // Incluye grupos de agonistas y sinergistas
                "specificMuscles": ["Pectoral Mayor", "Tríceps Braquial (Cabeza Lateral)", "Deltoides Anterior"] // Músculos específicos exactos
            }
        `;

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: DEFAULT_AI_MODEL,
            temperature: 0.1,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "Error de IA" };

        const result = JSON.parse(content);
        return { success: true, data: result };

    } catch (error) {
        console.error("Exercise Details Gen Error:", error);
        return { success: false, error: "Error al generar detalles del ejercicio" };
    }
}

export async function generateRoutineDescription(schedule: RoutineSchedule) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const prompt = `
            Actúa como un entrenador experto. Analiza la siguiente estructura de rutina y genera una descripción breve y motivadora (máximo 2-3 frases) que explique el enfoque principal (ej: Frecuencia 2, Torso/Pierna, énfasis en fuerza, etc.).

            RUTINA:
            ${JSON.stringify(schedule, null, 2)}

            Respuesta JSON:
            {
                "description": "Tu descripción aquí"
            }
        `;

        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: DEFAULT_AI_MODEL,
            temperature: 0.5,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "Error de IA" };

        const result = JSON.parse(content);
        return { success: true, description: result.description };

    } catch (error) {
        console.error("Description Gen Error:", error);
        return { success: false, error: "Error al generar descripción" };
    }
}

export async function getAthleteGoalForecasting(userId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const groq = getGroqClient();
        const athleteCtx = await getAthleteContext(userId);

        // Obtener historial reciente para la proyección
        const [logsSnapshot, measurementsSnapshot] = await Promise.all([
            adminDb.collection("training_logs")
                .where("athleteId", "==", userId)
                .orderBy("date", "desc")
                .limit(15)
                .get(),
            adminDb.collection("body_measurements")
                .where("userId", "==", userId)
                .orderBy("date", "desc")
                .limit(10)
                .get()
        ]);

        const history = {
            workouts: logsSnapshot.docs.map(d => ({ date: d.data().date.toDate(), exercises: d.data().exercises.length })),
            measurements: measurementsSnapshot.docs.map(d => ({ date: d.data().date.toDate(), weight: d.data().weight, bodyFat: d.data().bodyFat }))
        };

        const prompt = `
            Actúa como un analista de datos deportivo de alto rendimiento. Basado en el siguiente historial y contexto, realiza una proyección de los objetivos del atleta.

            CONTEXTO DEL ATLETA:
            ${athleteCtx}

            HISTORIAL RECIENTE:
            ${JSON.stringify(history)}

            TAREAS:
            1. Analiza el ritmo de cambio (pendiente) en el peso corporal y la fuerza/volumen.
            2. Proyecta cuánto tiempo le tomará alcanzar su objetivo principal (o el próximo hito lógico).
            3. Identifica si el ritmo actual es Sostenible, Lento o Demasiado Agresivo.

            Respuesta JSON en ESPAÑOL:
            {
                "projection": "Breve resumen de la proyección (ej: Alcanzarás los 80kg en aproximadamente 4 semanas)",
                "estimatedDate": "2024-XX-XX",
                "confidence": 0.85, // 0-1
                "analysis": "Explicación técnica del porqué de esta fecha basada en los datos.",
                "status": "sustainable" | "slow" | "aggressive"
            }
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: DEFAULT_AI_MODEL,
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) return { success: false, error: "Error de proyección" };

        return { success: true, forecasting: JSON.parse(content) };

    } catch (error) {
        console.error("Forecasting Error:", error);
        return { success: false, error: "No se pudo generar la proyección en este momento." };
    }
}
