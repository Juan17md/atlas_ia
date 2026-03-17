"use client";

import { useState, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Search, X, Dumbbell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExerciseStrengthHistory } from "@/actions/analytics-actions";

interface StrengthChartsProps {
    exercises: ExerciseStrengthHistory[];
    overallProgress: number;
}

const CHART_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
    "#8b5cf6", "#ec4899", "#f43f5e", "#14b8a6", "#6366f1",
];

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
        <div className="bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[160px]">
            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-3">{label}</p>
            <div className="space-y-2">
                <div className="flex justify-between items-baseline gap-6">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">E1RM</span>
                    <span className="text-lg font-black text-white italic">{data.e1rm}<span className="text-[9px] text-neutral-600 ml-1">KG</span></span>
                </div>
                <div className="flex justify-between items-baseline gap-6">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Peso</span>
                    <span className="text-sm font-bold text-neutral-300">{data.weight}<span className="text-[9px] text-neutral-600 ml-1">KG</span></span>
                </div>
                <div className="flex justify-between items-baseline gap-6">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Reps</span>
                    <span className="text-sm font-bold text-neutral-300">{data.reps}</span>
                </div>
                <div className="flex justify-between items-baseline gap-6">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">RPE</span>
                    <span className="text-sm font-bold text-neutral-300">{data.rpe}</span>
                </div>
            </div>
        </div>
    );
}

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
            {/* Summary Banner */}
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

            {/* Search */}
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

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredExercises.map((exercise, i) => {
                    const color = CHART_COLORS[i % CHART_COLORS.length];

                    return (
                        <div
                            key={exercise.exerciseName}
                            className="bg-neutral-900/20 backdrop-blur-xl border border-white/5 rounded-3xl p-6 hover:border-white/10 transition-all group shadow-xl relative overflow-hidden"
                        >
                            {/* Glow */}
                            <div
                                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity"
                                style={{ backgroundColor: color }}
                            />

                            {/* Header */}
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

                            {/* Chart */}
                            <div className="h-48 relative z-10">
                                 <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} aspect={undefined}>
                                    <AreaChart data={exercise.dataPoints} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="rgba(255,255,255,0.03)"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 9, fill: "#525252", fontWeight: 700 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 9, fill: "#525252", fontWeight: 700 }}
                                            axisLine={false}
                                            tickLine={false}
                                            domain={["auto", "auto"]}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="e1rm"
                                            stroke={color}
                                            strokeWidth={2.5}
                                            fill={`url(#gradient-${i})`}
                                            dot={{
                                                r: 3,
                                                fill: color,
                                                stroke: "rgba(0,0,0,0.5)",
                                                strokeWidth: 2,
                                            }}
                                            activeDot={{
                                                r: 6,
                                                fill: color,
                                                stroke: "white",
                                                strokeWidth: 2,
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
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
