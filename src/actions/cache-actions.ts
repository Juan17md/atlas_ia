"use server";

import { revalidateTag } from "next/cache";

/**
 * Etiquetas de caché disponibles para revalidación.
 * Usar estas constantes para mantener consistencia.
 */
export const CACHE_TAGS = {
    // Owner
    OWNER_STATS: "owner-stats",
    ACTIVITY_NOTIFICATIONS: "activity-notifications",

    // Athletes
    ATHLETES: "athletes",
    ATHLETE_DETAILS: "athlete-details",
    ATHLETE_NOTIFICATIONS: "athlete-notifications",

    // Routines
    ROUTINES: "routines",

    // Exercises
    EXERCISES: "exercises",

    // Training
    TRAINING_LOGS: "training-logs",

    // Notifications
    NOTIFICATIONS: "notifications",
} as const;

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];

/**
 * Revalida una o más etiquetas de caché.
 * Usar después de mutaciones para actualizar datos cacheados.
 * 
 * @example
 * ```ts
 * // Después de crear una rutina
 * await revalidateCacheTags(["routines", "owner-stats"]);
 * ```
 */
export async function revalidateCacheTags(tags: CacheTag[]) {
    // Next.js 16 requiere un profile como segundo argumento
    // "default" usa la configuración de caché por defecto
    tags.forEach(tag => revalidateTag(tag, "default"));
}

/**
 * Revalida datos del propietario (stats, rutinas, ejercicios).
 * Usar cuando hay cambios que afectan múltiples secciones.
 */
export async function revalidateDashboardData() {
    await revalidateCacheTags([
        CACHE_TAGS.OWNER_STATS,
        CACHE_TAGS.ROUTINES,
        CACHE_TAGS.EXERCISES,
    ]);
}

/**
 * Revalida datos después de un entrenamiento.
 */
export async function revalidateTrainingData() {
    await revalidateCacheTags([
        CACHE_TAGS.TRAINING_LOGS,
        CACHE_TAGS.ATHLETE_NOTIFICATIONS,
        CACHE_TAGS.OWNER_STATS,
    ]);
}
