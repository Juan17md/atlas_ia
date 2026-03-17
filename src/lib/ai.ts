import Groq from "groq-sdk";
import { adminDb } from "@/lib/firebase-admin";
import type { RoutineDay } from "@/types";
import { getViviIntelligence, searchMemories, type ViviIntelligenceData } from "@/actions/vivi-intelligence-actions";

/** Modelo IA por defecto para todas las llamadas */
export const DEFAULT_AI_MODEL = "llama-3.3-70b-versatile";

export const getGroqClient = () => {
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
};

/**
 * Sanitiza datos de usuario para prevenir prompt injection.
 * Elimina caracteres potencialmente problemáticos que podrían manipular el prompt.
 */
function sanitizeForAI(input: string | undefined | null): string {
  if (!input) return "No especificado";
  
  const sanitized = String(input)
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/[{}[\]()]/g, '')
    .replace(/"+/g, '"')
    .replace(/\n{2,}/g, '\n')
    .trim();
  
  return sanitized.length > 500 ? sanitized.substring(0, 500) + "..." : sanitized;
}

function sanitizeArrayForAI(arr: string[] | undefined): string {
  if (!arr || arr.length === 0) return "Ninguno";
  return arr.map(sanitizeForAI).join(", ");
}

export async function getAthleteContext(userId: string, currentContext?: string): Promise<string> {
  try {
    const [userDoc, measurementsSnap, routinesSnap, logsSnap, viviIntel] = await Promise.all([
      adminDb.collection("users").doc(userId).get(),
      adminDb.collection("body_measurements")
        .where("userId", "==", userId)
        .limit(20)
        .get(),
      adminDb.collection("routines")
        .where("athleteId", "==", userId)
        .get(),
      adminDb.collection("training_logs")
        .where("athleteId", "==", userId)
        .limit(30)
        .get(),
      getViviIntelligence(userId)
    ]);

    if (!userDoc.exists) {
      return "PERFIL DE ATLETA: No encontrado. Por favor, complete su registro primero.";
    }

    const data = userDoc.data();
    if (!data) {
      return "PERFIL DE ATLETA: Datos incompletos. Información básica no disponible.";
    }

    const parts: string[] = [];

    // Información esencial del atleta
    parts.push("=== PERFIL DEL ATLETA ===");
    if (data.name) parts.push(`Nombre: ${sanitizeForAI(data.name)}`);
    if (data.gender) parts.push(`Género: ${data.gender === "male" ? "Masculino" : "Femenino"}`);
    if (data.birthDate) {
      const birth = data.birthDate.toDate ? data.birthDate.toDate() : new Date(data.birthDate);
      const age = Math.floor((Date.now() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      parts.push(`Edad: ${age} años`);
    }
    if (data.goal) parts.push(`Objetivo principal: ${sanitizeForAI(data.goal)}`);
    if (data.experienceLevel) parts.push(`Nivel de experiencia: ${sanitizeForAI(data.experienceLevel)}`);

    // Información de salud importante
    const injuries = data.injuries || [];
    if (injuries.length > 0) parts.push(`⚠️ Lesiones o limitaciones: ${sanitizeArrayForAI(injuries)}`);
    const medical = data.medicalConditions || [];
    if (medical.length > 0) parts.push(`⚠️ Condiciones médicas relevantes: ${sanitizeArrayForAI(medical)}`);

    // Estado actual y insights de Vivi
    if (viviIntel) {
      parts.push("\n=== ESTADO ACTUAL Y RECOMENDACIONES ===");
      parts.push(`Puntuación de preparación física: ${viviIntel.readinessScore}/100`);

      if (viviIntel.insights && viviIntel.insights.length > 0) {
        parts.push("\nInsights clave:");
        viviIntel.insights.forEach((insight: { type: string; title: string; content: string; actionable?: string }) => {
          parts.push(`• [${insight.type.toUpperCase()}] ${insight.title}`);
          parts.push(`  ${insight.content}`);
          if (insight.actionable) parts.push(`  → Acción recomendada: ${insight.actionable}`);
        });
      }

      if (viviIntel.memories && viviIntel.memories.length > 0) {
        const relevantMemories = currentContext 
          ? await searchMemories(userId, currentContext, 3)
          : viviIntel.memories.slice(0, 3);
        
        if (relevantMemories.length > 0) {
          parts.push("\nMemorias recientes relevantes:");
          relevantMemories.forEach((m: { date: Date; category: string; content: string }) => {
            const date = m.date instanceof Date ? m.date.toLocaleDateString("es-ES") : "reciente";
            parts.push(`• [${date}] [${m.category}] ${m.content}`);
          });
        }
      }
    }

    // Progreso físico reciente
    const sortedMeasurements = measurementsSnap.docs
      .map((doc: { data: () => Record<string, unknown> }) => doc.data())
      .sort((a, b) => {
        const dateA = a.date && typeof a.date === 'object' && 'toDate' in a.date && typeof (a.date as any).toDate === 'function' 
          ? (a.date as any).toDate().getTime() 
          : 0;
        const dateB = b.date && typeof b.date === 'object' && 'toDate' in b.date && typeof (b.date as any).toDate === 'function' 
          ? (b.date as any).toDate().getTime() 
          : 0;
        return dateB - dateA;
      })
     .slice(0, 3);

    if (sortedMeasurements.length > 0) {
      parts.push("\n=== PROGRESO FÍSICO RECIENTE ===");
      sortedMeasurements.forEach((m: Record<string, unknown>, i: number) => {
        const dateObj = m.date && typeof m.date === 'object' && 'toDate' in m.date && typeof (m.date as any).toDate === 'function' 
          ? (m.date as any).toDate() 
          : null;
        const date = dateObj ? dateObj.toLocaleDateString("es-ES") : "Fecha no disponible";
        parts.push(`• Medida ${i + 1} (${date}):`);
        parts.push(`  - Peso: ${m.weight}kg`);
        parts.push(`  - Grasa corporal: ${m.bodyFat || "N/A"}%`);
        parts.push(`  - Cintura: ${m.waist || "N/A"}cm`);
      });
    }

     // Rutina actual
     const activeRoutine = routinesSnap.docs.find((doc: { data: () => Record<string, unknown> }) => doc.data().active === true);
     if (activeRoutine) {
       const routine = activeRoutine.data();
       parts.push(`\n=== RUTINA DE ENTRENAMIENTO ACTUAL ===\n`);
       parts.push(`Nombre: ${routine.name}`);
       if (routine.schedule) {
         parts.push("Próximos entrenamientos:");
         routine.schedule.slice(0, 3).forEach((day: RoutineDay) => {
           const exerciseNames = day.exercises?.map((ex) => ex.exerciseName).join(", ") || "Ejercicios no especificados";
           parts.push(`• ${day.name}: ${exerciseNames}`);
         });
       }
     }

    // Historial de entrenamiento reciente
    const completedLogs = logsSnap.docs
      .map((doc: { data: () => Record<string, unknown> }) => doc.data())
      .filter((log: Record<string, unknown>) => log.status === "completed")
      .sort((a, b) => {
        const dateA = a.date && typeof a.date === 'object' && 'toDate' in a.date && typeof (a.date as any).toDate === 'function' 
          ? (a.date as any).toDate().getTime() 
          : 0;
        const dateB = b.date && typeof b.date === 'object' && 'toDate' in b.date && typeof (b.date as any).toDate === 'function' 
          ? (b.date as any).toDate().getTime() 
          : 0;
        return dateB - dateA;
      })
     .slice(0, 3);

    if (completedLogs.length > 0) {
      parts.push("\n=== HISTORIAL DE ENTRENAMIENTO RECIENTE ===");
      completedLogs.forEach((log: Record<string, unknown>) => {
        const dateObj = log.date && typeof log.date === 'object' && 'toDate' in log.date && typeof (log.date as any).toDate === 'function' 
          ? (log.date as any).toDate() 
          : null;
        const date = dateObj ? dateObj.toLocaleDateString("es-ES") : "Fecha no disponible";
        parts.push(`• ${date}: ${log.routineName || "Sesión de entrenamiento"} (${log.durationMinutes || "?"} minutos)`);
      });
    }

    // Instrucciones para la IA
    parts.push("\n=== INSTRUCCIONES PARA EL ASISTENTE ===");
    parts.push("Basándote en la información proporcionada anteriormente:");
    parts.push("1. Proporciona recomendaciones personalizadas y específicas");
    parts.push("2. Ten en cuenta las lesiones, limitaciones y condiciones médicas");
    parts.push("3. Alinea tus sugerencias con el objetivo principal del atleta");
    parts.push("4. Considera el nivel de experiencia y la puntuación de preparación");
    parts.push("5. Sé motivador, empático y profesional en tus respuestas");
    parts.push("6. Si no tienes suficiente información para una recomendación específica, indícalo claramente");

    return parts.join("\n");
  } catch (error) {
    console.error("Error fetching athlete context:", error);
    return "ERROR: No se pudo obtener el contexto del atleta. Por favor, intenta de nuevo más tarde.";
  }
}
