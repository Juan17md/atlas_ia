"use server";

import { adminDb } from "@/lib/firebase-admin";
import { auth } from "@/lib/auth";
import { getGroqClient, DEFAULT_AI_MODEL } from "@/lib/ai";

export interface ViviInsight {
    type: "fatigue" | "pr" | "nutrition" | "memory" | "injury" | "motivation" | "technique";
    title: string;
    content: string;
    severity: "low" | "medium" | "high";
    actionable?: string;
}

export interface ViviMemory {
    id: string;
    content: string;
    date: Date;
    category: "health" | "technique" | "personal" | "goal" | "injury" | "nutrition" | "preference" | "progress";
    importance: "low" | "medium" | "high";
    context?: string;
    tags?: string[];
    relatedExercise?: string;
}

export interface ViviIntelligenceData {
    lastAnalyzed: Date | null;
    insights: ViviInsight[];
    readinessScore: number;
    memories: ViviMemory[];
    conversationHistory?: Array<{
        role: "user" | "assistant";
        content: string;
        timestamp: Date;
    }>;
    longTermGoals?: Array<{
        goal: string;
        targetDate?: Date;
        progress?: number;
    }>;
}

function generateMemoryId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function categorizeMemoryContent(content: string): { category: string, importance: string, tags: string[] } {
    const lowerContent = content.toLowerCase();
    
    let category = "personal";
    let importance = "medium";
    const tags: string[] = [];

    if (lowerContent.includes("dolor") || lowerContent.includes("lesión") || lowerContent.includes("malo") || lowerContent.includes("herido")) {
        category = "injury";
        importance = "high";
        tags.push("salud", "dolor");
    } else if (lowerContent.includes("hombro") || lowerContent.includes("rodilla") || lowerContent.includes("espalda") || lowerContent.includes("muñeca")) {
        category = "health";
        importance = "high";
        tags.push("zona corporal");
    } else if (lowerContent.includes("técnica") || lowerContent.includes("forma") || lowerContent.includes("postura")) {
        category = "technique";
        importance = "medium";
        tags.push("formulario");
    } else if (lowerContent.includes("objetivo") || lowerContent.includes("meta") || lowerContent.includes("llegar a")) {
        category = "goal";
        importance = "high";
        tags.push("meta");
    } else if (lowerContent.includes("comida") || lowerContent.includes("dieta") || lowerContent.includes("nutri")) {
        category = "nutrition";
        importance = "medium";
        tags.push("alimentacion");
    } else if (lowerContent.includes("prefer") || lowerContent.includes("me gust") || lowerContent.includes("no me gust")) {
        category = "preference";
        importance = "low";
        tags.push("gustos");
    } else if (lowerContent.includes("progres") || lowerContent.includes("avance") || lowerContent.includes("mejor")) {
        category = "progress";
        importance = "medium";
        tags.push("avance");
    }

    const exerciseMatch = content.match(/(press de banca|sentadilla|peso muerto|dominadas|pullover|curl|bíceps|tríceps|hombro|pecho|espalda|pierna|cuádriceps|isquiotibiales|glúteos|pantorrillas)/i);
    if (exerciseMatch) {
        tags.push(exerciseMatch[0].toLowerCase());
    }

    return { category, importance, tags };
}

function extractMessageContext(message: string): string {
    const exerciseMatch = message.match(/(haciendo|hacer|ejercicio|entreno|serie|repeticiones|kg|lbs)/i);
    return exerciseMatch ? `Contexto de entreno: ${exerciseMatch[0]}` : "";
}

export async function searchMemories(userId: string, query: string, limit: number = 5): Promise<ViviMemory[]> {
    try {
        const doc = await adminDb.collection("vivi_intelligence").doc(userId).get();
        if (!doc.exists) return [];

        const memories = (doc.data()?.memories || []) as ViviMemory[];
        
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(" ").filter(w => w.length > 2);
        
        const scoredMemories = memories.map(mem => {
            let score = 0;
            const memContent = mem.content.toLowerCase();
            
            if (memContent.includes(queryLower)) score += 10;
            
            queryWords.forEach(word => {
                if (memContent.includes(word)) score += 3;
            });
            
            if (mem.tags) {
                mem.tags.forEach(tag => {
                    if (queryLower.includes(tag)) score += 5;
                });
            }
            
            if (mem.category === "injury" || mem.category === "health") score *= 1.5;
            if (mem.importance === "high") score *= 1.3;
            
            return { memory: mem, score };
        });
        
        return scoredMemories
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.memory);
    } catch (error) {
        console.error("Search memories error:", error);
        return [];
    }
}

