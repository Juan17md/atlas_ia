"use client";

import { Button } from "@/components/ui/button";
import { Plus, Dumbbell, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface FreeWorkoutViewProps {
    elapsedTime: number;
    formatTime: (seconds: number) => string;
    isStarted: boolean;
    onCancel: () => void;
    onFinish: () => void;
    onAddExercise: () => void;
    showExerciseSelector: boolean;
    onOpenExerciseSelector: () => void;
}

export function FreeWorkoutView({
    elapsedTime,
    formatTime,
    isStarted,
    onCancel,
    onFinish,
    onAddExercise,
    showExerciseSelector,
    onOpenExerciseSelector,
}: FreeWorkoutViewProps) {
    return (
        <div className="max-w-3xl mx-auto pb-24 space-y-6 pt-4">
            <div className={cn(
                "sticky top-0 z-30 bg-black/40 backdrop-blur-3xl border-b border-white/5 py-4 px-4 -mx-4 md:rounded-b-4xl md:mx-0 shadow-2xl transition-all duration-300",
                showExerciseSelector && "opacity-0 pointer-events-none"
            )}>
                <div className="flex justify-between items-center max-w-3xl mx-auto gap-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-white tracking-tight truncate uppercase italic">
                            Rutina Libre
                        </h2>
                    </div>
                    <div className="flex gap-2 items-center shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/50 rounded-xl border border-white/5">
                            <Clock className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                            <span className="text-xs font-black text-white italic tracking-widest">{formatTime(elapsedTime)}</span>
                        </div>
                        <Button
                            onClick={onCancel}
                            variant="ghost"
                            className="text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all h-9 px-3"
                        >
                            Abortar
                        </Button>
                        <Button
                            onClick={onFinish}
                            className="hidden lg:flex rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all h-9 px-4 shadow-lg shadow-white/5"
                        >
                            Finalizar
                        </Button>
                    </div>
                </div>
            </div>

            <div className={cn(
                "py-20 flex flex-col items-center justify-center text-center space-y-6 border border-dashed border-white/10 rounded-3xl bg-neutral-900/20 transition-opacity duration-300",
                showExerciseSelector && "opacity-0 pointer-events-none"
            )}>
                <Dumbbell className="w-16 h-16 text-neutral-800" />
                <div className="space-y-2 max-w-xs">
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Sesión Vacía</h3>
                    <p className="text-xs text-neutral-500 font-bold">Inicia tu entrenamiento añadiendo el primer ejercicio de tu rutina libre.</p>
                </div>
                <Button
                    onClick={onAddExercise}
                    className="h-14 px-8 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl group"
                >
                    <Plus className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                    Agregar Ejercicio
                </Button>
            </div>
        </div>
    );
}