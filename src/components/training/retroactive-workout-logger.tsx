"use client";

import React, { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Save, Loader2 } from "lucide-react";
import { WorkoutLoggerProvider, useWorkoutLogger } from "./workout-logger-context";
import { SessionHeader } from "./session-header";
import { ExerciseCard } from "./exercise-card";
import { WorkoutPerception } from "./workout-perception";
import { ViviAnalysisModal } from "./vivi-analysis-modal";
import { ConfirmOverwriteDialog } from "./confirm-overwrite-dialog";
import { ExerciseSelector } from "@/components/routines/exercise-selector";

interface RoutineDay {
    id?: string;
    name: string;
    exercises: Array<{
        exerciseId?: string;
        exerciseName: string;
        sets: Array<{ reps?: number | string; rpeTarget?: number }>;
    }>;
}

interface RetroactiveWorkoutLoggerProps {
    routineDay?: RoutineDay;
    routineId?: string;
    routineName?: string;
    defaultDate?: string;
    onBack?: () => void;
    userRole?: string;
}

function WorkoutLoggerContent({ onBack, userRole, routineDay }: { onBack?: () => void; userRole?: string; routineDay?: RoutineDay }) {
    const {
        exercises,
        canUseSelector,
        openAddSelector,
        addExercise,
        openInsertSelector,
        handleSubmit,
        isSubmitting,
        isLoadingLog,
        existingLogId,
        showExerciseSelector,
        setShowExerciseSelector,
        handleExerciseSelected,
        availableExercises,
        exerciseSelectorMode,
    } = useWorkoutLogger();

    // Re-evaluar canEdit e isAdvanced dentro del contenido
    const isAdvanced = userRole === "advanced_athlete";
    const canEdit = true;

    return (
        <div className="max-w-2xl mx-auto pb-32 space-y-6 animate-in fade-in duration-500">
            <SessionHeader onBack={onBack} disableRoutineName={!!routineDay} />

            {/* Lista de Ejercicios */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                        <span>EJERCICIOS ({exercises.length})</span>
                    </div>
                    {canEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={canUseSelector !== false ? openAddSelector : addExercise}
                            className="text-red-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg text-xs font-bold"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Añadir
                        </Button>
                    )}
                </div>

                {exercises.map((exercise: any, exIndex: number) => (
                    <Fragment key={exIndex}>
                        <ExerciseCard 
                            exercise={exercise} 
                            exIndex={exIndex} 
                            canEdit={canEdit} 
                            isAdvanced={isAdvanced} 
                        />
                        
                        {/* Divisor de inserción entre ejercicios */}
                        {exIndex < exercises.length - 1 && (
                            <div className="relative h-8 -my-4 z-10 flex items-center justify-center group">
                                <div className="absolute inset-x-0 h-px bg-neutral-800 opacity-30 sm:opacity-20 sm:group-hover:opacity-50 transition-opacity" />
                                <button
                                    type="button"
                                    onClick={() => openInsertSelector(exIndex + 1)}
                                    className="relative w-7 h-7 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 text-red-500 shadow-xl"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </Fragment>
                ))}

                {/* Botón añadir al final */}
                {canEdit && (
                    <Button
                        variant="outline"
                        onClick={canUseSelector !== false ? openAddSelector : addExercise}
                        className="w-full h-12 border border-dashed border-neutral-800 bg-neutral-900/30 text-neutral-500 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 rounded-xl transition-all group"
                    >
                        <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Añadir Ejercicio</span>
                    </Button>
                )}
            </div>

            <WorkoutPerception />

            {/* Botón Guardar Fijo */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur-xl border-t border-white/10 z-60">
                <div className="max-w-2xl mx-auto">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || exercises.length === 0 || isLoadingLog}
                        className="w-full h-14 text-lg font-black bg-white text-black hover:bg-neutral-200 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {isSubmitting || isLoadingLog ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {isLoadingLog ? "Cargando..." : "Guardando..."}
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                {existingLogId ? "Actualizar Entrenamiento" : "Guardar Entrenamiento"}
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Modales y Diálogos */}
            <ExerciseSelector
                open={showExerciseSelector}
                onOpenChange={setShowExerciseSelector}
                onSelect={handleExerciseSelected}
                availableExercises={availableExercises}
                title={exerciseSelectorMode === "swap" ? "Cambiar Ejercicio" : "Agregar Ejercicio"}
            />
            <ConfirmOverwriteDialog />
            <ViviAnalysisModal />
        </div>
    );
}

export function RetroactiveWorkoutLogger(props: RetroactiveWorkoutLoggerProps) {
    return (
        <WorkoutLoggerProvider {...props}>
            <WorkoutLoggerContent {...props} />
        </WorkoutLoggerProvider>
    );
}