export async function buildContextFromMemories(memories: ViviMemory[]): Promise<string> {
    if (!memories || memories.length === 0) return "";
    
    const sections: string[] = ["--- HISTORIAL RELEVANTE ---"];
    
    const byCategory: Record<string, ViviMemory[]> = {};
    memories.forEach(mem => {
        if (!byCategory[mem.category]) byCategory[mem.category] = [];
        byCategory[mem.category].push(mem);
    });
    
    const categoryLabels: Record<string, string> = {
        injury: "LESIONES/SALUD",
        health: "CONDICIONES FÍSICAS",
        technique: "NOTAS TÉCNICAS",
        goal: "OBJETIVOS",
        nutrition: "NUTRICIÓN",
        preference: "PREFERENCIAS",
        progress: "PROGRESO",
        personal: "NOTAS PERSONALES"
    };
    
    Object.entries(byCategory).forEach(([category, mems]) => {
        sections.push(`\n${categoryLabels[category]}:`);
        mems.slice(0, 3).forEach((mem) => {
            const date = mem.date instanceof Date ? mem.date.toLocaleDateString("es-ES") : "reciente";
            sections.push(`- [${date}] ${mem.content}`);
        });
    });
    
    return sections.join("\n");
}

export async function analyzeViviIntelligence(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    const targetUserId = userId || session.user.id;

    if (targetUserId !== session.user.id) {
        const coachDoc = await adminDb.collection("users").doc(session.user.id).get();
        const isCoach = coachDoc.exists && coachDoc.data()?.role === "coach";
        
        if (isCoach) {
            const athleteDoc = await adminDb.collection("users").doc(targetUserId).get();
            const athleteData = athleteDoc.data();
            if (!athleteData || athleteData.coachId !== session.user.id) {
                return { success: false, error: "No autorizado: no eres el coach de este atleta" };
            }
        } else {
            return { success: false, error: "No autorizado para analizar este atleta" };
        }
    }

    try {
        const groq = getGroqClient();

        const [userDoc, logsSnap, measurementsSnap] = await Promise.all([
            adminDb.collection("users").doc(targetUserId).get(),
            adminDb.collection("training_logs")
                .where("athleteId", "==", targetUserId)
                .limit(40)
                .get(),
            adminDb.collection("body_measurements")
                .where("userId", "==", targetUserId)
                .limit(20)
                .get()
        ]);

        const userData = userDoc.data();
        const rawLogs = logsSnap.docs.map(d => d.data());
        const sortedLogs = rawLogs
            .sort((a, b) => {
                const dateA = a.date?.toDate ? a.date.toDate().getTime() : 0;
                const dateB = b.date?.toDate ? b.date.toDate().getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, 15);

        const logs = sortedLogs.map(d => ({
            date: d.date?.toDate().toISOString().split('T')[0],
            routineName: d.routineName,
            duration: d.durationMinutes,
            exercises: (d.exercises || []).map((e: { exerciseName: string; sets?: Array<{ rpe?: number; weight?: number }> }) => ({
                name: e.exerciseName,
                avgRpe: (e.sets || []).reduce((acc: number, s) => acc + (s.rpe || 8), 0) / (e.sets?.length || 1),
                topWeight: Math.max(...(e.sets || []).map((s) => s.weight || 0), 0)
            }))
        }));

        const rawMeasurements = measurementsSnap.docs.map(d => d.data());
        const sortedMeasurements = rawMeasurements
            .sort((a, b) => {
                const dateA = a.date?.toDate ? a.date.toDate().getTime() : 0;
                const dateB = b.date?.toDate ? b.date.toDate().getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, 5);

        const measurements = sortedMeasurements.map(d => ({
            date: d.date?.toDate().toISOString().split('T')[0],
            weight: d.weight,
            bodyFat: d.bodyFat
        }));

        const prompt = `
            Eres Vivi, una IA entrenadora experta, empática y proactiva. 
            Analiza estos datos del atleta y genera INSIGHTS ESTRATÉGICOS.

            DATOS DEL ATLETA:
            - Objetivo: ${userData?.goal}
            - Lesiones: ${userData?.injuries?.join(", ") || "Ninguna"}
            - Historial entrenos: ${JSON.stringify(logs)}
            - Historial medidas: ${JSON.stringify(measurements)}

            TAREAS:
            1. ANALIZA FATIGA: Mira si el RPE ha subido en los últimos entrenos sin aumento de carga (Fatiga acumulada).
            2. DETECTA PR CHALLENGES: Encuentra ejercicios donde el atleta esté estancado o progrese lento y sugiérele un peso objetivo para romper su récord.
            3. NUTRICIÓN INTELIGENTE: Basado en el volumen de entrenamiento reciente y su peso, da un consejo nutricional específico.
            4. PUNTUACIÓN DE "READINESS": Da un score del 0 al 100 de qué tan preparado está hoy para un entrenamiento intenso.

            Respuesta JSON obligatoria:
            {
                "readinessScore": 85,
                "insights": [
                    { "type": "fatigue", "title": "...", "content": "...", "severity": "medium", "actionable": "Descansa mañana" },
                    { "type": "pr", "title": "¡Récord a la vista!", "content": "En Press de Banca puedes tirar 80kg hoy.", "severity": "low", "actionable": "Prueba 80kg en la 1ra serie" },
                    { "type": "nutrition", "title": "Carga de combustible", "content": "Tu volumen subió un 20%. Sube 30g de carbohidratos.", "severity": "low" }
                ]
            }
        `;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: DEFAULT_AI_MODEL,
            temperature: 0.3,
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || "{}");

        const intelligenceRef = adminDb.collection("vivi_intelligence").doc(targetUserId);
        const currentIntel = await intelligenceRef.get();
        const existingMemories = currentIntel.exists ? (currentIntel.data()?.memories || []) : [];

        await intelligenceRef.set({
            lastAnalyzed: new Date(),
            readinessScore: result.readinessScore || 70,
            insights: result.insights || [],
            memories: existingMemories
        }, { merge: true });

        return { success: true, data: result };

    } catch (error) {
        console.error("Vivi Intelligence Error:", error);
        return { success: false, error: "Error al generar inteligencia de Vivi" };
    }
}

export async function saveViviMemory(
    content: string, 
    category: string = "general",
    options?: {
        context?: string;
        relatedExercise?: string;
        forceCategory?: ViviMemory["category"];
        forceImportance?: ViviMemory["importance"];
    }
) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const intelRef = adminDb.collection("vivi_intelligence").doc(session.user.id);
        
        const classification = options?.forceCategory 
            ? { category: options.forceCategory, importance: options.forceImportance || "medium", tags: [] as string[] }
            : categorizeMemoryContent(content);
        
        const tags = [...classification.tags];
        if (options?.relatedExercise) {
            tags.push(options.relatedExercise.toLowerCase());
        }

        const newMemory: ViviMemory = {
            id: generateMemoryId(),
            content,
            date: new Date(),
            category: classification.category as ViviMemory["category"],
            importance: classification.importance as ViviMemory["importance"],
            context: options?.context || extractMessageContext(content),
            tags,
            relatedExercise: options?.relatedExercise
        };

        await adminDb.runTransaction(async (transaction) => {
            const doc = await transaction.get(intelRef);
            const memories: ViviMemory[] = doc.exists ? (doc.data()?.memories || []) : [];
            
            const updatedMemories = [newMemory, ...memories].slice(0, 20);
            
            transaction.set(intelRef, { memories: updatedMemories }, { merge: true });
        });

        return { success: true, memory: newMemory };
    } catch (error) {
        console.error("Save Memory Error:", error);
        return { success: false, error: "No se pudo guardar la memoria" };
    }
}

