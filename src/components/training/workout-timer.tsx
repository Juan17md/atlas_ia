"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkoutTimerProps {
    elapsedTime: number;
    isStarted: boolean;
}

export function WorkoutTimer({ elapsedTime, isStarted }: WorkoutTimerProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-900/50 rounded-lg border border-white/5">
            <Clock className={cn("w-3 h-3 md:w-3.5 md:h-3.5 text-red-500", isStarted && "animate-pulse")} />
            <span className="text-[10px] md:text-xs font-black text-white italic tracking-widest">
                {formatTime(elapsedTime)}
            </span>
        </div>
    );
}