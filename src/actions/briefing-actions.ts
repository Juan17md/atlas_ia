"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { getGroqClient, getAthleteContext, DEFAULT_AI_MODEL } from "@/lib/ai";
import { getViviIntelligence, analyzeViviIntelligence } from "@/actions/vivi-intelligence-actions";
import { getStrengthHistory } from "@/actions/analytics-actions";
import type { ExerciseStrengthHistory } from "@/actions/analytics-actions";

export interface MorningBriefing {
  fecha: string;
  readinessScore: number;
  entrenamientoHoy: {
    nombre: string;
    ejercicios: string[];
    enfoque: string;
  } | null;
  prAlAlcance: {
    ejercicio: string;
    pesoActual: number;
    pesoSugerido: number;
    mensaje: string;
  }[];
  consejoDelDia: string;
  alertas: {
    tipo: "fatiga" | "estancamiento" | "abandono" | "sobreentrenamiento" | "nutricion";
    mensaje: string;
    severidad: "low" | "medium" | "high";
  }[];
  fraseMotivacional: string;
}

const FRASES_MOTIVACIONALES = [
  "La disciplina hace lo que la motivación solo promete.",
  "Cada repetición es un voto hacia la persona que quieres ser.",
  "El dolor de la disciplina pesa gramos. El arrepentimiento pesa toneladas.",
  "No pares cuando estés cansado. Para cuando hayas terminado.",
  "Tu único límite eres tú mismo. Y eso se entrena.",
  "El hierro no miente. Tú tampoco.",
  "Hoy es el día que tu yo del futuro te agradecerá.",
  "Roma no se construyó en un día, pero se entrenaba todos los días.",
  "La fuerza no viene de lo que puedes hacer. Viene de superar lo que no podías.",
  "Entrena como si nadie te estuviera mirando. Compite como si todos lo hicieran.",
];

function obtenerFraseAleatoria(): string {
  return FRASES_MOTIVACIONALES[Math.floor(Math.random() * FRASES_MOTIVACIONALES.length)];
}

/**
 * Genera el briefing matutino personalizado del atleta.
 * Combina: rutina del día, PRs al alcance, readiness score,
 * alertas de salud y consejo IA del día.
 */
