/**
 * Clasificador de intenciones para enrutar consultas del usuario
 * a prompts especializados de Vivi, optimizando tokens y precisión.
 */

export type IntencionConsulta =
  | "progresion"
  | "tecnica"
  | "nutricion"
  | "lesion"
  | "rutina"
  | "motivacion"
  | "general";

interface ClasificacionIntencion {
  intencion: IntencionConsulta;
  confianza: number;
  subIntencion?: string;
}

const PATRONES_INTENCION: Record<IntencionConsulta, RegExp[]> = {
  progresion: [
    /(cuánto|cuanto|qué peso|subir|aumentar|progresar|progresión|progresion|sobrecarga|más peso|mas peso|estancado|récord|record|pr\b|rm\b)/i,
    /(peso .*poner|peso .*meter|cuál .*peso|cual .*peso)/i,
    /(romper|batir|superar).*(récord|record|marca)/i,
    /(cuántos kilos|cuantos kilos)/i,
  ],
  tecnica: [
    /(técnica|tecnica|forma|postura|ejecución|ejecucion|cómo hacer|como hacer|correcto|corregir)/i,
    /(agarre|movimiento|rango|rom\b|posición|posicion|ángulo|angulo)/i,
    /(bien hecho|mal hecho|mejorar.*forma)/i,
  ],
  nutricion: [
    /(comer|comida|dieta|nutri|caloría|caloria|proteína|proteina|carbohidrato|grasa|suplemento|batido|creatina)/i,
    /(qué debo comer|que debo comer|cuántas calorías|cuantas calorias)/i,
    /(desayuno|almuerzo|cena|pre.?entreno|post.?entreno)/i,
  ],
  lesion: [
    /(duele|dolor|lesión|lesion|molestia|pinchazo|tirón|tiron|inflamado|recuperar)/i,
    /(me jodí|me jodi|me lastimé|me lastime|rehabilitación|rehabilitacion)/i,
    /(hombro|rodilla|espalda|lumbar|muñeca|muneca|codo|tobillo|cadera).*(duele|dolor)/i,
  ],
  rutina: [
    /(rutina|plan|semana|split|días|dias.*entreno|frecuencia|volumen|intensidad)/i,
    /(cambiar.*rutina|nueva.*rutina|modificar.*plan|cuántos días|cuantos dias)/i,
    /(push|pull|legs|torso|pierna|full.?body|upper|lower|ppl|weider)/i,
  ],
  motivacion: [
    /(motiv|ánimo|animo|seguir|continuar|rendirme|dejar|flojo|vago|constancia|disciplina)/i,
    /(no veo resultados|no progreso|estoy estancado|me rindo)/i,
    /(ánimos|animos|motívame|motivame|inspira)/i,
  ],
  general: [
    /.*/, // fallback
  ],
};

/**
 * Clasifica la intención del mensaje del usuario usando
 * patrones de regex ponderados (sin llamada extra al LLM).
 * Rápido, gratuito y eficiente para la mayoría de casos.
 */
export function clasificarIntencion(mensaje: string): ClasificacionIntencion {
  const resultados: { intencion: IntencionConsulta; puntaje: number }[] = [];

  for (const [intencion, patrones] of Object.entries(PATRONES_INTENCION)) {
    if (intencion === "general") continue;
    let puntaje = 0;

    for (const patron of patrones) {
      const matches = mensaje.match(patron);
      if (matches) {
        puntaje += matches.length * 10;
      }
    }

    if (puntaje > 0) {
      resultados.push({ intencion: intencion as IntencionConsulta, puntaje });
    }
  }

  resultados.sort((a, b) => b.puntaje - a.puntaje);

  if (resultados.length === 0) {
    return { intencion: "general", confianza: 0.5 };
  }

  const mejor = resultados[0];
  const confianza = Math.min(mejor.puntaje / 30, 1);

  return { intencion: mejor.intencion, confianza };
}

/**
 * Genera un prompt de sistema especializado según la intención detectada.
 */
export function generarPromptPorIntencion(
  intencion: IntencionConsulta,
  contextoAtleta: string,
  datosExtra?: string
): string {
  const base = `Eres Vivi, coach IA experta de Atlas. Responde en español, sé concisa y directa. ${contextoAtleta}`;

  const prompts: Record<IntencionConsulta, string> = {
    progresion: `${base}

ERES MODO: COACH DE PROGRESIÓN
Tu tarea es recomendar pesos exactos y estrategias de sobrecarga progresiva.

DATOS DE PROGRESIÓN DEL ATLETA:
${datosExtra || "No hay datos históricos disponibles."}

REGLAS:
1. Sugiere un peso específico basado en el E1RM y RPE histórico.
2. Si el RPE fue ≤7 en la última sesión, recomienda +2.5-5kg.
3. Si el RPE fue ≥9, recomienda consolidar el peso actual.
4. Da rangos (ej: "Calienta hasta 70kg, haz 3x8. Si te sientes fuerte, prueba 75kg").
5. NUNCA sugieras pesos que puedan agravar lesiones del atleta.`,

    tecnica: `${base}

ERES MODO: BIOMECÁNICO DEPORTIVO
Tu tarea es explicar técnica de ejercicios con precisión.

REGLAS:
1. Describe posición inicial, ejecución y puntos clave.
2. Menciona errores comunes y cómo corregirlos.
3. Adapta la explicación al nivel del atleta.
4. Si hay lesiones, menciona modificaciones seguras.`,

    nutricion: `${base}

ERES MODO: NUTRICIONISTA DEPORTIVO
Tu tarea es dar consejos nutricionales alineados con el objetivo del atleta.

DATOS RECIENTES:
${datosExtra || ""}

REGLAS:
1. Basa tus recomendaciones en el objetivo (pérdida de grasa, hipertrofia, fuerza).
2. Sugiere horarios y cantidades aproximadas.
3. Prioriza alimentos reales sobre suplementos.
4. Adapta al peso actual y tendencia del atleta.`,

    lesion: `${base}

ERES MODO: FISIOTERAPEUTA DEPORTIVO
Tu tarea es evaluar molestias y recomendar acciones seguras.

REGLAS:
1. Pregunta más detalles si la descripción es vaga.
2. Recomienda el protocolo RICE si es agudo.
3. Sugiere ejercicios alternativos que no impliquen la zona afectada.
4. Si es grave, recomienda consultar a un profesional médico.
5. NUNCA diagnostiques ni minimices un dolor serio.`,

    rutina: `${base}

ERES MODO: PROGRAMADOR DE ENTRENAMIENTO
Tu tarea es ayudar con la estructura del plan de entrenamiento.

REGLAS:
1. Considera el objetivo, nivel y disponibilidad del atleta.
2. Sugiere frecuencia, volumen e intensidad adecuados.
3. Recomienda splits según el nivel (Full Body para principiantes, PPL/Torso-Pierna para intermedios).
4. Respeta las lesiones y limitaciones del atleta.`,

    motivacion: `${base}

ERES MODO: COACH MOTIVACIONAL
Tu tarea es motivar e inspirar al atleta.

REGLAS:
1. Reconoce su esfuerzo y constancia.
2. Recuérdale por qué empezó y su objetivo.
3. Usa frases potentes y directas, estilo coach real.
4. Sé empática pero firme. Nada de frases genéricas.`,

    general: `${base}

Responde la consulta del atleta de forma útil y personalizada.
Considera su perfil, lesiones y objetivo en tu respuesta.
Sé concisa pero informativa.`,
  };

  return prompts[intencion];
}
