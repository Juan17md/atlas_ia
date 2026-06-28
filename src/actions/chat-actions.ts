"use server";

import { getGroqClient, getAthleteContext, DEFAULT_AI_MODEL, sanitizeForAI } from "@/lib/ai";
import { auth } from "@/lib/auth";
import {
  clasificarIntencion,
  generarPromptPorIntencion,
} from "@/lib/intent-classifier";
import { getStrengthHistory } from "@/actions/analytics-actions";
import { getViviIntelligence } from "@/actions/vivi-intelligence-actions";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";
import { rateLimit } from "@/lib/rate-limiter";

export async function chatWithAI(messages: { role: string; content: string }[]) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "No autorizado" };

        const rl = rateLimit(`chat-ai:${session.user.id}`, 15, 60_000);
        if (!rl.allowed) return { success: false, error: `Demasiadas solicitudes. Espera ${rl.retryAfter}s` };

        const role = session.user.role || "athlete";
        const ultimoMensaje = messages[messages.length - 1]?.content || "";

        const { intencion } = clasificarIntencion(ultimoMensaje);

        const [athleteCtx, viviIntel, strengthRes] = await Promise.all([
            getAthleteContext(session.user.id, ultimoMensaje),
            getViviIntelligence(session.user.id),
            intencion === "progresion"
                ? getStrengthHistory(session.user.id)
                : Promise.resolve(null),
        ]);

        let datosExtra = "";
        if (intencion === "progresion" && strengthRes?.success && strengthRes.exercises) {
            const ejerciciosStr = strengthRes.exercises
                .slice(0, 5)
                .map(
                    (ex) =>
                        `- ${ex.exerciseName}: E1RM actual ${ex.latestE1RM}kg (cambio: ${ex.changePercent >= 0 ? "+" : ""}${ex.changePercent}%)`
                )
                .join("\n");
            datosExtra = `HISTORIAL DE FUERZA (E1RM):\n${ejerciciosStr}\n\nREADINESS: ${viviIntel?.readinessScore || 75}/100`;
        }

        const systemPrompt = role === "coach"
            ? `Eres Atlas IA Copilot, un asistente experto para entrenadores de alto rendimiento.
Tu conocimiento abarca biomecánica avanzada, fisiología del ejercicio, periodización y nutrición deportiva.
Ayuda al entrenador con terminología técnica precisa. Sé directo y profesional.`
            : generarPromptPorIntencion(intencion, athleteCtx, datosExtra);

        const groq = getGroqClient();

        const systemMessage: ChatCompletionMessageParam = {
            role: "system",
            content: systemPrompt
        };

        const typedMessages: ChatCompletionMessageParam[] = [
            systemMessage,
            ...messages.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.role === "user" ? sanitizeForAI(m.content) : m.content }))
        ];

        const completion = await groq.chat.completions.create({
            messages: typedMessages,
            model: DEFAULT_AI_MODEL,
            temperature: 0.7,
            max_tokens: 1024,
        });

        const reply = completion.choices[0]?.message?.content;

        if (!reply) {
            return { success: false, error: "No se recibió respuesta." };
        }

        return { success: true, message: reply, intencion };

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
Notas: ${sanitizeForAI(workoutData.sessionNotes) || "Ninguna"}

EJERCICIOS:
${workoutData.exercises.map((ex: any, idx: number) => `
${idx + 1}. ${ex.exerciseName}
   - Comentario del ejercicio: ${sanitizeForAI(ex.feedback) || "Sin comentarios"}
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
