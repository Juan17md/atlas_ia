"use client";

import { useState, useMemo, useRef } from "react";
import { TrendingUp, TrendingDown, Minus, Search, X, Dumbbell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExerciseStrengthHistory, StrengthDataPoint } from "@/actions/analytics-actions";

interface StrengthChartsProps {
    exercises: ExerciseStrengthHistory[];
    overallProgress: number;
}

const CHART_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
    "#8b5cf6", "#ec4899", "#f43f5e", "#14b8a6", "#6366f1",
];

function ChangeIndicator({ value }: { value: number }) {
    if (value > 0) {
        return (
            <div className="flex items-center gap-1 text-green-500">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-xs font-black">+{value}%</span>
            </div>
        );
    }
    if (value < 0) {
        return (
            <div className="flex items-center gap-1 text-red-500">
                <TrendingDown className="h-3.5 w-3.5" />
                <span className="text-xs font-black">{value}%</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1 text-neutral-500">
            <Minus className="h-3.5 w-3.5" />
            <span className="text-xs font-black">0%</span>
        </div>
    );
}

function SvgAreaChart({ data, color, id }: { data: StrengthDataPoint[]; color: string; id: string }) {
    const [tooltip, setTooltip] = useState<{ x: number; data: StrengthDataPoint } | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    const W = 300;
    const H = 180;
    const pad = { top: 10, right: 10, bottom: 25, left: 35 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const values = data.map(d => d.e1rm);
    const minY = Math.min(...values) * 0.9;
    const maxY = Math.max(...values) * 1.1;
    const range = maxY - minY || 1;

    const points = data.map((d, i) => {
        const x = pad.left + (i / Math.max(data.length - 1, 1)) * chartW;
        const y = pad.top + chartH - ((d.e1rm - minY) / range) * chartH;
        return { x, y, ...d };
    });

    const lineD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const areaD = lineD + ` L${points[points.length - 1]?.x || pad.left},${pad.top + chartH} L${points[0]?.x || pad.left},${pad.top + chartH} Z`;

    const yTicks = 4;
    const yLabels = Array.from({ length: yTicks }, (_, i) => {
        const val = minY + (range / (yTicks - 1)) * (yTicks - 1 - i);
        return { y: pad.top + (i / (yTicks - 1)) * chartH, label: Math.round(val) };
    });

    const xTicks = Math.min(data.length, 5);
    const xStep = Math.max(Math.floor(data.length / xTicks), 1);
    const xLabels = data.filter((_, i) => i % xStep === 0 || i === data.length - 1);

    return (
        <div ref={ref} className="h-48 relative z-10">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id={`areaGrad-${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                {yLabels.map((t, i) => (
                    <g key={i}>
                        <line x1={pad.left} y1={t.y} x2={W - pad.right} y2={t.y} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                        <text x={pad.left - 4} y={t.y + 3} textAnchor="end" fill="#525252" fontSize={9} fontWeight={700}>
                            {t.label}
                        </text>
                    </g>
                ))}

                {xLabels.map((d, i) => {
                    const idx = data.indexOf(d);
                    const x = pad.left + (idx / Math.max(data.length - 1, 1)) * chartW;
                    return (
                        <text key={i} x={x} y={H - 4} textAnchor="middle" fill="#525252" fontSize={9} fontWeight={700}>
                            {d.date}
                        </text>
                    );
                })}

                <path d={areaD} fill={`url(#areaGrad-${id})`} opacity={0.3} />
                <path d={lineD} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" />

                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={3}
                        fill={color}
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth={2}
                        className="cursor-pointer hover:r-5 transition-all"
                        onMouseEnter={(e) => {
                            const rect = ref.current?.getBoundingClientRect();
                            if (rect) {
                                const relX = (p.x / W) * rect.width;
                                setTooltip({ x: relX, data: { date: p.date, e1rm: p.e1rm, weight: p.weight, reps: p.reps, rpe: p.rpe } });
                            }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                    />
                ))}
            </svg>

            {tooltip && (
                <div
                    className="absolute bottom-full mb-2 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl min-w-[140px] pointer-events-none"
                    style={{ left: Math.min(tooltip.x, 200), transform: "translateX(-50%)" }}
                >
                    <p className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-2">{tooltip.data.date}</p>
                    <div className="space-y-1">
                        <div className="flex justify-between gap-4">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase">E1RM</span>
                            <span className="text-sm font-black text-white">{tooltip.data.e1rm}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase">Peso</span>
                            <span className="text-xs font-bold text-neutral-300">{tooltip.data.weight}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase">Reps</span>
                            <span className="text-xs font-bold text-neutral-300">{tooltip.data.reps}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function StrengthCharts({ exercises, overallProgress }: StrengthChartsProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredExercises = useMemo(() => {
        if (!searchTerm.trim()) return exercises;
        const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const term = normalize(searchTerm);
        return exercises.filter(ex => normalize(ex.exerciseName).includes(term));
    }, [exercises, searchTerm]);

    if (exercises.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-24 h-24 bg-neutral-900/50 rounded-3xl flex items-center justify-center mb-8 border border-white/5">
                    <Dumbbell className="w-10 h-10 text-neutral-700" />
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-3">Sin Datos de Fuerza</h3>
                <p className="text-neutral-500 text-sm font-medium max-w-md">
                    No hay suficientes entrenamientos registrados para mostrar la evolución. Completa al menos un entrenamiento para ver tu progreso.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-neutral-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                    <p className="text-3xl font-black text-white italic tracking-tighter">
                        {overallProgress >= 0 ? "+" : ""}{overallProgress}%
                    </p>
                    <p className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em] mt-1">Evolución Global</p>
                </div>
                <div className="bg-neutral-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                    <p className="text-3xl font-black text-white italic tracking-tighter">{exercises.length}</p>
                    <p className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em] mt-1">Ejercicios</p>
                </div>
                <div className="bg-neutral-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-center col-span-2 md:col-span-1">
                    <p className="text-3xl font-black text-white italic tracking-tighter">
                        {exercises.filter(e => e.changePercent > 0).length}
                    </p>
                    <p className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em] mt-1">En Progreso</p>
                </div>
            </div>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 group-focus-within:text-white transition-colors" />
                <Input
                    placeholder="Buscar ejercicio..."
                    className="pl-12 h-14 bg-neutral-900/30 backdrop-blur-xl border-white/5 rounded-2xl text-white placeholder:text-neutral-500 focus-visible:ring-0 text-base font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-neutral-500 hover:text-white rounded-full hover:bg-white/10"
                        onClick={() => setSearchTerm("")}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredExercises.map((exercise, i) => {
                    const color = CHART_COLORS[i % CHART_COLORS.length];

                    return (
                        <div
                            key={exercise.exerciseName}
                            className="bg-neutral-900/20 backdrop-blur-xl border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all group shadow-xl relative overflow-hidden"
                        >
                            <div
                                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none opacity-10"
                                style={{ backgroundColor: color }}
                            />

                            <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className="space-y-1 min-w-0 flex-1">
                                    <h3 className="font-black text-white text-base uppercase italic tracking-tight truncate">
                                        {exercise.exerciseName}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                                            {exercise.dataPoints.length} sesiones
                                        </span>
                                        <div className="h-1 w-1 rounded-full bg-neutral-700" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
                                            E1RM: {exercise.latestE1RM} KG
                                        </span>
                                    </div>
                                </div>
                                <div className="shrink-0 ml-4">
                                    <ChangeIndicator value={exercise.changePercent} />
                                </div>
                            </div>

                            <SvgAreaChart data={exercise.dataPoints} color={color} id={`${i}`} />
                        </div>
                    );
                })}
            </div>

            {filteredExercises.length === 0 && searchTerm && (
                <div className="text-center py-16 text-neutral-600">
                    <p className="font-black uppercase tracking-widest text-xs italic">Sin resultados para &quot;{searchTerm}&quot;</p>
                </div>
            )}
        </div>
    );
}
