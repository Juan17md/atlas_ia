"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, Rectangle } from "recharts";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const defaultData = [
    { name: "Lun", total: 0 },
    { name: "Mar", total: 0 },
    { name: "Mié", total: 0 },
    { name: "Jue", total: 0 },
    { name: "Vie", total: 0 },
    { name: "Sáb", total: 0 },
    { name: "Dom", total: 0 },
];

export function ActivityChart({ data = defaultData }: { data?: any[] }) {
    // Prevent SSR hydration mismatch for Recharts
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-full h-[250px] bg-neutral-800/50 animate-pulse rounded-xl" />;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full h-[250px]"
        >
             <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} aspect={undefined}>
                <BarChart data={data}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                            <stop offset="100%" stopColor="#991b1b" stopOpacity={0.8} />
                        </linearGradient>
                        <linearGradient id="emptyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#262626" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#171717" stopOpacity={0.2} />
                        </linearGradient>
                    </defs>
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 12 }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="bg-neutral-900/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-1">
                                            {payload[0].payload.name}
                                        </p>
                                        <p className="text-xl font-black text-white leading-none">
                                            {payload[0].value} <span className="text-[10px] font-normal text-neutral-500">vol</span>
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <XAxis
                        dataKey="name"
                        stroke="#404040"
                        fontSize={10}
                        fontWeight={700}
                        tickLine={false}
                        axisLine={false}
                        dy={15}
                        tick={{ fill: '#737373' }}
                    />
                    <Bar
                        dataKey="total"
                        radius={[6, 6, 6, 6]}
                        barSize={20}
                        animationDuration={1500}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.total > 0 ? "url(#barGradient)" : "url(#emptyGradient)"}
                                className="transition-all duration-300 hover:opacity-80"
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </motion.div>
    );
}
