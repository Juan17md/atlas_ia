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
            systemPromptContent = `Eres GymIA Copilot, un asistente experto para entrenadores de alto rendimiento.
        Tu conocimiento abarca biomecánica avanzada, fisiología del ejercicio, periodización (lineal, ondulante, conjugada) y nutrición deportiva.
        Ayuda al entrenador a diseñar microciclos, corregir déficits en sus atletas y optimizar el volumen/intensidad.
        Usa terminología técnica precisa. Sé directo y profesional.`;
        } else {
            systemPromptContent = `Eres GymIA, un asistente virtual experto en fitness.
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
        return { success: false, error: "Error al conectar con GymIA Assistant." };
    }
}
