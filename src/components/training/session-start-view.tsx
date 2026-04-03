"use client";

import { Button } from "@/components/ui/button";
import { ClientMotionDiv } from "@/components/ui/client-motion";
import { Play, Dumbbell } from "lucide-react";

interface SessionStartViewProps {
    routineName: string;
    dayName: string;
    exercises: { exerciseName: string }[];
    onStart: () => void;
    onBack: () => void;
    isFreeWorkout?: boolean;
}

export function SessionStartView({
    routineName,
    dayName,
    exercises,
    onStart,
    onBack,
    isFreeWorkout,
}: SessionStartViewProps) {
    const cleanRoutineName = routineName.replace(/\(assigned\)/i, '').trim();

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 space-y-8 pb-32 animate-in fade-in duration-500">
            <ClientMotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-3"
            >
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                    {cleanRoutineName}
                </h1>
                <div className="flex items-center justify-center gap-3">
                    <div className="h-px w-8 bg-red-600/30" />
                    <p className="text-sm md:text-base font-black text-red-500 uppercase tracking-[0.4em] italic">
                        {dayName}
                    </p>
                    <div className="h-px w-8 bg-red-600/30" />
                </div>
            </ClientMotionDiv>

            <ClientMotionDiv
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-md bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl p-8 space-y-8 relative overflow-hidden group shadow-2xl"
            >
                <div className="absolute inset-0 bg-linear-to-br from-red-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3 text-neutral-400">
                        <Play className="w-5 h-5 text-red-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sesión de Entrenamiento</span>
                    </div>
                    <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">{exercises.length} Ejercicios</span>
                </div>

                <div className="space-y-4 relative z-10">
                    {exercises.length === 0 ? (
                        <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                            <Dumbbell className="w-10 h-10 text-neutral-800" />
                            <p className="text-neutral-500 font-bold text-sm tracking-tight">Sesión en blanco lista.</p>
                            <p className="text-neutral-600 text-[10px] uppercase font-black tracking-widest px-4">
                                Podrás agregar ejercicios libremente al iniciar.
                            </p>
                        </div>
                    ) : (
                        exercises.map((ex, i) => (
                            <div key={i} className="flex items-center gap-4 group/item">
                                <div className="h-8 w-8 rounded-xl bg-neutral-950 border border-white/5 flex items-center justify-center text-[10px] font-black text-neutral-600 group-hover/item:text-red-500 group-hover/item:border-red-600/30 transition-all duration-300">
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                <span className="text-neutral-400 font-bold text-sm tracking-tight group-hover/item:text-white transition-colors">
                                    {ex.exerciseName}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </ClientMotionDiv>

            <div className="w-full max-w-md pt-4">
                <Button
                    onClick={onStart}
                    className="w-full h-16 text-xl font-black italic bg-white text-black hover:bg-neutral-200 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                    <Play className="w-6 h-6 mr-2 fill-black" />
                    INICIAR
                </Button>
                <Button
                    variant="ghost"
                    onClick={onBack}
                    className="w-full mt-4 text-neutral-500 hover:text-white cursor-pointer"
                >
                    Volver
                </Button>
            </div>
        </div>
    );
}