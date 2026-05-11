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

        for (const log of pending) {
            try {
                const { _savedAt, ...cleanLog } = log;
                const res = await logWorkoutSession(cleanLog as WorkoutSessionData);

                if (res.success) {
                    successCount++;
                } else {
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
        if (typeof window === "undefined") return;

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

        const handleSwMessage = (event: MessageEvent) => {
            if (event.data?.type === "SYNC_PENDING_LOGS") {
                syncPendingLogs();
            }
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        navigator.serviceWorker?.addEventListener("message", handleSwMessage);

        if (navigator.onLine) {
            syncPendingLogs();
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
        };
    }, []);

    const saveLogLocally = (logData: WorkoutSessionData) => {
        try {
            const pending = JSON.parse(localStorage.getItem("gymia_pending_logs") || "[]");
            const logWithMeta = { ...logData, _savedAt: Date.now() };
            pending.push(logWithMeta);
            localStorage.setItem("gymia_pending_logs", JSON.stringify(pending));

            registrarBackgroundSync();

            return true;
        } catch (e) {
            console.error("Error saving locally", e);
            return false;
        }
    };

    return { isOnline, saveLogLocally };
}

async function registrarBackgroundSync() {
    if (!("serviceWorker" in navigator)) return;

    try {
        const registration = await navigator.serviceWorker.ready;
        if ("sync" in registration) {
            await (registration as any).sync.register("sync-pending-logs");
        }
    } catch {
        // Background Sync no soportado
    }
}