export async function generarMorningBriefing(): Promise<{
  success: boolean;
  briefing?: MorningBriefing;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autorizado" };

  try {
    const userId = session.user.id;

    const [viviIntelRaw, strengthRes, rutinasSnap, logsSnap] = await Promise.all([
      getViviIntelligence(userId),
      getStrengthHistory(userId),
      adminDb
        .collection("routines")
        .where("athleteId", "==", userId)
        .where("active", "==", true)
        .limit(1)
        .get(),
      adminDb
        .collection("training_logs")
        .where("athleteId", "==", userId)
        .orderBy("date", "desc")
        .limit(10)
        .get(),
    ]);

    // Si la inteligencia de Vivi está desactualizada (>12h) o no existe,
    // regenerarla bajo demanda. En Hobby no hay crons, así que lo hacemos aquí.
    let viviIntel = viviIntelRaw;
    if (!viviIntel?.lastAnalyzed || Date.now() - new Date(viviIntel.lastAnalyzed).getTime() > 12 * 60 * 60 * 1000) {
      const res = await analyzeViviIntelligence(userId);
      if (res.success) {
        viviIntel = await getViviIntelligence(userId);
      }
    }

    const readinessScore = viviIntel?.readinessScore || 75;

    // Determinar entrenamiento de hoy
    let entrenamientoHoy: MorningBriefing["entrenamientoHoy"] = null;

    if (!rutinasSnap.empty) {
      const rutina = rutinasSnap.docs[0].data();
      const schedule = rutina.schedule || [];
      const hoy = new Date().getDay();
      const diasSemana = [
        "domingo",
        "lunes",
        "martes",
        "miércoles",
        "jueves",
        "viernes",
        "sábado",
      ];
      const diaHoy = diasSemana[hoy];

      const diaRutina = schedule.find(
        (d: { day?: string; name?: string }) =>
          d.day?.toLowerCase() === diaHoy || d.name?.toLowerCase().includes(diaHoy)
      );

      if (diaRutina) {
        entrenamientoHoy = {
          nombre: diaRutina.name || "Entrenamiento del día",
          ejercicios:
            diaRutina.exercises?.map((e: { exerciseName: string }) => e.exerciseName) ||
            [],
          enfoque: diaRutina.focus || diaRutina.notes || "",
        };
      }
    }

    // PRs al alcance
    const prAlAlcance: MorningBriefing["prAlAlcance"] = [];
    if (strengthRes.success && strengthRes.exercises) {
      for (const ex of strengthRes.exercises.slice(0, 5)) {
        const latest = ex.latestE1RM || 0;
        if (latest > 0 && ex.changePercent >= -5 && ex.changePercent <= 10) {
          const pesoSugerido = Math.round((latest * 1.03) / 2.5) * 2.5;
          if (pesoSugerido > latest) {
            prAlAlcance.push({
              ejercicio: ex.exerciseName,
              pesoActual: Math.round(latest),
              pesoSugerido,
              mensaje:
                ex.changePercent <= 0
                  ? "Estás cerca de romper tu récord. ¡Inténtalo hoy!"
                  : "Vienes progresando. Este peso está a tu alcance.",
            });
          }
        }
      }
    }

    // Alertas
    const alertas: MorningBriefing["alertas"] = [];

    const logs = logsSnap.docs.map((d) => d.data());
    const logsCompletados = logs.filter((l) => l.status === "completed");

    if (logsCompletados.length > 0) {
      const fechas = logsCompletados
        .map((l) => l.date?.toDate?.() || new Date(l.date))
        .sort((a, b) => b.getTime() - a.getTime());

      const ultimaFecha = fechas[0];
      const diasDesdeUltimoEntreno = Math.floor(
        (Date.now() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diasDesdeUltimoEntreno >= 3) {
        alertas.push({
          tipo: "abandono",
          mensaje: `Han pasado ${diasDesdeUltimoEntreno} días desde tu último entrenamiento. ¡Retoma hoy!`,
          severidad: diasDesdeUltimoEntreno >= 5 ? "high" : "medium",
        });
      }
    }

    if (readinessScore < 40) {
      alertas.push({
        tipo: "sobreentrenamiento",
        mensaje:
          "Tu puntuación de preparación es baja. Considera un día de recuperación activa.",
        severidad: "high",
      });
    } else if (readinessScore < 55) {
      alertas.push({
        tipo: "fatiga",
        mensaje:
          "Muestras signos de fatiga acumulada. Entrena con intensidad moderada hoy.",
        severidad: "medium",
      });
    }

    if (viviIntel?.insights) {
      for (const insight of viviIntel.insights) {
        if (insight.type === "fatigue" && insight.severity === "high") {
          alertas.push({
            tipo: "fatiga",
            mensaje: insight.actionable || insight.content,
            severidad: "high",
          });
        }
        if (insight.type === "nutrition") {
          alertas.push({
            tipo: "nutricion",
            mensaje: insight.actionable || insight.content,
            severidad: "low",
          });
        }
      }
    }

    // Consejo del día con IA
    let consejoDelDia = "Mantén la constancia. Cada sesión cuenta.";

    try {
      const groq = getGroqClient();
      const contexto = await getAthleteContext(userId);

      const prompt = `${contexto}

Genera UN consejo breve (máximo 2 frases) y muy accionable para el atleta HOY.
Basado en su nivel, objetivo, lesiones y estado actual.
Sé directa, como un coach real hablándole al oído antes de empezar la sesión.
NO uses frases genéricas ni clichés vacíos. Sé específica.

Responde solo con el consejo, sin comillas ni formato adicional.`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: DEFAULT_AI_MODEL,
        temperature: 0.8,
        max_tokens: 150,
      });

      const consejo = completion.choices[0]?.message?.content;
      if (consejo) consejoDelDia = consejo.trim();
    } catch {
      // Si falla la IA, usamos el consejo por defecto
    }

    const frase = obtenerFraseAleatoria();

    const briefing: MorningBriefing = {
      fecha: new Date().toISOString(),
      readinessScore,
      entrenamientoHoy,
      prAlAlcance,
      consejoDelDia,
      alertas,
      fraseMotivacional: frase,
    };

    return { success: true, briefing };
  } catch (error) {
    console.error("Error generando morning briefing:", error);
    return { success: false, error: "Error al generar el briefing matutino" };
  }
}
