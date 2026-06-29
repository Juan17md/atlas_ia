"use client";

import { motion } from "framer-motion";

export function ProgressChart({ completed = 0, target = 3 }: { completed?: number; target?: number }) {
    const percentage = Math.min(Math.round((completed / target) * 100), 100);

    const size = 200;
    const strokeW = 20;
    const radius = (size - strokeW) / 2;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (percentage / 100) * circ;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
            className="h-[220px] w-full relative flex items-center justify-center"
        >
            <svg width={size} height={size} className="drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                <defs>
                    <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#7f1d1d" />
                    </linearGradient>
                </defs>

                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#171717"
                    strokeWidth={strokeW}
                />

                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeW}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />

                <text x={size / 2} y={size / 2 - 5} textAnchor="middle" fill="white" fontSize={28} fontWeight={900} fontStyle="italic">
                    {percentage}%
                </text>
                <text x={size / 2} y={size / 2 + 20} textAnchor="middle" fill="#737373" fontSize={10} fontWeight={700} letterSpacing="0.2em">
                    Hecho
                </text>
            </svg>

            <div className="absolute bottom-1 text-[10px] font-black text-neutral-500 text-center uppercase tracking-widest bg-neutral-900/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5">
                Semanal ({completed}/{target})
            </div>
        </motion.div>
    );
}
