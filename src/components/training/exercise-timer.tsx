"use client";

import { Button } from "@/components/ui/button";
import { Timer, Play, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExerciseTimer } from "./hooks/use-exercise-timer";

interface ExerciseTimerProps {
    duracionSegundos: number;
    onComplete: () => void;
    className?: string;
}

export function ExerciseTimer({ duracionSegundos, onComplete, className }: ExerciseTimerProps) {
    const { tiempoRestante, estaCorriendo, completado, iniciar, reiniciar, formatTime, progreso } = useExerciseTimer({
        duracionSegundos,
        onComplete,
    });

    const getBorderColor = () => {
        if (completado) return "border-emerald-500/50";
        if (estaCorriendo && progreso < 25) return "border-red-500/50";
        if (estaCorriendo) return "border-neutral-700";
        return "border-white/5";
    };

    const getBgGlow = () => {
        if (completado) return "bg-emerald-600/10";
        if (estaCorriendo && progreso < 25) return "bg-red-600/10";
        if (estaCorriendo) return "bg-neutral-900/40";
        return "bg-neutral-900/40";
    };

    return (
        <div className={cn("rounded-3xl border p-6 space-y-4 relative overflow-hidden", getBorderColor(), getBgGlow(), className)}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center border",
                        completado ? "bg-emerald-500/20 border-emerald-500/30" :
                        estaCorriendo ? "bg-red-500/20 border-red-500/30" :
                        "bg-neutral-800 border-white/5"
                    )}>
                        {completado ? (
                            <Check className="w-6 h-6 text-emerald-500" />
                        ) : (
                            <Timer className={cn("w-6 h-6", estaCorriendo ? "text-red-500 animate-pulse" : "text-neutral-500")} />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-black text-white uppercase italic tracking-tighter">
                            {duracionSegundos}s
                        </p>
                        <p className="text-[10px] text-neutral-500 font-medium">
                            {completado ? "Completado" : estaCorriendo ? "En ejecución" : "Listo para iniciar"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!completado && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={reiniciar}
                            disabled={estaCorriendo}
                            className="h-10 w-10 rounded-xl text-neutral-500 hover:text-white border border-white/5 hover:bg-white/10 disabled:opacity-30"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    )}
                    <Button
                        onClick={iniciar}
                        disabled={completado || estaCorriendo}
                        className={cn(
                            "h-10 px-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all",
                            completado
                                ? "bg-emerald-600 text-white border-emerald-500 cursor-default"
                                : estaCorriendo
                                    ? "bg-neutral-800 text-neutral-400 cursor-default"
                                    : "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/30"
                        )}
                    >
                        {completado ? (
                            <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Hecho</span>
                        ) : estaCorriendo ? (
                            <span className="flex items-center gap-1"><Timer className="w-3 h-3 animate-spin" /> {formatTime}</span>
                        ) : (
                            <span className="flex items-center gap-1"><Play className="w-3 h-3" /> Iniciar</span>
                        )}
                    </Button>
                </div>
            </div>

            {estaCorriendo && (
                <div className="relative z-10">
                    <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-1000 ease-linear",
                                progreso < 25 ? "bg-red-500" : progreso < 50 ? "bg-orange-500" : "bg-amber-500"
                            )}
                            style={{ width: `${100 - progreso}%` }}
                        />
                    </div>
                    <div className="text-center mt-3">
                        <span className={cn(
                            "text-3xl md:text-4xl font-black italic tabular-nums",
                            progreso < 25 ? "text-red-400" : "text-white"
                        )}>
                            {formatTime}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
