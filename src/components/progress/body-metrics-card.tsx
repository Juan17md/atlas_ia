"use client";

import { Scale, Ruler, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BodyMetrics } from "@/lib/progress-types";

interface BodyMetricsCardProps {
    metrics: BodyMetrics | null;
    showLogDialog?: boolean;
    onLogClick?: () => void;
}

export function BodyMetricsCard({ metrics, onLogClick }: BodyMetricsCardProps) {
    if (!metrics) {
        return (
            <div className="bg-neutral-900/30 border border-white/5 rounded-3xl p-6">
                <p className="text-neutral-500 text-center">No hay datos disponibles</p>
            </div>
        );
    }

    const weightDiff = metrics.weight - metrics.startWeight;
    const isWeightDown = weightDiff < 0;

    return (
        <div className="bg-neutral-900/30 border border-white/5 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Peso Actual</p>
                        <p className="text-2xl font-black text-white italic">{metrics.weight} <span className="text-sm text-neutral-500">kg</span></p>
                    </div>
                </div>
                {metrics.startWeight > 0 && (
                    <div className={cn(
                        "flex items-center gap-1 px-3 py-1 rounded-xl",
                        isWeightDown ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                    )}>
                        {isWeightDown ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                        <span className="text-xs font-black">{Math.abs(weightDiff).toFixed(1)}kg</span>
                    </div>
                )}
            </div>

            {metrics.bodyFat !== null && (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-600/10 flex items-center justify-center">
                        <span className="text-amber-500 font-black text-sm">%</span>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Grasa Corporal</p>
                        <p className="text-2xl font-black text-white italic">{metrics.bodyFat}<span className="text-sm text-neutral-500">%</span></p>
                    </div>
                </div>
            )}

            {metrics.height > 0 && (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                        <Ruler className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Altura</p>
                        <p className="text-xl font-black text-white italic">{metrics.height} <span className="text-sm text-neutral-500">cm</span></p>
                    </div>
                </div>
            )}
        </div>
    );
}