"use client";

import { useState, useEffect, useCallback } from "react";
import type { RoutineExercise, SessionExercise, WorkoutSessionState } from "../workout-session-types";
import type { RoutineDay } from "../workout-session-types";

interface UseWorkoutStorageProps {
    routineId: string;
    activeDay: RoutineDay | undefined;
    mutableExercises: RoutineExercise[];
    sessionLog: SessionExercise[];
    elapsedTime: number;
    isStarted: boolean;
    currentExerciseIndex: number;
}

export function useWorkoutStorage({
    routineId,
    activeDay,
    mutableExercises,
    sessionLog,
    elapsedTime,
    isStarted,
    currentExerciseIndex,
}: UseWorkoutStorageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [restoredState, setRestoredState] = useState<WorkoutSessionState | null>(null);

    useEffect(() => {
        if (!activeDay || isLoaded) return;

        const storageKey = `gymia_session_${routineId}_${activeDay.name}`;
        const stored = localStorage.getItem(storageKey);

        if (stored) {
            try {
                const data: Partial<WorkoutSessionState> = JSON.parse(stored);
                if (data.mutableExercises && data.mutableExercises.length > 0) {
                    setRestoredState(data as WorkoutSessionState);
                }
            } catch (e) {
                console.error("Error loading session:", e);
                localStorage.removeItem(storageKey);
            }
        }
        setIsLoaded(true);
    }, [activeDay, routineId, isLoaded]);

    useEffect(() => {
        if (!activeDay || sessionLog.length === 0) return;

        const storageKey = `gymia_session_${routineId}_${activeDay.name}`;
        const state: WorkoutSessionState = {
            sessionLog,
            mutableExercises,
            elapsedTime,
            isStarted,
            currentExerciseIndex,
        };
        localStorage.setItem(storageKey, JSON.stringify(state));
    }, [sessionLog, mutableExercises, elapsedTime, isStarted, currentExerciseIndex, routineId, activeDay]);

    const clearStorage = useCallback(() => {
        if (!activeDay) return;
        localStorage.removeItem(`gymia_session_${routineId}_${activeDay.name}`);
    }, [routineId, activeDay]);

    return { restoredState, clearStorage };
}
