"use client";

import { Button } from "@/components/ui/button";
import { AIAssistantDialog } from "@/components/training/ai-assistant-dialog";
import { WorkoutTimer } from "./workout-timer";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkoutHeaderProps {
    currentExerciseIndex: number;
    totalExercises: number;
    exerciseName: string;
    elapsedTime: number;
    isStarted: boolean;
    isAdvanced: boolean;
    onSwapExercise: () => void;
    onCancel: () => void;
    onFinish: () => void;
    showExerciseSelector: boolean;
    exerciseNames?: string[];
}

export function WorkoutHeader({
    currentExerciseIndex,
    totalExercises,
    exerciseName,
    elapsedTime,
    isStarted,
    isAdvanced,
    onSwapExercise,
    onCancel,
    onFinish,
    showExerciseSelector,
    exerciseNames,
}: WorkoutHeaderProps) {
    return (
        <div className={cn(
            "sticky top-0 z-30 bg-black/40 backdrop-blur-3xl border-b border-white/5 py-4 px-4 -mx-4 md:rounded-b-4xl md:mx-0 shadow-2xl transition-all duration-300",
            showExerciseSelector && "opacity-0 pointer-events-none"
        )}>
            <div className="flex justify-between items-center max-w-3xl mx-auto gap-2 md:gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="hidden sm:block px-2 py-1 bg-red-600/10 border border-red-600/20 rounded-lg shrink-0">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">
                                {currentExerciseIndex + 1}/{totalExercises}
                            </span>
                        </div>
                        <h2 className="text-sm md:text-base font-bold text-white tracking-tight truncate uppercase italic">
                            {exerciseName}
                        </h2>
                        {(isAdvanced || isStarted && totalExercises === 1 && exerciseName === "Rutina Libre") && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onSwapExercise}
                                className="h-7 w-7 rounded-lg text-neutral-500 hover:text-amber-400 hover:bg-amber-400/10 transition-all shrink-0"
                                title="Cambiar ejercicio"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex gap-1 md:gap-2 items-center shrink-0">
                    <WorkoutTimer elapsedTime={elapsedTime} isStarted={isStarted} />

                    <AIAssistantDialog
                        muscleGroups={[exerciseName || "General"]}
                        availableExercises={[exerciseName]}
                    />

                    <div className="h-6 w-px bg-white/5 mx-1 md:mx-2" />

                    <Button
                        onClick={onCancel}
                        variant="ghost"
                        className="text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all h-9 px-3"
                    >
                        Abortar
                    </Button>

                    <Button
                        onClick={onFinish}
                        className="hidden lg:flex rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all h-9 px-4 shadow-lg shadow-white/5"
                    >
                        Finalizar
                    </Button>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-900 overflow-hidden">
                <div
                    className="h-full bg-linear-to-r from-red-600 to-red-400 shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all duration-500"
                    style={{ width: `${((currentExerciseIndex + 1) / totalExercises) * 100}%` }}
                />
            </div>
        </div>
    );
}