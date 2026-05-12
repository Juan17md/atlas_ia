"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";

export interface FeedbackRegistro {
  id: string;
  userId: string;
  mensajeUsuario: string;
  respuestaVivi: string;
  puntuacion: "positivo" | "negativo";
  intencion?: string;
  categoria?: string;
  fecha: Date;
}

/**
 * Guarda la retroalimentación del usuario sobre una respuesta de Vivi.
 * Se usa para mejorar la calidad de respuestas futuras (RLHF básico).
 */
export async function guardarFeedback(params: {
  mensajeUsuario: string;
  respuestaVivi: string;
  puntuacion: "positivo" | "negativo";
  intencion?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autorizado" };

  try {
    const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const registro: FeedbackRegistro = {
      id: feedbackId,
      userId: session.user.id,
      mensajeUsuario: params.mensajeUsuario.slice(0, 500),
      respuestaVivi: params.respuestaVivi.slice(0, 1000),
      puntuacion: params.puntuacion,
      intencion: params.intencion,
      fecha: new Date(),
    };

    await adminDb.collection("vivi_feedback").doc(feedbackId).set(registro);

    return { success: true, id: feedbackId };
  } catch (error) {
    console.error("Error guardando feedback:", error);
    return { success: false, error: "No se pudo guardar el feedback" };
  }
}

/**
 * Obtiene los mejores ejemplos de respuestas para usar como few-shot
 * en prompts futuros. Solo retorna respuestas con puntuación positiva.
 */
export async function obtenerMejoresEjemplos(
  userId: string,
  intencion?: string,
  limite: number = 3
): Promise<FeedbackRegistro[]> {
  try {
    let query = adminDb
      .collection("vivi_feedback")
      .where("userId", "==", userId)
      .where("puntuacion", "==", "positivo");

    if (intencion) {
      query = query.where("intencion", "==", intencion);
    }

    const snapshot = await query.orderBy("fecha", "desc").limit(limite).get();

    return snapshot.docs.map((doc) => doc.data() as FeedbackRegistro);
  } catch (error) {
    console.error("Error obteniendo ejemplos:", error);
    return [];
  }
}

/**
 * Obtiene estadísticas de feedback del usuario.
 */
export async function obtenerEstadisticasFeedback(userId: string) {
  try {
    const [positivos, negativos] = await Promise.all([
      adminDb
        .collection("vivi_feedback")
        .where("userId", "==", userId)
        .where("puntuacion", "==", "positivo")
        .count()
        .get(),
      adminDb
        .collection("vivi_feedback")
        .where("userId", "==", userId)
        .where("puntuacion", "==", "negativo")
        .count()
        .get(),
    ]);

    return {
      totalPositivos: positivos.data().count,
      totalNegativos: negativos.data().count,
      total: positivos.data().count + negativos.data().count,
    };
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    return { totalPositivos: 0, totalNegativos: 0, total: 0 };
  }
}
