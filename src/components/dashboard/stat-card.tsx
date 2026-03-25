"use client";

import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
    title: string;
    value: string | number;
    label?: string;
    icon: LucideIcon;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    color?: "red" | "green" | "blue" | "yellow" | "neutral";
    className?: string;
}

export function StatCard({
    title,
    value,
    label,
    icon: Icon,
    trend = "neutral",
    trendValue,
    color = "neutral",
    className
}: StatCardProps) {

    const colorStyles = {
        red: "bg-red-500/10 text-red-500",
        green: "bg-emerald-500/10 text-emerald-500",
        blue: "bg-blue-500/10 text-blue-500",
        yellow: "bg-yellow-500/10 text-yellow-500",
        neutral: "bg-neutral-800 text-white",
    };

    const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-500" : "text-neutral-500";
    const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "p-4 md:p-6 rounded-4xl bg-neutral-900/40 backdrop-blur-xl border border-white/5 flex flex-col justify-between h-32 md:h-44 group transition-all relative overflow-hidden shadow-2xl",
                "hover:border-white/20 hover:bg-neutral-900/60",
                className
            )}
        >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                    <p className="text-neutral-500 font-bold text-[10px] uppercase tracking-[0.2em]">{title}</p>
                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tighter leading-none">{value}</h3>
                </div>
                <div className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-lg",
                    colorStyles[color],
                    "border border-white/5"
                )}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            <div className="flex items-center gap-2 mt-auto relative z-10">
                {TrendIcon && (
                    <div className={cn(
                        "flex items-center text-[10px] font-black px-2.5 py-1 rounded-full border",
                        trend === "up" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                        <TrendIcon className="w-3 h-3 mr-1 shrink-0" />
                        {trendValue}
                    </div>
                )}
                {label && (
                    <span className="text-[11px] text-neutral-500 font-bold uppercase tracking-wider">{label}</span>
                )}
            </div>
        </motion.div>
    );
}
