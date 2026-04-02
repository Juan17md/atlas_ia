"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useWorkoutLogger, RetroExercise } from "./workout-logger-context";
import { SetRow } from "./set-row";

interface ExerciseCardProps {
    exercise: RetroExercise;
    exIndex: number;
    canEdit?: boolean;
    isAdvanced?: boolean;
}

export const ExerciseCard = React.memo(function ExerciseCard({ exercise, exIndex, canEdit, isAdvanced }: ExerciseCardProps) {
    const { 
        updateExercise, 
        removeExercise, 
        addSet, 
        openSwapSelector, 
        exercises 
    } = useWorkoutLogger();

    return (
        <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm hover:border-neutral-700 transition-colors">
            {/* Exercise Header */}
            <div className="p-3 sm:p-4 bg-neutral-900/50 border-b border-neutral-800 flex items-start gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-500 text-[10px] sm:text-xs font-bold shrink-0 mt-0.5">
                    {exIndex + 1}
                </div>
                <Textarea
                    value={exercise.exerciseName}
                    onChange={(e) => updateExercise(exIndex, "exerciseName", e.target.value)}
                    placeholder="Nombre del ejercicio..."
                    className="flex-1 bg-transparent border-none text-white font-bold text-base sm:text-lg min-h-10 py-1 px-1 focus-visible:ring-0 placeholder:text-neutral-700 resize-none leading-tight -mt-1"
                    rows={1}
                    style={{ fieldSizing: "content" } as React.CSSProperties}
                />
                <div className="flex items-center gap-1">
                    {isAdvanced && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openSwapSelector(exIndex)}
                            className="h-8 w-8 text-neutral-600 hover:text-amber-400 hover:bg-amber-400/10 shrink-0"
                            title="Cambiar ejercicio"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    )}
                    {canEdit && exercises.length > 1 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExercise(exIndex)}
                            className="h-8 w-8 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 shrink-0"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Sets Table */}
            <div className="p-3 sm:p-4 space-y-2">
                {/* Sets Header */}
                <div className="grid grid-cols-[20px_1fr_1fr_1fr_20px] sm:grid-cols-[28px_1fr_1fr_1fr_28px] gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] uppercase font-bold text-neutral-500 text-center tracking-wider mb-2">
                    <div>#</div>
                    <div>Kg</div>
                    <div>Reps</div>
                    <div>RPE</div>
                    <div></div>
                </div>

                {exercise.sets.map((set, setIndex) => (
                    <SetRow 
                        key={setIndex}
                        exIndex={exIndex}
                        setIndex={setIndex}
                        set={set}
                        canDelete={canEdit && exercise.sets.length > 1}
                    />
                ))}

                {/* Add Set Button */}
                {canEdit && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addSet(exIndex)}
                        className="w-full text-xs text-neutral-500 hover:text-white hover:bg-neutral-800 h-8 rounded-lg"
                    >
                        <Plus className="w-3 h-3 mr-1" />
                        AÑADIR SERIE
                    </Button>
                )}

                {/* Exercise Notes */}
                <input
                    value={exercise.feedback}
                    onChange={(e) => updateExercise(exIndex, "feedback", e.target.value)}
                    placeholder="Notas del ejercicio (opcional)..."
                    className="w-full bg-transparent border-0 border-b border-neutral-800 rounded-none px-0 text-sm text-neutral-400 focus-visible:ring-0 focus-visible:border-neutral-600 placeholder:text-neutral-700 py-2 sm:py-3 outline-hidden"
                />
            </div>
        </div>
    );
});
