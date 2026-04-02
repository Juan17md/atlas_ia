"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { logWorkoutSession, type WorkoutSessionData } from "@/actions/training-logs";

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(true);

    const syncPendingLogs = async () => {
        const pendingStr = localStorage.getItem("gymia_pending_logs");
        if (!pendingStr) return;

        const pending = JSON.parse(pendingStr);
        if (!Array.isArray(pending) || pending.length === 0) return;

        toast.info(`Sincronizando ${pending.length} entrenamientos pendientes...`);

        const failedLogs: WorkoutSessionData[] = [];
        let successCount = 0;

        // Procesar secuencialmente
        for (const log of pending) {
            try {
                // Eliminar metadatos internos antes de enviar
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { _savedAt, ...cleanLog } = log;
                const res = await logWorkoutSession(cleanLog as WorkoutSessionData);

                if (res.success) {
                    successCount++;
                } else {
                    // Si falló por lógica de negocio, lo guardamos para reintentar (podría ser temporal)
                    console.error("Sync failed for log:", res.error);
                    failedLogs.push(log);
                }
            } catch (error) {
                console.error("Network error during sync", error);
                failedLogs.push(log);
            }
        }

        if (successCount > 0) {
            toast.success(`${successCount} entrenamientos sincronizados.`);
        }

        if (failedLogs.length > 0) {
            localStorage.setItem("gymia_pending_logs", JSON.stringify(failedLogs));
        } else {
            localStorage.removeItem("gymia_pending_logs");
        }
    };

    useEffect(() => {
        // Inicializar estado (asegurar que estamos en cliente)
        if (typeof window !== 'undefined') {
            setIsOnline(navigator.onLine);

            const handleOnline = () => {
                setIsOnline(true);
                toast.success("Conexión restaurada");
                syncPendingLogs();
            };
            const handleOffline = () => {
                setIsOnline(false);
                toast.warning("Sin conexión. Modo Offline activado.");
            };

            window.addEventListener("online", handleOnline);
            window.addEventListener("offline", handleOffline);

            // Sync inicial si hay red
            if (navigator.onLine) {
                syncPendingLogs();
            }

            return () => {
                window.removeEventListener("online", handleOnline);
                window.removeEventListener("offline", handleOffline);
            };
        }
    }, []);

    const saveLogLocally = (logData: WorkoutSessionData) => {
        try {
            const pending = JSON.parse(localStorage.getItem("gymia_pending_logs") || "[]");
            // Añadir timestamp para orden
            const logWithMeta = { ...logData, _savedAt: Date.now() };
            pending.push(logWithMeta);
            localStorage.setItem("gymia_pending_logs", JSON.stringify(pending));
            return true;
        } catch (e) {
            console.error("Error saving locally", e);
            return false;
        }
    };

    return { isOnline, saveLogLocally };
}
