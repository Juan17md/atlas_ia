import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getGroqClient, getAthleteContext, DEFAULT_AI_MODEL } from "@/lib/ai";
import {
  clasificarIntencion,
  generarPromptPorIntencion,
} from "@/lib/intent-classifier";
import { getStrengthHistory } from "@/actions/analytics-actions";
import { getViviIntelligence } from "@/actions/vivi-intelligence-actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// En Hobby: timeout 10s. Groq genera ~150tok/s, así que 600 tokens = ~4s.
// Sumando contexto (~2s) da ~6s total. Seguro.
const MAX_TOKENS_HOBBY = 600;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("No autorizado", { status: 401 });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Messages requeridos", { status: 400 });
    }

    const userId = session.user.id;
    const ultimoMensaje = messages[messages.length - 1]?.content || "";

    // 1. Clasificar intención
    const { intencion } = clasificarIntencion(ultimoMensaje);

    // 2. Obtener contexto enriquecido según intención
    const [athleteCtx, viviIntel, strengthRes] = await Promise.all([
      getAthleteContext(userId, ultimoMensaje),
      getViviIntelligence(userId),
      intencion === "progresion" ? getStrengthHistory(userId) : Promise.resolve(null),
    ]);

    // 3. Preparar datos extra para el prompt
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

    if (intencion === "nutricion") {
      datosExtra = `READINESS: ${viviIntel?.readinessScore || 75}/100\nObjetivo: El atleta busca progresar según su plan nutricional.`;
    }

    // 4. Construir prompt del sistema
    const systemPrompt = generarPromptPorIntencion(intencion, athleteCtx, datosExtra);

    // 5. Construir historial de mensajes
    const mensajesPrevios = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...mensajesPrevios,
        { role: "user", content: ultimoMensaje },
      ],
      model: DEFAULT_AI_MODEL,
      temperature: 0.7,
      max_tokens: MAX_TOKENS_HOBBY,
      stream: true,
    });

    // 6. Devolver stream
    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          // En lugar de error() que cuelga la conexión,
          // enviamos el error como texto y cerramos limpio
          try {
            controller.enqueue(encoder.encode("\n\n[Error al generar respuesta completa]"));
            controller.close();
          } catch {
            controller.error(error);
          }
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat stream error:", error);
    return new Response("Error interno del servidor", { status: 500 });
  }
}
