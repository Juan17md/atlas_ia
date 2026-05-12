"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import type { TrainingSetData, TrainingExerciseData } from "@/types";

export interface AlertaProactiva {
  id: string;
  tipo: "estancamiento" | "abandono" | "sobreentrenamiento" | "nutricion" | "medidas";
  titulo: string;
  mensaje: string;
  severidad: "low" | "medium" | "high";
  accion?: string;
  fechaDeteccion: Date;
}

function generarIdAlerta(): string {
  return `alerta_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Detecta estancamiento: ejercicios sin mejora en 2+ semanas.
 */
async function detectarEstancamiento(userId: string): Promise<AlertaProactiva[]> {
  const alertas: AlertaProactiva[] = [];

  try {
    const logsSnapshot = await adminDb
      .collection("training_logs")
      .where("athleteId", "==", userId)
      .orderBy("date", "desc")
      .limit(15)
      .get();

    if (logsSnapshot.empty || logsSnapshot.size < 3) return alertas;

    const ejerciciosHistorial = new Map<
      string,
      { fecha: Date; mejorE1RM: number }[]
    >();

    const calcularE1RM = (weight: number, reps: number, rpe: number) =>
      weight * (1 + (reps + (10 - rpe)) / 30);

    for (const doc of logsSnapshot.docs) {
      const data = doc.data();
      const fecha = data.date?.toDate?.() || new Date();

      if (data.exercises) {
        for (const ex of data.exercises) {
          const nombre = ex.exerciseName;
          let mejorE1RM = 0;

          for (const set of ex.sets || []) {
            if (set.completed && set.weight && set.reps) {
              const e1rm = calcularE1RM(set.weight, set.reps, set.rpe || 8);
              if (e1rm > mejorE1RM) mejorE1RM = e1rm;
            }
          }

          if (mejorE1RM > 0) {
            if (!ejerciciosHistorial.has(nombre)) {
              ejerciciosHistorial.set(nombre, []);
            }
            ejerciciosHistorial.get(nombre)!.push({ fecha, mejorE1RM });
          }
        }
      }
    }

    for (const [nombre, historial] of ejerciciosHistorial) {
      if (historial.length < 3) continue;

      const primero = historial[0];
      const ultimo = historial[historial.length - 1];

      const diffSemanas =
        (primero.fecha.getTime() - ultimo.fecha.getTime()) /
        (1000 * 60 * 60 * 24 * 7);

      if (diffSemanas >= 2) {
        const cambio = primero.mejorE1RM > 0
          ? ((ultimo.mejorE1RM - primero.mejorE1RM) / primero.mejorE1RM) * 100
          : 0;

        if (cambio <= 2) {
          alertas.push({
            id: generarIdAlerta(),
            tipo: "estancamiento",
            titulo: `Estancamiento en ${nombre}`,
            mensaje: `${nombre} no ha progresado en ${Math.round(diffSemanas)} semanas. Toca variar estímulo.`,
            severidad: diffSemanas >= 4 ? "high" : "medium",
            accion: "Cambia rango de repeticiones, añade dropsets o prueba una variante.",
            fechaDeteccion: new Date(),
          });
        }
      }
    }
  } catch (error) {
    console.error("Error detectando estancamiento:", error);
  }

  return alertas;
}

/**
 * Detecta posible sobreentrenamiento: RPE subiendo sin aumento de carga.
 */
async function detectarSobreentrenamiento(userId: string): Promise<AlertaProactiva[]> {
  const alertas: AlertaProactiva[] = [];

  try {
    const logsSnapshot = await adminDb
      .collection("training_logs")
      .where("athleteId", "==", userId)
      .orderBy("date", "desc")
      .limit(12)
      .get();

    if (logsSnapshot.empty || logsSnapshot.size < 6) return alertas;

    const logs = logsSnapshot.docs.map((d) => d.data());
    const logsRecientes = logs.slice(0, 6);

    let rpeTotal = 0;
    let sesionesConRPE = 0;

    for (const log of logsRecientes) {
      if (log.sessionRpe) {
        rpeTotal += log.sessionRpe;
        sesionesConRPE++;
      }
    }

    if (sesionesConRPE >= 3) {
      const rpePromedio = rpeTotal / sesionesConRPE;

      if (rpePromedio >= 8.5) {
        alertas.push({
          id: generarIdAlerta(),
          tipo: "sobreentrenamiento",
          titulo: "Fatiga acumulada detectada",
          mensaje: `Tu RPE promedio en las últimas ${sesionesConRPE} sesiones es ${rpePromedio.toFixed(1)}/10. Considera una semana de descarga.`,
          severidad: rpePromedio >= 9 ? "high" : "medium",
          accion: "Reduce el volumen al 50% por 5-7 días o toma 2-3 días de descanso completo.",
          fechaDeteccion: new Date(),
        });
      }
    }
  } catch (error) {
    console.error("Error detectando sobreentrenamiento:", error);
  }

  return alertas;
}

/**
 * Verifica si el atleta no ha registrado medidas corporales en más de 1 mes.
 */
async function detectarFaltaMedidas(userId: string): Promise<AlertaProactiva[]> {
  const alertas: AlertaProactiva[] = [];

  try {
    const medidasSnap = await adminDb
      .collection("body_measurements")
      .where("userId", "==", userId)
      .orderBy("date", "desc")
      .limit(1)
      .get();

    if (medidasSnap.empty) {
      alertas.push({
        id: generarIdAlerta(),
        tipo: "medidas",
        titulo: "Registra tus medidas",
        mensaje: "No tienes medidas corporales registradas. Son clave para evaluar tu progreso real.",
        severidad: "medium",
        accion: "Toma tus medidas hoy (peso, cintura, cadera, etc.) y regístralas en Progreso.",
        fechaDeteccion: new Date(),
      });
      return alertas;
    }

    const ultimaMedida = medidasSnap.docs[0].data();
    const fechaUltima =
      ultimaMedida.date?.toDate?.() || new Date(ultimaMedida.date);
    const diasDesdeUltimaMedida = Math.floor(
      (Date.now() - fechaUltima.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasDesdeUltimaMedida > 30) {
      alertas.push({
        id: generarIdAlerta(),
        tipo: "medidas",
        titulo: "Actualiza tus medidas",
        mensaje: `Han pasado ${diasDesdeUltimaMedida} días desde tu última medición. Mide tu progreso.`,
        severidad: "low",
        accion: "Registra nuevas medidas para mantener un seguimiento preciso.",
        fechaDeteccion: new Date(),
      });
    }
  } catch (error) {
    console.error("Error verificando medidas:", error);
  }

  return alertas;
}

/**
 * Obtiene todas las alertas proactivas para un atleta.
 */
export async function obtenerAlertasProactivas(): Promise<{
  success: boolean;
  alertas?: AlertaProactiva[];
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "No autorizado" };

  try {
    const userId = session.user.id;

    const [estancamiento, sobreentrenamiento, medidas] = await Promise.all([
      detectarEstancamiento(userId),
      detectarSobreentrenamiento(userId),
      detectarFaltaMedidas(userId),
    ]);

    const todasAlertas = [
      ...estancamiento,
      ...sobreentrenamiento,
      ...medidas,
    ].sort((a, b) => {
      const peso = { high: 3, medium: 2, low: 1 };
      return peso[b.severidad] - peso[a.severidad];
    });

    return { success: true, alertas: todasAlertas };
  } catch (error) {
    console.error("Error obteniendo alertas:", error);
    return { success: false, error: "Error al generar alertas" };
  }
}
