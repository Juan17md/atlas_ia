"use client";

import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Activity } from "lucide-react";

interface MeasurementData {
    date: Date;
    formattedDate?: string;
    [key: string]: any;
}

interface MeasurementChartProps {
    data: MeasurementData[];
    metrics: { key: string; label: string; color: string }[];
    title: string;
}

function SvgMultiLineChart({ data, metrics }: { data: any[]; metrics: { key: string; label: string; color: string }[] }) {
    const [tooltip, setTooltip] = useState<{ x: number; data: any } | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    const W = 600;
    const H = 320;
    const pad = { top: 30, right: 20, bottom: 30, left: 45 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top - pad.bottom;

    const allValues = data.flatMap(d => metrics.map(m => d[m.key]).filter((v): v is number => v != null));
    const minY = Math.min(...allValues, 0) * 0.9;
    const maxY = Math.max(...allValues, 1) * 1.1;
    const range = maxY - minY || 1;

    const lines = metrics.map(m => ({
        ...m,
        points: data.map((d, i) => {
            const x = pad.left + (i / Math.max(data.length - 1, 1)) * chartW;
            const val = d[m.key];
            const y = val != null ? pad.top + chartH - ((val - minY) / range) * chartH : null;
            return { x, y, val, date: d.formattedDate || d.date };
        }),
    }));

    const yTicks = 5;
    const yLabels = Array.from({ length: yTicks }, (_, i) => {
        const val = minY + (range / (yTicks - 1)) * (yTicks - 1 - i);
        return { y: pad.top + (i / (yTicks - 1)) * chartH, label: Math.round(val * 10) / 10 };
    });

    const xStep = Math.max(Math.floor(data.length / 6), 1);

    return (
        <div ref={ref} className="h-[350px] w-full min-w-[500px] relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {yLabels.map((t, i) => (
                    <g key={i}>
                        <line x1={pad.left} y1={t.y} x2={W - pad.right} y2={t.y} stroke="#262626" strokeDasharray="3 3" strokeOpacity={0.2} />
                        <text x={pad.left - 6} y={t.y + 3} textAnchor="end" fill="#404040" fontSize={9} fontWeight={900} fontStyle="italic">
                            {t.label}
                        </text>
                    </g>
                ))}

                {data.map((d, i) => {
                    if (i % xStep !== 0 && i !== data.length - 1) return null;
                    const x = pad.left + (i / Math.max(data.length - 1, 1)) * chartW;
                    return (
                        <text key={i} x={x} y={H - 8} textAnchor="middle" fill="#404040" fontSize={9} fontWeight={900} fontStyle="italic" className="uppercase">
                            {d.formattedDate}
                        </text>
                    );
                })}

                {lines.map((line) => {
                    const pts = line.points;
                    const lineD = pts
                        .map((p, i) => (p.y != null ? `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}` : ""))
                        .filter(Boolean)
                        .join(" ");

                    return (
                        <g key={line.key}>
                            <path d={lineD} fill="none" stroke={line.color} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
                            {pts.filter(p => p.y != null).map((p, i) => (
                                <circle
                                    key={`${line.key}-${i}`}
                                    cx={p.x}
                                    cy={p.y!}
                                    r={4}
                                    fill="#000"
                                    stroke={line.color}
                                    strokeWidth={2}
                                    className="cursor-pointer"
                                    onMouseEnter={() => {
                                        const rect = ref.current?.getBoundingClientRect();
                                        if (rect) {
                                            const idx = line.points.indexOf(p);
                                            const rowData = data[idx];
                                            setTooltip({ x: (p.x / W) * rect.width, data: rowData });
                                        }
                                    }}
                                    onMouseLeave={() => setTooltip(null)}
                                />
                            ))}
                        </g>
                    );
                })}
            </svg>

            {tooltip && (
                <div
                    className="absolute top-0 bg-neutral-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl min-w-[140px] pointer-events-none z-50"
                    style={{ left: Math.min(Math.max(tooltip.x, 80), 400), transform: "translateX(-50%)" }}
                >
                    <p className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em] mb-2">{tooltip.data.formattedDate || tooltip.data.date}</p>
                    {metrics.map(m => {
                        const val = tooltip.data[m.key];
                        if (val == null) return null;
                        return (
                            <div key={m.key} className="flex justify-between gap-4 items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                                    <span className="text-[9px] text-neutral-400 font-bold uppercase">{m.label}</span>
                                </div>
                                <span className="text-sm font-black text-white">{val}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function MeasurementChart({ data, metrics, title }: MeasurementChartProps) {
    const formattedData = useMemo(() => {
        return data.map(item => ({
            ...item,
            formattedDate: format(new Date(item.date), "d MMM", { locale: es })
        }));
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <div className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl shadow-2xl overflow-hidden p-8 flex flex-col items-center justify-center text-center gap-6 group">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-all">
                    <Activity className="w-8 h-8 text-neutral-700" />
                </div>
                <div>
                    <h3 className="text-white font-black uppercase italic tracking-widest text-xs mb-2">{title}</h3>
                    <p className="text-[10px] text-neutral-600 font-black uppercase italic tracking-widest">Esperando Sincronización de Datos</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl shadow-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-linear-to-b from-red-600/5 to-transparent pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-8 border-b border-white/5 relative z-10 bg-black/20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                        <Activity className="w-5 h-5 text-red-500" />
                    </div>
                    <h3 className="text-white text-lg font-black uppercase italic tracking-tighter">{title}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {metrics.map(m => (
                        <div
                            key={m.key}
                            className="flex items-center gap-2 bg-black/40 border border-white/5 px-3 py-1.5 rounded-xl"
                        >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 italic">{m.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-8 relative z-10 w-full overflow-x-auto custom-scrollbar">
                <SvgMultiLineChart data={formattedData} metrics={metrics} />
            </div>
        </div>
    );
}