export async function saveConversationMessage(
    role: "user" | "assistant", 
    content: string
) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const intelRef = adminDb.collection("vivi_intelligence").doc(session.user.id);

        await adminDb.runTransaction(async (transaction) => {
            const doc = await transaction.get(intelRef);
            const history: Array<{ role: "user" | "assistant"; content: string; timestamp: Date }> = 
                doc.exists ? (doc.data()?.conversationHistory || []) : [];
            
            const newHistory = [...history, { role, content, timestamp: new Date() }].slice(-20);
            
            transaction.set(intelRef, { conversationHistory: newHistory }, { merge: true });
        });

        return { success: true };
    } catch (error) {
        console.error("Save conversation error:", error);
        return { success: false, error: "No se pudo guardar el mensaje" };
    }
}

export async function getViviIntelligence(userId?: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const targetUserId = userId || session.user.id;

    if (targetUserId !== session.user.id) {
        const coachDoc = await adminDb.collection("users").doc(session.user.id).get();
        const isCoach = coachDoc.exists && coachDoc.data()?.role === "coach";
        
        if (isCoach) {
            const athleteDoc = await adminDb.collection("users").doc(targetUserId).get();
            const athleteData = athleteDoc.data();
            if (!athleteData || athleteData.coachId !== session.user.id) {
                return null;
            }
        } else {
            return null;
        }
    }

    try {
        const doc = await adminDb.collection("vivi_intelligence").doc(targetUserId).get();
        if (!doc.exists) return null;
        return doc.data() as ViviIntelligenceData;
    } catch (error) {
        console.error("Error getting Vivi intelligence:", error);
        return null;
    }
}

export async function updateLongTermGoal(goal: string, targetDate?: Date) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const intelRef = adminDb.collection("vivi_intelligence").doc(session.user.id);
        
        await adminDb.runTransaction(async (transaction) => {
            const doc = await transaction.get(intelRef);
            const goals = doc.exists ? (doc.data()?.longTermGoals || []) : [];
            
            const newGoals = [...goals, { goal, targetDate, progress: 0 }].slice(-5);
            
            transaction.set(intelRef, { longTermGoals: newGoals }, { merge: true });
        });

        return { success: true };
    } catch (error) {
        console.error("Update goal error:", error);
        return { success: false, error: "No se pudo actualizar el objetivo" };
    }
}

export async function deleteMemory(memoryId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "No autorizado" };

    try {
        const intelRef = adminDb.collection("vivi_intelligence").doc(session.user.id);
        
        await adminDb.runTransaction(async (transaction) => {
            const doc = await transaction.get(intelRef);
            const memories: ViviMemory[] = doc.exists ? (doc.data()?.memories || []) : [];
            
            const filtered = memories.filter(m => m.id !== memoryId);
            
            transaction.set(intelRef, { memories: filtered }, { merge: true });
        });

        return { success: true };
    } catch (error) {
        console.error("Delete memory error:", error);
        return { success: false, error: "No se pudo eliminar la memoria" };
    }
}
