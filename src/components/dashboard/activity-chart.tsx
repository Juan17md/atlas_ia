"use client";

import { useState, useRef } from "react";
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

export function ActivityChart({ data = defaultData }: { data?: { name: string; total: number }[] }) {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; name: string; value: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const maxVal = Math.max(...data.map(d => d.total), 1);
    const padding = { top: 20, right: 10, bottom: 30, left: 10 };
    const width = 500;
    const height = 250;
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;
    const barW = Math.min(chartW / data.length - 8, 28);
    const gap = (chartW - barW * data.length) / (data.length + 1);

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full h-[250px] relative"
        >
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
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

                {data.map((entry, i) => {
                    const barH = (entry.total / maxVal) * chartH;
                    const x = padding.left + gap + i * (barW + gap);
                    const y = padding.top + chartH - barH;

                    return (
                        <g key={i}>
                            <rect
                                x={x}
                                y={y}
                                width={barW}
                                height={Math.max(barH, 2)}
                                rx={6}
                                ry={6}
                                fill={entry.total > 0 ? "url(#barGradient)" : "url(#emptyGradient)"}
                                className="transition-all duration-300 cursor-pointer hover:opacity-80"
                                onMouseEnter={(e) => {
                                    const rect = containerRef.current?.getBoundingClientRect();
                                    if (rect) {
                                        setTooltip({
                                            x: x / width * rect.width + (barW / width * rect.width) / 2,
                                            y: y / height * rect.height - 10,
                                            name: entry.name,
                                            value: entry.total,
                                        });
                                    }
                                }}
                                onMouseLeave={() => setTooltip(null)}
                            />
                            <text
                                x={x + barW / 2}
                                y={height - 5}
                                textAnchor="middle"
                                fill="#737373"
                                fontSize={10}
                                fontWeight={700}
                            >
                                {entry.name}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {tooltip && (
                <div
                    className="absolute pointer-events-none bg-neutral-900/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl -translate-x-1/2 -translate-y-full"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    <p className="text-[10px] uppercase font-black tracking-widest text-neutral-500 mb-1">{tooltip.name}</p>
                    <p className="text-xl font-black text-white leading-none">
                        {tooltip.value} <span className="text-[10px] font-normal text-neutral-500">vol</span>
                    </p>
                </div>
            )}
        </motion.div>
    );
}
