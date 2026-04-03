"use client";

import { Trophy, Calendar } from "lucide-react";
import type { PersonalRecord } from "@/lib/progress-types";

interface PersonalRecordsCardProps {
    prs: PersonalRecord[];
}

export function PersonalRecordsCard({ prs }: PersonalRecordsCardProps) {
    if (!prs || prs.length === 0) {
        return (
            <div className="bg-neutral-900/30 border border-white/5 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-amber-600/10 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Récords Personales</p>
                </div>
                <p className="text-neutral-500 text-sm text-center py-4">No hay récords registrados aún</p>
            </div>
        );
    }

    return (
        <div className="bg-neutral-900/30 border border-white/5 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-600/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Récords Personales</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prs.slice(0, 6).map((pr, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-neutral-950/50 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center text-amber-500 font-black text-xs">
                                {index + 1}
                            </div>
                            <div>
                                <p className="text-sm font-black text-white uppercase italic truncate max-w-[120px]">{pr.exercise}</p>
                                <p className="text-xs font-bold text-neutral-500">{pr.reps ? `${pr.reps} reps` : ''} {pr.rpe ? `@RPE ${pr.rpe}` : ''}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-black text-white">{pr.weight}</p>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase">kg</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}