"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseRestTimerOptions {
    restSeconds: number;
    onComplete?: () => void;
    autoStart?: boolean;
}

export function useRestTimer({ restSeconds, onComplete, autoStart = false }: UseRestTimerOptions) {
    const [tiempoRestante, setTiempoRestante] = useState(restSeconds);
    const [estaCorriendo, setEstaCorriendo] = useState(autoStart);
    const [estaPausado, setEstaPausado] = useState(false);
    const intervaloRef = useRef<NodeJS.Timeout | null>(null);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        setTiempoRestante(restSeconds);
        if (autoStart) {
            setEstaCorriendo(true);
            setEstaPausado(false);
        }
    }, [restSeconds, autoStart]);

    useEffect(() => {
        if (!estaCorriendo || estaPausado) {
            if (intervaloRef.current) {
                clearInterval(intervaloRef.current);
                intervaloRef.current = null;
            }
            return;
        }

        intervaloRef.current = setInterval(() => {
            setTiempoRestante((prev) => {
                if (prev <= 1) {
                    setEstaCorriendo(false);
                    onCompleteRef.current?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervaloRef.current) {
                clearInterval(intervaloRef.current);
                intervaloRef.current = null;
            }
        };
    }, [estaCorriendo, estaPausado]);

    const iniciar = useCallback(() => {
        setTiempoRestante(restSeconds);
        setEstaCorriendo(true);
        setEstaPausado(false);
    }, [restSeconds]);

    const saltar = useCallback(() => {
        setTiempoRestante(0);
        setEstaCorriendo(false);
        setEstaPausado(false);
        onCompleteRef.current?.();
    }, []);

    const pausar = useCallback(() => {
        setEstaPausado(true);
    }, []);

    const reanudar = useCallback(() => {
        setEstaPausado(false);
    }, []);

    const formatTime = (segundos: number) => {
        const mins = Math.floor(segundos / 60);
        const secs = segundos % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progreso = restSeconds > 0 ? (tiempoRestante / restSeconds) * 100 : 0;

    return {
        tiempoRestante,
        estaCorriendo,
        estaPausado,
        iniciar,
        saltar,
        pausar,
        reanudar,
        formatTime: formatTime(tiempoRestante),
        progreso,
    };
}
