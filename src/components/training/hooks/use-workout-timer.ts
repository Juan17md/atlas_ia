"use client";

import { useState, useEffect } from "react";

export function useWorkoutTimer(isStarted: boolean) {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        if (!isStarted) return;
        const timer = setInterval(() => setElapsedTime(prev => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [isStarted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return { elapsedTime, setElapsedTime, formatTime };
}
