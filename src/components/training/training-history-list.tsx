"use client";

import { ChevronDown, ChevronUp, Clock, Dumbbell, Flame, MessageSquare, Zap, Activity, Trophy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// --- INTERFACES ---

import type { TrainingSetData, TrainingExerciseData, TrainingLogData } from "@/types";

interface TrainingHistoryListProps {
    logs: TrainingLogData[];
}

function WorkoutLogItem({ log }: { log: TrainingLogData }) {
    const [expanded, setExpanded] = useState(false);

    // Calculate summary stats
    const totalVolume = log.exercises?.reduce((acc: number, ex: TrainingExerciseData) => {
        return acc + ex.sets.reduce((sAcc: number, s: TrainingSetData) => sAcc + ((s.weight || 0) * (s.reps || 0)), 0);
    }, 0) || 0;

    const totalSets = log.exercises?.reduce((acc: number, ex: TrainingExerciseData) => acc + ex.sets.length, 0) || 0;
    const completedSets = log.exercises?.reduce((acc: number, ex: TrainingExerciseData) =>
        acc + ex.sets.filter((s: TrainingSetData) => s.completed).length, 0) || 0;

    const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    const dateObj = new Date(log.date);

    return (
        <div className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl overflow-hidden hover:border-red-600/30 transition-all duration-500 group shadow-2xl relative">
            <div className="absolute inset-0 bg-linear-to-br from-white/2 to-transparent pointer-events-none" />

            {/* Header - Clickable */}
            <div
                className="p-4 md:p-8 flex items-center justify-between cursor-pointer relative z-10"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-6 md:gap-8">
                    {/* Date Block */}
                    <div className="h-14 w-14 md:h-20 md:w-20 rounded-xl md:rounded-3xl bg-neutral-950 border border-white/5 flex flex-col items-center justify-center shadow-2xl group-hover:border-red-600/50 transition-all duration-500 shrink-0 relative overflow-hidden group/date">
                        <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover/date:opacity-100 transition-opacity duration-500" />
                        <span className="text-xl md:text-3xl font-black text-white leading-none tracking-tighter italic relative z-10">
                            {dateObj.getDate()}
                        </span>
                        <span className="text-[9px] md:text-[11px] uppercase tracking-[0.2em] text-red-500 font-black mt-1 md:mt-2 relative z-10">
                            {dateObj.toLocaleDateString('es', { month: 'short' }).toUpperCase()}
                        </span>
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-2 md:gap-x-3 gap-y-1 mb-1 md:mb-3">
                            <h4 className="font-black text-white text-lg md:text-2xl tracking-tighter uppercase italic truncate leading-none">
                                {log.routineName || "PROTOCOL_ALPHA"}
                            </h4>
                            {log.routineId && (
                                <div className="h-5 px-3 rounded-full bg-red-600/10 border border-red-600/20 flex items-center">
                                    <span className="text-red-500 text-[9px] font-black uppercase tracking-widest">RUTINA</span>
                                </div>
                            )}
                        </div>

                        {/* Stats Row */}
                        <div className="flex flex-wrap gap-4 text-[10px] md:text-xs text-neutral-500 font-black uppercase tracking-widest">
                            <span className="flex items-center gap-2 group-hover:text-white transition-colors">
                                <Activity className="w-3.5 h-3.5 text-red-500" />
                                {log.exercises?.length || 0} <span className="text-neutral-700">MODS</span>
                            </span>
                            <span className="flex items-center gap-2 group-hover:text-white transition-colors">
                                <Flame className="w-3.5 h-3.5 text-amber-500" />
                                {Math.round(totalVolume).toLocaleString()} <span className="text-neutral-700">KG</span>
                            </span>
                            <span className="flex items-center gap-2 group-hover:text-white transition-colors">
                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                {log.durationMinutes || "0"} <span className="text-neutral-700">MIN</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right side - Completion & Expand */}
                <div className="flex items-center gap-6 pl-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <div className={cn(
                            "text-2xl md:text-3xl font-black tabular-nums italic leading-none",
                            completionRate >= 90 ? "text-emerald-500" : completionRate >= 50 ? "text-amber-500" : "text-red-500"
                        )}>
                            {completionRate}%
                        </div>
                        <span className="text-[9px] text-neutral-600 uppercase tracking-[0.2em] font-black mt-1">Status</span>
                    </div>

                    <div className="h-12 w-12 rounded-2xl bg-neutral-950 border border-white/5 flex items-center justify-center text-neutral-500 group-hover:text-white group-hover:border-red-600/30 transition-all duration-500">
                        <motion.div
                            animate={{ rotate: expanded ? 180 : 0 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        >
                            <ChevronDown className="w-6 h-6" />
                        </motion.div>
                    </div>
                </div>
            </div >

            {/* Expanded Content */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-white/5 bg-white/2 p-4 md:p-10 space-y-6 md:space-y-10 relative">
                            {/* Session Feedback */}
                            {log.sessionFeedback && (
                                <div className="flex gap-4 bg-red-600/5 group/feedback p-6 rounded-3xl border border-red-600/10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover/feedback:opacity-100 transition-opacity" />
                                    <MessageSquare className="w-5 h-5 text-red-500 shrink-0 mt-1 relative z-10" />
                                    <p className="text-base text-neutral-200 italic font-medium leading-relaxed relative z-10">&quot;{log.sessionFeedback}&quot;</p>
                                </div>
                            )}

                            {/* Exercises List */}
                            <div className="space-y-6">
                                {log.exercises?.map((ex: TrainingExerciseData, i: number) => (
                                    <div key={i} className="bg-black/40 backdrop-blur-md rounded-2xl md:rounded-3xl p-4 md:p-8 border border-white/5 hover:border-white/10 transition-colors group/ex">
                                        <div className="flex justify-between items-end mb-8">
                                            <div className="flex items-center gap-5">
                                                <div className="h-10 w-10 rounded-xl bg-neutral-900 border border-white/5 flex items-center justify-center text-neutral-500 text-xs font-black italic group-hover/ex:text-red-500 transition-colors">
                                                    {String(i + 1).padStart(2, '0')}
                                                </div>
                                                <div>
                                                    <h5 className="font-black text-white text-base md:text-xl uppercase italic tracking-tight">{ex.exerciseName}</h5>
                                                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mt-0.5">MOD_EXECUTION_SEQUENCE</p>
                                                </div>
                                            </div>
                                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest leading-none">{ex.sets.length} VOL_UNITS</span>
                                        </div>

                                        {/* Sets Matrix */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                            {ex.sets.map((set: TrainingSetData, j: number) => (
                                                <div
                                                    key={j}
                                                    className={cn(
                                                        "p-3 md:p-4 rounded-xl md:rounded-2xl text-center border transition-all duration-300 relative group/set overflow-hidden",
                                                        set.completed
                                                            ? "bg-red-600/10 border-red-600/30"
                                                            : "bg-neutral-950 border-white/5"
                                                    )}
                                                >
                                                    {set.completed && (
                                                        <div className="absolute inset-0 bg-red-600/5 blur-xl pointer-events-none" />
                                                    )}
                                                    <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.2em] mb-2 relative z-10">SET_{j + 1}</p>
                                                    <div className="flex items-center justify-center gap-1.5 relative z-10">
                                                        <p className={cn(
                                                            "font-black text-lg italic leading-none",
                                                            set.completed ? "text-white" : "text-neutral-500"
                                                        )}>
                                                            {set.weight}
                                                        </p>
                                                        <span className="text-[10px] font-black text-neutral-700 uppercase italic">KG</span>
                                                        <span className="text-neutral-800 text-xs font-black">/</span>
                                                        <p className={cn(
                                                            "font-black text-lg italic leading-none",
                                                            set.completed ? "text-red-500" : "text-neutral-500"
                                                        )}>
                                                            {set.reps}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {ex.feedback && (
                                            <div className="mt-8 flex gap-3 items-start pl-4 border-l-2 border-red-600/30">
                                                <p className="text-xs text-neutral-500 font-medium leading-relaxed italic">
                                                    {ex.feedback}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}

export function TrainingHistoryList({ logs }: TrainingHistoryListProps) {
    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 md:py-32 text-center bg-neutral-900/20 backdrop-blur-3xl rounded-4xl border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-[100px] pointer-events-none" />
                <div className="w-24 h-24 bg-neutral-950 border border-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Dumbbell className="w-10 h-10 text-neutral-700 group-hover:text-red-500 transition-colors" />
                </div>
                <h3 className="text-3xl font-black text-white px-2 uppercase italic tracking-tighter mb-4">Núcleo Vacío</h3>
                <p className="text-neutral-500 font-medium text-sm max-w-sm px-4 leading-relaxed tracking-tight">
                    No tienes entrenamientos registrados aún. ¡Comienza a entrenar para ver tu historial!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 mb-10">
            {logs.map((log) => (
                <WorkoutLogItem key={log.id} log={log} />
            ))}
        </div>
    );
}
