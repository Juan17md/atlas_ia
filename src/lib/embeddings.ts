/**
 * Sistema de búsqueda semántica basada en extracción de conceptos
 * usando el LLM para generar términos clave y comparación por
 * similitud de Jaccard + pesos por categoría.
 *
 * Alternativa ligera a embeddings vectoriales que no requiere
 * API externa adicional.
 */

import { getGroqClient, DEFAULT_AI_MODEL } from "@/lib/ai";

export interface VectorConceptual {
  terminos: string[];
  categorias: string[];
  temaPrincipal: string;
}

const CACHE_CONCEPTOS = new Map<string, VectorConceptual>();

/**
 * Extrae conceptos clave de un texto usando el LLM.
 * Los resultados se cachean en memoria para no repetir llamadas.
 */
export async function extraerConceptos(texto: string): Promise<VectorConceptual> {
  const clave = texto.slice(0, 200).toLowerCase().trim();
  const cacheado = CACHE_CONCEPTOS.get(clave);
  if (cacheado) return cacheado;

  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Extrae conceptos clave de este texto. Responde SOLO JSON:
{
  "terminos": ["palabra clave 1", "palabra clave 2", ...],
  "categorias": ["categoria1", "categoria2", ...],
  "temaPrincipal": "tema principal en 3 palabras"
}
Categorías válidas: ejercicio, lesion, nutricion, progreso, tecnica, preferencia, objetivo, salud, motivacion, recuperacion`,
        },
        { role: "user", content: texto.slice(0, 300) },
      ],
      model: DEFAULT_AI_MODEL,
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    const resultado = JSON.parse(
      completion.choices[0]?.message?.content || "{}"
    );

    const concepto: VectorConceptual = {
      terminos: (resultado.terminos || []).map((t: string) => t.toLowerCase()),
      categorias: resultado.categorias || [],
      temaPrincipal: resultado.temaPrincipal || "",
    };

    if (CACHE_CONCEPTOS.size > 200) {
      const primeraClave = CACHE_CONCEPTOS.keys().next().value;
      if (primeraClave) CACHE_CONCEPTOS.delete(primeraClave);
    }
    CACHE_CONCEPTOS.set(clave, concepto);

    return concepto;
  } catch {
    return {
      terminos: texto.toLowerCase().split(/\s+/).filter(w => w.length > 3),
      categorias: [],
      temaPrincipal: "",
    };
  }
}

/**
 * Calcula similitud de Jaccard entre dos conjuntos de términos.
 */
export function similitudJaccard(a: string[], b: string[]): number {
  const setA = new Set(a.map(t => t.toLowerCase()));
  const setB = new Set(b.map(t => t.toLowerCase()));

  const interseccion = [...setA].filter(t => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;

  return union === 0 ? 0 : interseccion / union;
}

/**
 * Ponderación por categoría - ciertas categorías son más relevantes
 * para búsqueda en contexto de entrenamiento.
 */
const PESOS_CATEGORIA: Record<string, number> = {
  lesion: 2.0,
  ejercicio: 1.8,
  tecnica: 1.5,
  progreso: 1.5,
  objetivo: 1.4,
  nutricion: 1.2,
  preferencia: 1.2,
  salud: 1.8,
  motivacion: 1.0,
  recuperacion: 1.3,
};

/**
 * Calcula la similitud semántica entre dos textos
 * combinando Jaccard de términos + solapamiento de categorías.
 */
export async function similitudSemantica(
  textoA: string,
  textoB: string,
  conceptosA?: VectorConceptual
): Promise<number> {
  const [conceptosB] = await Promise.all([
    extraerConceptos(textoB),
  ]);

  const conceptosA_ = conceptosA || { terminos: [], categorias: [], temaPrincipal: "" };

  const scoreJaccard = similitudJaccard(conceptosA_.terminos, conceptosB.terminos);

  let scoreCategoria = 0;
  const catsB = new Set(conceptosB.categorias);
  for (const cat of conceptosA_.categorias) {
    if (catsB.has(cat)) {
      scoreCategoria += PESOS_CATEGORIA[cat] || 1;
    }
  }
  const maxPeso = Math.max(...Object.values(PESOS_CATEGORIA));
  const scoreCategoriaNorm = Math.min(scoreCategoria / (maxPeso * 3), 1);

  return scoreJaccard * 0.6 + scoreCategoriaNorm * 0.4;
}
