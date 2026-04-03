"use client";

import { Dumbbell, CheckCircle2, Moon, Clock, Flame, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Assignment, LogDelDia } from "./schedule-calendar-types";

interface DayDetailPanelProps {
    assignment?: Assignment;
    logs: LogDelDia[];
    isRecorded: boolean;
    isRest: boolean;
    onStartWorkout?: () => void;
    onViewLog?: () => void;
    onLogRetroactive?: () => void;
}

export function DayDetailPanel({ assignment, logs, isRecorded, isRest, onStartWorkout, onViewLog, onLogRetroactive }: DayDetailPanelProps) {
    if (!assignment && !isRecorded && !isRest) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-neutral-900/50 flex items-center justify-center border border-white/5">
                    <CalendarIcon className="h-8 w-8 text-neutral-700" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-white uppercase italic">Día Libre</h3>
                    <p className="text-sm text-neutral-500 font-bold mt-1">Sin entrenamiento programado</p>
                </div>
                {onLogRetroactive && (
                    <button
                        onClick={onLogRetroactive}
                        className="text-xs font-black text-neutral-500 uppercase tracking-widest hover:text-white transition-colors"
                    >
                        + Registrar entrenamiento
                    </button>
                )}
            </div>
        );
    }

    if (isRest) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="h-16 w-16 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                    <Moon className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-white uppercase italic">Día de Descanso</h3>
                    <p className="text-sm text-neutral-500 font-bold mt-1">Recuperación activa</p>
                </div>
            </div>
        );
    }

    if (isRecorded && logs.length > 0) {
        const log = logs[0];
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-600/10 flex items-center justify-center border border-emerald-500/20">
                        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase italic">{log.routineName}</h3>
                        <div className="flex items-center gap-3 mt-1">
                            {log.durationMinutes > 0 && (
                                <div className="flex items-center gap-1 text-xs text-neutral-500 font-bold">
                                    <Clock className="w-3 h-3" />
                                    {log.durationMinutes} min
                                </div>
                            )}
                            {log.sessionRpe && (
                                <div className="flex items-center gap-1 text-xs text-neutral-500 font-bold">
                                    <Flame className="w-3 h-3" />
                                    RPE {log.sessionRpe}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Ejercicios realizados</p>
                    <div className="space-y-2">
                        {log.exercises.slice(0, 5).map((ex, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="h-7 w-7 rounded-lg bg-neutral-950 flex items-center justify-center">
                                        <Dumbbell className="w-4 h-4 text-neutral-600" />
                                    </div>
                                    <span className="text-sm font-bold text-neutral-300">{ex.exerciseName}</span>
                                </div>
                                <span className="text-xs text-neutral-500 font-black">
                                    {ex.sets.filter(s => s.completed).length} series
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {onViewLog && (
                    <button
                        onClick={onViewLog}
                        className="w-full h-12 bg-neutral-900/50 border border-white/5 rounded-xl text-neutral-400 font-black text-xs uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                    >
                        Ver Detalles
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }

    if (assignment) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-red-600/10 flex items-center justify-center border border-red-500/20 animate-pulse">
                        <Dumbbell className="h-7 w-7 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase italic">{assignment.routineName}</h3>
                        <p className="text-sm text-neutral-500 font-bold mt-1">{assignment.dayName}</p>
                    </div>
                </div>

                {onStartWorkout && (
                    <button
                        onClick={onStartWorkout}
                        className="w-full h-14 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all shadow-xl shadow-white/5"
                    >
                        Iniciar Entrenamiento
                    </button>
                )}

                {onLogRetroactive && (
                    <button
                        onClick={onLogRetroactive}
                        className="w-full h-10 bg-neutral-900/50 border border-white/5 rounded-xl text-neutral-500 font-black text-xs uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all"
                    >
                        + Registrar sin iniciar
                    </button>
                )}
            </div>
        );
    }

    return null;
}