"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseExerciseTimerOptions {
    duracionSegundos: number;
    onComplete?: () => void;
}

export function useExerciseTimer({ duracionSegundos, onComplete }: UseExerciseTimerOptions) {
    const [tiempoRestante, setTiempoRestante] = useState(duracionSegundos);
    const [estaCorriendo, setEstaCorriendo] = useState(false);
    const [completado, setCompletado] = useState(false);
    const intervaloRef = useRef<NodeJS.Timeout | null>(null);
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    useEffect(() => {
        setTiempoRestante(duracionSegundos);
        setCompletado(false);
        setEstaCorriendo(false);
    }, [duracionSegundos]);

    useEffect(() => {
        if (!estaCorriendo) {
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
                    setCompletado(true);
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
    }, [estaCorriendo]);

    const iniciar = useCallback(() => {
        setTiempoRestante(duracionSegundos);
        setCompletado(false);
        setEstaCorriendo(true);
    }, [duracionSegundos]);

    const detener = useCallback(() => {
        setEstaCorriendo(false);
    }, []);

    const reiniciar = useCallback(() => {
        setTiempoRestante(duracionSegundos);
        setCompletado(false);
        setEstaCorriendo(false);
    }, [duracionSegundos]);

    const formatTime = (segundos: number) => {
        const mins = Math.floor(segundos / 60);
        const secs = segundos % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const progreso = duracionSegundos > 0 ? (tiempoRestante / duracionSegundos) * 100 : 0;

    return {
        tiempoRestante,
        estaCorriendo,
        completado,
        iniciar,
        detener,
        reiniciar,
        formatTime: formatTime(tiempoRestante),
        tiempoTranscurrido: duracionSegundos - tiempoRestante,
        progreso,
    };
}
