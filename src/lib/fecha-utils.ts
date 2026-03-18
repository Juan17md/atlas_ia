/**
 * Utilidades de fecha timezone-safe para evitar desfases entre
 * el servidor de Vercel (UTC) y la zona horaria del usuario.
 *
 * La app opera en Venezuela (UTC-4) por defecto.
 * Se puede sobrescribir con la variable de entorno APP_TIMEZONE.
 */

const ZONA_HORARIA = process.env.APP_TIMEZONE || "America/Caracas";

/**
 * Retorna un objeto Date que representa "ahora" en la zona horaria del usuario.
 * Útil para server actions donde `new Date()` daría UTC.
 *
 * Internamente crea un Date cuyas componentes (año, mes, día, hora)
 * corresponden al reloj local del usuario.
 */
export function obtenerAhoraLocal(): Date {
    const ahora = new Date();
    // Formatear las partes de la fecha en la zona horaria objetivo
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: ZONA_HORARIA,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(ahora);

    const obtener = (tipo: string) => partes.find(p => p.type === tipo)?.value || "0";

    const anio = Number(obtener("year"));
    const mes = Number(obtener("month")) - 1;
    const dia = Number(obtener("day"));
    const hora = Number(obtener("hour"));
    const minuto = Number(obtener("minute"));
    const segundo = Number(obtener("second"));

    return new Date(anio, mes, dia, hora, minuto, segundo);
}

/**
 * Retorna la fecha actual como string "YYYY-MM-DD" en la zona horaria del usuario.
 * Reemplaza `new Date().toISOString().split("T")[0]` que usa UTC.
 */
export function obtenerFechaISOLocal(): string {
    const ahora = new Date();
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: ZONA_HORARIA,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(ahora);
}

/**
 * Convierte un string "YYYY-MM-DD" al inicio del día (00:00:00.000) como Date UTC.
 * Consistente para queries de Firestore.
 */
export function inicioDelDia(fechaStr: string): Date {
    const [anio, mes, dia] = fechaStr.split("-").map(Number);
    return new Date(Date.UTC(anio, mes - 1, dia, 0, 0, 0, 0));
}

/**
 * Convierte un string "YYYY-MM-DD" al final del día (23:59:59.999) como Date UTC.
 * Consistente para queries de Firestore.
 */
export function finDelDia(fechaStr: string): Date {
    const [anio, mes, dia] = fechaStr.split("-").map(Number);
    return new Date(Date.UTC(anio, mes - 1, dia, 23, 59, 59, 999));
}

/**
 * Convierte un string "YYYY-MM-DD" a mediodía UTC (12:00:00) como Date.
 * Usar para GUARDAR fechas en Firestore. El mediodía es una hora "segura"
 * que al convertir a cualquier zona horaria razonable (UTC-12 a UTC+12)
 * siempre mantiene el mismo día calendario.
 *
 * NO usar para queries de rango — usar inicioDelDia/finDelDia para eso.
 */
export function mediodiaUTC(fechaStr: string): Date {
    const [anio, mes, dia] = fechaStr.split("-").map(Number);
    return new Date(Date.UTC(anio, mes - 1, dia, 12, 0, 0, 0));
}

/**
 * Convierte un Firestore Timestamp (o Date) a string "YYYY-MM-DD"
 * en la zona horaria del usuario. Reemplaza `format(date, "yyyy-MM-dd")`
 * que usa la TZ del servidor.
 */
export function fechaAString(fecha: Date): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: ZONA_HORARIA,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(fecha);
}

/**
 * Retorna un string "YYYY-MM-DD" a partir de un Date, usando componentes locales
 * del navegador (para uso en componentes client-side).
 * Reemplaza `date.toISOString().split("T")[0]` que usa UTC.
 */
export function fechaLocalAString(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}
