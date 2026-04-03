"use client";

import { Trophy, Dumbbell } from "lucide-react";
import { ClientMotionDiv } from "@/components/ui/client-motion";
import type { PersonalRecord } from "@/lib/progress-types";

interface ExerciseRecordsSectionProps {
    prs: PersonalRecord[];
}

export function ExerciseRecordsSection({ prs }: ExerciseRecordsSectionProps) {
    return (
        <div id="exercises-weight-section" className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl overflow-hidden shadow-2xl scroll-mt-24 relative">
            <div className="absolute inset-0 bg-linear-to-b from-blue-600/5 to-transparent pointer-events-none" />

            <div className="border-b border-white/5 p-8 flex items-center justify-between bg-black/20 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-xl">
                        <Trophy className="h-7 w-7 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Biblioteca de Récords</h3>
                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] italic">Potencia Máxima Registrada</p>
                    </div>
                </div>
            </div>

            {prs && prs.length > 0 ? (
                <div className="divide-y divide-white/5 relative z-10">
                    {prs.map((pr, i) => (
                        <ClientMotionDiv
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 md:p-8 flex items-center justify-between hover:bg-white/5 transition-all group"
                        >
                            <div className="flex items-center gap-6 flex-1 min-w-0">
                                <div className="h-14 w-14 bg-neutral-950/50 rounded-2xl shrink-0 flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-all shadow-lg">
                                    <Dumbbell className="h-6 w-6 text-neutral-700 group-hover:text-blue-500 transition-colors" />
                                </div>
                                <div className="min-w-0 space-y-1">
                                    <h4 className="font-black text-white text-lg uppercase italic tracking-tight truncate group-hover:text-blue-500 transition-colors">{pr.exercise}</h4>
                                    <div className="flex items-center gap-4">
                                        <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.2em] italic">{pr.date}</p>
                                        <div className="h-1 w-1 rounded-full bg-neutral-800" />
                                        <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em] italic">
                                            {pr.reps} REPS {pr.rpe ? `• RPE ${pr.rpe}` : ""}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right shrink-0 ml-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="font-black text-4xl text-white tracking-tighter italic leading-none">{pr.weight}</span>
                                    <span className="text-[10px] font-black text-neutral-600 uppercase italic">KG</span>
                                </div>
                                <p className="text-[8px] uppercase tracking-[0.3em] text-blue-500/50 font-black mt-2 italic">Peak Load</p>
                            </div>
                        </ClientMotionDiv>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-neutral-600 flex flex-col items-center gap-6 relative z-10">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                        <Trophy className="h-10 w-10 text-neutral-700" />
                    </div>
                    <div className="space-y-2">
                        <p className="font-black uppercase tracking-widest text-xs italic">Sin registros de potencia máxima</p>
                        <p className="text-[10px] font-bold text-neutral-700 italic uppercase tracking-wider">La base de datos técnica está vacía.</p>
                    </div>
                </div>
            )}
        </div>
    );
}