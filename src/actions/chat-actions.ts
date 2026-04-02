"use server";

import { getGroqClient, getAthleteContext, DEFAULT_AI_MODEL } from "@/lib/ai";
import { auth } from "@/lib/auth";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

export async function chatWithAI(messages: { role: string, content: string }[]) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "No autorizado" };

        const role = session.user.role || "athlete";
        const groq = getGroqClient();

        // Inyectar contexto del atleta para respuestas personalizadas
        const athleteCtx = await getAthleteContext(session.user.id);

        let systemPromptContent = "";

        if (role === "coach") {
            systemPromptContent = `Eres Atlas IA Copilot, un asistente experto para entrenadores de alto rendimiento.
        Tu conocimiento abarca biomecánica avanzada, fisiología del ejercicio, periodización (lineal, ondulante, conjugada) y nutrición deportiva.
        Ayuda al entrenador a diseñar microciclos, corregir déficits en sus atletas y optimizar el volumen/intensidad.
        Usa terminología técnica precisa. Sé directo y profesional.`;
        } else {
            systemPromptContent = `Eres Atlas IA, un asistente virtual experto en fitness.
        Tu tono es motivador pero profesional.
        Responde dudas sobre técnica, calentamiento y nutrición básica.
        Mantén las respuestas concisas.
        IMPORTANTE: Considera las lesiones y condiciones del atleta en tu respuesta.

        ${athleteCtx}`;
        }

        const systemMessage: ChatCompletionMessageParam = {
            role: "system",
            content: systemPromptContent
        };

        const typedMessages: ChatCompletionMessageParam[] = [
            systemMessage,
            ...messages.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content }))
        ];

        const completion = await groq.chat.completions.create({
            messages: typedMessages,
            model: DEFAULT_AI_MODEL,
            temperature: 0.7,
            max_tokens: 600,
        });

        const reply = completion.choices[0]?.message?.content;

        if (!reply) {
            return { success: false, error: "No se recibió respuesta." };
        }

        return { success: true, message: reply };

    } catch (error) {
        console.error("Chat Error:", error);
        return { success: false, error: "Error al conectar con Atlas IA Assistant." };
    }
}

export async function analyzeWorkoutSession(workoutData: any) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "No autorizado" };

        const groq = getGroqClient();
        const athleteCtx = await getAthleteContext(session.user.id);

        // Formatear los datos del entrenamiento para el prompt
        const sessionSummary = `
SESIÓN ACTUAL (${workoutData.date}):
Rutina: ${workoutData.routineName}
RPE Global: ${workoutData.sessionRpe}/10
Notas: ${workoutData.sessionNotes || "Ninguna"}

EJERCICIOS:
${workoutData.exercises.map((ex: any, idx: number) => `
${idx + 1}. ${ex.exerciseName}
   - Comentario del ejercicio: ${ex.feedback || "Sin comentarios"}
   - Series:
     ${ex.sets.map((s: any, sIdx: number) => `Set ${sIdx + 1}: ${s.weight}kg x ${s.reps} reps (RPE ${s.rpe})`).join("\n     ")}
`).join("\n")}
        `;

        const systemPrompt = `Eres Vivi, la IA Coach experta de Atlas. 
Tu misión es analizar la sesión de entrenamiento que el atleta acaba de registrar y proporcionarle un feedback corto (máximo 150 palabras), muy motivador y técnicamente preciso.

REGLAS DE RESPUESTA:
1. Sé empática pero profesional.
2. Identifica progresos o esfuerzos notables (ej. RPE altos o pesos consistentes).
3. Si el atleta reporta molestias o notas negativas, da un consejo de recuperación.
4. Relaciona el entrenamiento con sus objetivos y lesiones del perfil (Contexto abajo).
5. Responde siempre en español.
6. Estilo directo, sin rodeos, como un coach real a pie de pista.

CONTEXTO DEL ATLETA:
${athleteCtx}
        `;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Analiza este entrenamiento que acabo de terminar:\n${sessionSummary}` }
            ],
            model: DEFAULT_AI_MODEL,
            temperature: 0.7,
            max_tokens: 500,
        });

        const reply = completion.choices[0]?.message?.content;

        if (!reply) return { success: false, error: "No se recibió análisis." };

        return { success: true, message: reply };

    } catch (error) {
        console.error("AI Analysis Error:", error);
        return { success: false, error: "Error al generar el análisis de Vivi." };
    }
}
