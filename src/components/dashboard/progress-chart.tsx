"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export function ProgressChart({ completed = 0, target = 3 }: { completed?: number, target?: number }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const percentage = Math.min(Math.round((completed / target) * 100), 100);
    const data = [
        { name: "Completado", value: percentage, color: "#ef4444" },
        { name: "Restante", value: 100 - percentage, color: "#262626" },
    ];

    if (!mounted) return <div className="h-[200px] w-full bg-neutral-800/50 animate-pulse rounded-full" />;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className="h-[220px] w-full relative"
        >
             <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} aspect={undefined}>
                <PieChart>
                    <defs>
                        <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="100%" stopColor="#7f1d1d" />
                        </linearGradient>
                    </defs>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={12}
                        animationDuration={1500}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={index === 0 ? "url(#progressGradient)" : "#171717"}
                                className="drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]"
                            />
                        ))}
                        <Label
                            content={({ viewBox }) => {
                                const { cx, cy } = viewBox as { cx: number; cy: number };
                                return (
                                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                        <tspan x={cx} y={cy - 5} className="fill-white text-3xl font-black tracking-tighter">
                                            {percentage}%
                                        </tspan>
                                        <tspan x={cx} y={cy + 20} className="fill-neutral-500 text-[10px] font-bold uppercase tracking-widest">
                                            Hecho
                                        </tspan>
                                    </text>
                                );
                            }}
                        />
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-10 text-[10px] font-black text-neutral-500 text-center uppercase tracking-widest bg-neutral-900/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5">
                Semanal ({completed}/{target})
            </div>
        </motion.div>
    );
}
