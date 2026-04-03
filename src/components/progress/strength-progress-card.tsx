"use client";

import { Dumbbell, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrengthProgressCardProps {
    progress: number;
}

export function StrengthProgressCard({ progress }: StrengthProgressCardProps) {
    const isPositive = progress >= 0;
    const progressAbs = Math.abs(progress);

    return (
        <div className="bg-neutral-900/30 border border-white/5 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                        <Dumbbell className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Progreso de Fuerza</p>
                        <p className="text-2xl font-black text-white italic">{progressAbs.toFixed(1)}<span className="text-sm text-neutral-500">%</span></p>
                    </div>
                </div>
                <div className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded-xl",
                    isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                )}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="text-xs font-black">{isPositive ? "Positivo" : "Negativo"}</span>
                </div>
            </div>

            <div className="h-3 bg-neutral-950 rounded-full overflow-hidden">
                <div 
                    className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isPositive ? "bg-gradient-to-r from-emerald-600 to-emerald-400" : "bg-gradient-to-r from-red-600 to-red-400"
                    )}
                    style={{ width: `${Math.min(progressAbs, 100)}%` }}
                />
            </div>

            <p className="text-xs text-neutral-500 font-bold text-center">
                Comparación con tu línea base de fuerza
            </p>
        </div>
    );
}