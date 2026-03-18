"use client";

import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Activity } from "lucide-react";

interface MeasurementData {
    date: Date;
    [key: string]: any;
}

interface MeasurementChartProps {
    data: MeasurementData[];
    metrics: { key: string; label: string; color: string }[];
    title: string;
}

export function MeasurementChart({ data, metrics, title }: MeasurementChartProps) {
    const formattedData = useMemo(() => {
        return data.map(item => ({
            ...item,
            formattedDate: format(new Date(item.date), "d MMM", { locale: es })
        })); // Mostrar orden cronológico de izquierda a derecha
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
                 <div className="h-[350px] w-full min-w-[500px]">
                     <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} aspect={undefined}>
                        <LineChart data={formattedData} margin={{ top: 25, right: 20, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} strokeOpacity={0.2} />
                            <XAxis
                                dataKey="formattedDate"
                                stroke="#404040"
                                fontSize={9}
                                fontWeight={900}
                                tickLine={false}
                                axisLine={false}
                                dy={15}
                                className="uppercase italic"
                            />
                            <YAxis
                                stroke="#404040"
                                fontSize={9}
                                fontWeight={900}
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                                domain={['auto', 'auto']}
                                className="italic"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                                    border: "1px solid rgba(255, 255, 255, 0.05)",
                                    borderRadius: "16px",
                                    backdropFilter: "blur(20px)",
                                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                                }}
                                itemStyle={{
                                    fontSize: "10px",
                                    fontWeight: "900",
                                    textTransform: "uppercase",
                                    padding: "2px 0"
                                }}
                                labelStyle={{
                                    color: "#525252",
                                    fontSize: "9px",
                                    fontWeight: "900",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    marginBottom: "10px",
                                    fontStyle: "italic"
                                }}
                                cursor={{ stroke: 'rgba(239, 68, 68, 0.2)', strokeWidth: 2 }}
                            />
                            {metrics.map(m => (
                                <Line
                                    key={m.key}
                                    type="monotone"
                                    dataKey={m.key}
                                    stroke={m.color}
                                    strokeWidth={4}
                                    dot={{ r: 4, fill: "#000", stroke: m.color, strokeWidth: 2 }}
                                    activeDot={{ r: 6, fill: m.color, stroke: "#fff", strokeWidth: 2 }}
                                    label={{ fill: m.color, fontSize: 10, fontWeight: 900, position: 'top', dy: -12 }}
                                    name={m.label}
                                    animationDuration={1500}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
