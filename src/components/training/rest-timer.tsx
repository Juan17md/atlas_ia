"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Timer, SkipForward, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRestTimer } from "./hooks/use-rest-timer";

interface RestTimerProps {
    restSeconds: number;
    onSkip: () => void;
    onComplete: () => void;
    autoStart?: boolean;
    className?: string;
}

export function RestTimer({ restSeconds, onSkip, onComplete, autoStart = true, className }: RestTimerProps) {
    const { tiempoRestante, estaCorriendo, saltar, formatTime, progreso } = useRestTimer({
        restSeconds,
        onComplete,
        autoStart,
    });

    // Color según progreso
    const getColor = () => {
        if (progreso < 25) return "text-emerald-400";
        if (progreso < 50) return "text-amber-400";
        if (progreso < 75) return "text-orange-400";
        return "text-red-400";
    };

    return (
        <div className={cn("bg-neutral-900/60 backdrop-blur-xl rounded-3xl border border-white/5 p-6 space-y-4", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Coffee className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Descanso</p>
                        <p className="text-[10px] text-neutral-500 font-medium">{restSeconds}s programados</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={saltar}
                    className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-white border border-white/10 rounded-xl hover:bg-white/10"
                >
                    <SkipForward className="w-3 h-3 mr-1" />
                    Saltar
                </Button>
            </div>

            {/* Progress bar */}
            <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-linear",
                        progreso < 25 ? "bg-emerald-500" : progreso < 50 ? "bg-amber-500" : progreso < 75 ? "bg-orange-500" : "bg-red-500"
                    )}
                    style={{ width: `${100 - progreso}%` }}
                />
            </div>

            <div className="text-center">
                <span className={cn("text-4xl md:text-5xl font-black italic tabular-nums", getColor())}>
                    {formatTime}
                </span>
            </div>
        </div>
    );
}
