"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Loader2, Play, Dumbbell, Sparkles, Plus, Trash2, RefreshCw, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { logWorkoutSession, getLastSessionExerciseData, type WorkoutSessionData } from "@/actions/training-logs";
import { cn, calculateRealTimeAdjustment } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AIAssistantDialog } from "@/components/training/ai-assistant-dialog";
import { getExerciseNames, getExercises } from "@/actions/exercise-actions";
import { ProgressionTip } from "@/components/training/progression-tip";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { SessionFeedbackDialog } from "@/components/training/session-feedback-dialog";
import { CancelWorkoutDialog } from "@/components/training/cancel-workout-dialog";
import { ClientMotionDiv } from "@/components/ui/client-motion";
import { motion, AnimatePresence } from "framer-motion";
import { ExerciseSelector } from "@/components/routines/exercise-selector";

import type { Routine, RoutineExercise, RoutineSet, SessionExercise, SessionSet } from "./workout-session-types";
import { WorkoutHeader } from "./workout-header";
import { WorkoutNavigation } from "./workout-navigation";
import { SessionStartView } from "./session-start-view";
import { FreeWorkoutView } from "./free-workout-view";

interface WorkoutSessionProps {
    routine: Routine;
    userRole?: string;
}

export function WorkoutSession({ routine, userRole }: WorkoutSessionProps) {
    const router = useRouter();
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);

    const isAdvanced = userRole === "advanced_athlete";

    const [sessionLog, setSessionLog] = useState<SessionExercise[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const { saveLogLocally } = useOfflineSync();

    const [mutableExercises, setMutableExercises] = useState<RoutineExercise[]>([]);

    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [exerciseSelectorMode, setExerciseSelectorMode] = useState<"swap" | "add">("add");
    const [swapTargetIndex, setSwapTargetIndex] = useState<number>(-1);
    const [availableExercises, setAvailableExercises] = useState<{ id: string; name: string }[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

    const activeDay = routine.schedule[0];
    const [historySets, setHistorySets] = useState<{ weight: number; reps: number; rpe?: number }[]>([]);

    const cleanRoutineName = routine.name.replace(/\(assigned\)/i, '').trim();
    const cleanDayName = activeDay
        ? new Date().toLocaleDateString('es-ES', { weekday: 'long' })
        : "";

    const isFreeWorkout = routine.id.startsWith('free_workout');

    useEffect(() => {
        if (!activeDay) return;

        const storageKey = `gymia_session_${routine.id}_${activeDay.name}`;
        const stored = localStorage.getItem(storageKey);

        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (data.mutableExercises && data.mutableExercises.length > 0) {
                    setMutableExercises(data.mutableExercises);
                } else {
                    setMutableExercises([...activeDay.exercises]);
                }
                if (data.sessionLog && data.sessionLog.length > 0) {
                    setSessionLog(data.sessionLog);
                    setElapsedTime(data.elapsedTime || 0);
                    setIsStarted(data.isStarted || false);
                    setCurrentExerciseIndex(data.currentExerciseIndex || 0);
                    return;
                }
            } catch (e) {
                console.error("Error loading session:", e);
                localStorage.removeItem(storageKey);
            }
        }

        setMutableExercises([...activeDay.exercises]);
        setSessionLog(activeDay.exercises.map((ex: RoutineExercise) => ({
            exerciseId: ex.exerciseId || "temp-id",
            exerciseName: ex.exerciseName,
            sets: ex.sets.map((set: RoutineSet) => ({
                reps: "",
                weight: "",
                rpe: "",
                completed: false,
                targetReps: set.reps,
            })),
            feedback: "",
            exerciseIdUsed: ex.exerciseId || "temp-id"
        })));
    }, [activeDay, routine.id]);

    useEffect(() => {
        if (!activeDay || sessionLog.length === 0) return;

        const storageKey = `gymia_session_${routine.id}_${activeDay.name}`;
        const state = {
            sessionLog,
            mutableExercises,
            elapsedTime,
            isStarted,
            currentExerciseIndex,
            timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(state));
    }, [sessionLog, mutableExercises, elapsedTime, isStarted, currentExerciseIndex, routine.id, activeDay]);

    useEffect(() => {
        const currentEx = mutableExercises[currentExerciseIndex];
        const currentLog = sessionLog[currentExerciseIndex];
        if (currentEx?.exerciseId && currentEx.exerciseId !== "temp-id") {
            getLastSessionExerciseData(currentLog?.exerciseIdUsed || currentEx.exerciseId)
                .then(res => {
                    if (res.success && res.sets) {
                        setHistorySets(res.sets);
                    } else {
                        setHistorySets([]);
                    }
                })
                .catch(() => setHistorySets([]));
        } else {
            setHistorySets([]);
        }
    }, [currentExerciseIndex, mutableExercises, sessionLog]);

    const [variantNames, setVariantNames] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!activeDay) return;
        const allVariantIds = mutableExercises.flatMap(ex => ex.variantIds || []);
        if (allVariantIds.length > 0) {
            getExerciseNames(allVariantIds).then(res => {
                if (res.success && res.names) {
                    setVariantNames(res.names);
                }
            });
        }
    }, [activeDay, mutableExercises]);

    useEffect(() => {
        if (!isAdvanced) return;
        getExercises().then(res => {
            if (res.success && res.exercises) {
                setAvailableExercises(res.exercises.map((ex: any) => ({ id: ex.id, name: ex.name })));
            }
        });
    }, [isAdvanced]);

    const openSwapSelector = useCallback((exerciseIndex: number) => {
        setExerciseSelectorMode("swap");
        setSwapTargetIndex(exerciseIndex);
        setShowExerciseSelector(true);
    }, []);

    const openAddSelector = useCallback(() => {
        setExerciseSelectorMode("add");
        setSwapTargetIndex(-1);
        setShowExerciseSelector(true);
    }, []);

    const handleExerciseSelected = useCallback((exercise: { id?: string; name: string }) => {
        if (exerciseSelectorMode === "swap" && swapTargetIndex >= 0) {
            setMutableExercises(prev => {
                const updated = [...prev];
                updated[swapTargetIndex] = {
                    exerciseId: exercise.id || "custom",
                    exerciseName: exercise.name,
                    sets: updated[swapTargetIndex].sets,
                    notes: "",
                    variantIds: [],
                };
                return updated;
            });
            setSessionLog(prev => {
                const updated = [...prev];
                updated[swapTargetIndex] = {
                    exerciseId: exercise.id || "custom",
                    exerciseName: exercise.name,
                    sets: updated[swapTargetIndex].sets.map(s => ({
                        weight: "",
                        reps: "",
                        rpe: "",
                        completed: false,
                    })),
                    feedback: "",
                    exerciseIdUsed: exercise.id || "custom",
                };
                return updated;
            });
            toast.success(`Ejercicio cambiado a: ${exercise.name}`);
        } else {
            const defaultSets: RoutineSet[] = [
                { reps: 12, type: "working" },
                { reps: 10, type: "working" },
                { reps: 8, type: "working" },
            ];
            const newExercise: RoutineExercise = {
                exerciseId: exercise.id || "custom",
                exerciseName: exercise.name,
                sets: defaultSets,
                notes: "",
                variantIds: [],
            };
            setMutableExercises(prev => [...prev, newExercise]);
            setSessionLog(prev => [
                ...prev,
                {
                    exerciseId: exercise.id || "custom",
                    exerciseName: exercise.name,
                    sets: defaultSets.map(s => ({
                        reps: "",
                        weight: "",
                        rpe: "",
                        completed: false,
                        targetReps: s.reps,
                    })),
                    feedback: "",
                    exerciseIdUsed: exercise.id || "custom",
                },
            ]);
            toast.success(`Ejercicio añadido: ${exercise.name}`);
        }
        setShowExerciseSelector(false);
    }, [exerciseSelectorMode, swapTargetIndex]);

    const handleRemoveExercise = useCallback((index: number) => {
        if (mutableExercises.length <= 1) {
            toast.error("Debes tener al menos un ejercicio.");
            return;
        }
        setMutableExercises(prev => prev.filter((_, i) => i !== index));
        setSessionLog(prev => prev.filter((_, i) => i !== index));
        setCurrentExerciseIndex(prev => {
            if (prev >= mutableExercises.length - 1) return Math.max(0, mutableExercises.length - 2);
            if (prev > index) return prev - 1;
            return prev;
        });
        setShowDeleteConfirm(null);
        toast.info("Ejercicio eliminado.");
    }, [mutableExercises.length]);

    const switchExerciseVariant = (exerciseIndex: number, variantId: string, variantName: string) => {
        const newLog = [...sessionLog];
        newLog[exerciseIndex].exerciseIdUsed = variantId;
        newLog[exerciseIndex].exerciseName = variantName;
        setSessionLog(newLog);
        toast.info(`Cambiado a: ${variantName}`);
    };

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

    const updateSet = (exerciseIndex: number, setIndex: number, field: keyof SessionSet, value: string | boolean) => {
        const newLog = [...sessionLog];
        (newLog[exerciseIndex].sets[setIndex] as unknown as Record<string, unknown>)[field] = value;
        setSessionLog(newLog);
    };

    const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
        const currentLogEx = sessionLog[exerciseIndex];
        const currentSet = currentLogEx.sets[setIndex];
        const isTurningComplete = !currentSet.completed;

        updateSet(exerciseIndex, setIndex, "completed", isTurningComplete);

        if (isTurningComplete && currentSet.weight && currentSet.rpe) {
            const weightNum = Number(currentSet.weight);
            const rpeNum = Number(currentSet.rpe);

            if (!isNaN(weightNum) && !isNaN(rpeNum)) {
                const targetRpe = mutableExercises[exerciseIndex].sets[setIndex].rpeTarget;
                const suggestion = calculateRealTimeAdjustment(weightNum, rpeNum, targetRpe);

                if (suggestion) {
                    toast(suggestion.message, {
                        icon: <Sparkles className="w-4 h-4 text-amber-500" />,
                        duration: 5000,
                        action: suggestion.adjustment > 0 ? {
                            label: `Subir +${suggestion.adjustment}kg`,
                            onClick: () => {
                                if (setIndex < currentLogEx.sets.length - 1) {
                                    updateSet(exerciseIndex, setIndex + 1, "weight", (weightNum + suggestion.adjustment).toString());
                                }
                            }
                        } : undefined
                    });
                }
            }
        }
    };

    const handleFinishClick = () => {
        setShowFeedback(true);
    };

    const handleCancelConfirm = () => {
        if (!activeDay) return;
        localStorage.removeItem(`gymia_session_${routine.id}_${activeDay.name}`);
        router.push("/dashboard");
    };

    const handleCompleteSession = async (sessionRpe: number, sessionNotes: string) => {
        setIsSubmitting(true);

        const logData = {
            routineId: routine.id,
            dayId: activeDay.id || activeDay.name,
            durationMinutes: Math.round(elapsedTime / 60),
            sessionRpe,
            sessionNotes,
            exercises: sessionLog.map(ex => ({
                exerciseName: ex.exerciseName,
                exerciseId: ex.exerciseId,
                exerciseIdUsed: ex.exerciseIdUsed,
                feedback: ex.feedback,
                sets: ex.sets.filter((s: SessionSet) => s.completed || s.weight || s.reps).map((s: SessionSet) => ({
                    weight: Number(s.weight) || 0,
                    reps: Number(s.reps) || 0,
                    rpe: Number(s.rpe) || undefined,
                    completed: s.completed
                }))
            }))
        };

        try {
            const res = await logWorkoutSession(logData);
            if (res.success) {
                toast.success("¡Entrenamiento guardado!", {
                    description: "Gran trabajo. Sigue así."
                });
                localStorage.removeItem(`gymia_session_${routine.id}_${activeDay.name}`);
                router.push("/dashboard");
            } else {
                toast.error(res.error);
            }
        } catch (error) {
            console.error("Error al guardar", error);
            const saved = saveLogLocally(logData as WorkoutSessionData);
            if (saved) {
                toast.warning("Guardado localmente (Offline)", {
                    description: "Se sincronizará automáticamente cuando recuperes la conexión."
                });
                localStorage.removeItem(`gymia_session_${routine.id}_${activeDay.name}`);
                router.push("/dashboard");
            } else {
                toast.error("Error crítico: No se pudo guardar el entrenamiento.");
            }
        } finally {
            setIsSubmitting(false);
            setShowFeedback(false);
        }
    };

    const handleNextExercise = () => {
        if (currentExerciseIndex < mutableExercises.length - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            handleFinishClick();
        }
    };

    const handlePrevExercise = () => {
        if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleNumberInput = (value: string) => {
        const val = value.replace(",", ".");
        if (val === "" || /^\d*\.?\d*$/.test(val)) {
            return val;
        }
        return null;
    };

    const updateFeedback = (value: string) => {
        const newLog = [...sessionLog];
        newLog[currentExerciseIndex].feedback = value;
        setSessionLog(newLog);
    };

    // --- LÓGICA DE RENDERIZADO ---
    
    if (!activeDay) return <div className="p-10 text-center">No hay día activo seleccionado.</div>;
    
    if (mutableExercises.length === 0 && sessionLog.length === 0 && !isFreeWorkout) {
        return <div className="p-10 text-center uppercase font-black italic tracking-widest text-neutral-500">Cargando...</div>;
    }

    if (!isStarted) {
        return (
            <SessionStartView
                routineName={cleanRoutineName}
                dayName={cleanDayName}
                exercises={mutableExercises}
                onStart={() => setIsStarted(true)}
                onBack={() => router.push('/dashboard')}
                isFreeWorkout={isFreeWorkout}
            />
        );
    }

    const currentExercise = mutableExercises[currentExerciseIndex];
    const currentLogExercise = sessionLog[currentExerciseIndex];
    const canAddExercises = isAdvanced || isFreeWorkout;
    const isFreeRunningEmpty = isStarted && mutableExercises.length === 0;

    return (
        <>
            <div className={cn(
                "max-w-3xl mx-auto pb-32 space-y-6 transition-all duration-500",
                showExerciseSelector && "opacity-10 saturate-0 scale-[0.98] pointer-events-none blur-sm"
            )}>
                {isFreeRunningEmpty ? (
                    <FreeWorkoutView
                        elapsedTime={elapsedTime}
                        formatTime={formatTime}
                        isStarted={isStarted}
                        onCancel={() => setShowCancelDialog(true)}
                        onFinish={handleFinishClick}
                        onAddExercise={openAddSelector}
                        showExerciseSelector={showExerciseSelector}
                        onOpenExerciseSelector={() => setShowExerciseSelector(true)}
                    />
                ) : (
                    <>
                        {(!currentExercise || !currentLogExercise) ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                                <p className="text-xs font-black uppercase italic tracking-widest text-neutral-500">Preparando ejercicio...</p>
                            </div>
                        ) : (
                            <>
                                <WorkoutHeader
                                    currentExerciseIndex={currentExerciseIndex}
                                    totalExercises={mutableExercises.length}
                                    exerciseName={currentLogExercise?.exerciseName || ""}
                                    elapsedTime={elapsedTime}
                                    isStarted={isStarted}
                                    isAdvanced={isAdvanced}
                                    onSwapExercise={() => openSwapSelector(currentExerciseIndex)}
                                    onCancel={() => setShowCancelDialog(true)}
                                    onFinish={handleFinishClick}
                                    showExerciseSelector={showExerciseSelector}
                                />

                                <div className="space-y-6 min-h-[50vh] relative px-2">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentExerciseIndex}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.4, ease: "circOut" }}
                                            className="bg-neutral-900/40 backdrop-blur-3xl rounded-4xl border border-white/5 overflow-hidden shadow-2xl relative"
                                        >
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

                                            <div className="bg-white/2 border-b border-white/5 p-6 md:p-8 space-y-4">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="space-y-3 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                                                                {currentLogExercise.exerciseName}
                                                            </h3>
                                                            {canAddExercises && (
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => openSwapSelector(currentExerciseIndex)}
                                                                        className="h-8 w-8 rounded-lg text-neutral-600 hover:text-amber-400 hover:bg-amber-400/10 transition-all"
                                                                        title="Cambiar ejercicio"
                                                                    >
                                                                        <RefreshCw className="w-4 h-4" />
                                                                    </Button>
                                                                    {showDeleteConfirm === currentExerciseIndex ? (
                                                                        <div className="flex items-center gap-1 animate-in fade-in duration-200">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => handleRemoveExercise(currentExerciseIndex)}
                                                                                className="h-7 px-2 text-[10px] font-black text-red-500 hover:bg-red-500/20 rounded-lg uppercase"
                                                                            >
                                                                                Sí
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => setShowDeleteConfirm(null)}
                                                                                className="h-7 px-2 text-[10px] font-black text-neutral-500 hover:text-white rounded-lg uppercase"
                                                                            >
                                                                                No
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => setShowDeleteConfirm(currentExerciseIndex)}
                                                                            className="h-8 w-8 rounded-lg text-neutral-600 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                                            title="Eliminar ejercicio"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {currentExercise.variantIds && currentExercise.variantIds.length > 0 && (
                                                            <Sheet>
                                                                <SheetTrigger asChild>
                                                                    <Button variant="outline" className="h-8 text-[10px] font-black uppercase tracking-[0.2em] bg-red-600/10 border-red-600/20 text-red-500 w-fit px-4 rounded-xl hover:bg-red-600/20 transition-all shadow-lg shadow-red-950/20 group">
                                                                        <Dumbbell className="w-3 h-3 group-hover:rotate-12 transition-transform mr-2" />
                                                                        Máquina Ocupada
                                                                    </Button>
                                                                </SheetTrigger>
                                                                <SheetContent side="bottom" className="bg-neutral-950 border-white/10 rounded-t-3xl min-h-[40vh] max-h-[80vh] overflow-y-auto w-full md:max-w-md md:mx-auto md:rounded-3xl md:mb-4 px-4 py-6">
                                                                    <SheetHeader className="pb-4 text-left">
                                                                        <SheetTitle className="text-xl font-black uppercase italic tracking-wider text-white">Alternativas</SheetTitle>
                                                                        <SheetDescription className="text-neutral-400 text-xs">
                                                                            Selecciona otra variante si buscas un estímulo distinto o el equipo está ocupado.
                                                                        </SheetDescription>
                                                                    </SheetHeader>
                                                                    
                                                                    <div className="flex flex-col gap-3 mt-2">
                                                                        <SheetClose asChild>
                                                                            <button
                                                                                onClick={() => switchExerciseVariant(currentExerciseIndex, currentExercise.exerciseId || "primary", currentExercise.exerciseName)}
                                                                                className={cn(
                                                                                    "text-left bg-neutral-900 border border-white/5 p-4 rounded-2xl transition-all hover:border-red-500/50 hover:bg-red-500/5 flex items-center justify-between",
                                                                                    currentLogExercise.exerciseIdUsed === (currentExercise.exerciseId || "primary") && "border-red-500/50 bg-red-500/10"
                                                                                )}
                                                                            >
                                                                                <div>
                                                                                    <div className="font-bold text-white uppercase italic text-sm">{currentExercise.exerciseName}</div>
                                                                                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-black mt-1">Recomendación Principal</div>
                                                                                </div>
                                                                                {currentLogExercise.exerciseIdUsed === (currentExercise.exerciseId || "primary") && (
                                                                                    <Check className="w-5 h-5 text-red-500" />
                                                                                )}
                                                                            </button>
                                                                        </SheetClose>

                                                                        {currentExercise.variantIds.map(vId => (
                                                                            <SheetClose asChild key={vId}>
                                                                                <button
                                                                                    onClick={() => switchExerciseVariant(currentExerciseIndex, vId, variantNames[vId] || "Variante")}
                                                                                    className={cn(
                                                                                        "text-left bg-neutral-900 border border-white/5 p-4 rounded-2xl transition-all hover:border-amber-500/50 hover:bg-amber-500/5 flex items-center justify-between",
                                                                                        currentLogExercise.exerciseIdUsed === vId && "border-amber-500/50 bg-amber-500/10"
                                                                                    )}
                                                                                >
                                                                                    <div>
                                                                                        <div className="font-bold text-white uppercase italic text-sm">{variantNames[vId] || "Cargando variante..."}</div>
                                                                                        <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-black mt-1">Alternativa</div>
                                                                                    </div>
                                                                                    {currentLogExercise.exerciseIdUsed === vId && (
                                                                                        <Check className="w-5 h-5 text-amber-500" />
                                                                                    )}
                                                                                </button>
                                                                            </SheetClose>
                                                                        ))}
                                                                    </div>
                                                                </SheetContent>
                                                            </Sheet>
                                                        )}
                                                    </div>

                                                    {currentExercise.notes && (
                                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-help group" title={currentExercise.notes}>
                                                            <span className="text-neutral-500 group-hover:text-white transition-colors text-xs">INFO</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3">
                                                    <ProgressionTip exerciseId={currentExercise.exerciseId || ""} />
                                                    {currentExercise.notes && (
                                                        <div className="px-3 py-1 bg-neutral-950/50 rounded-lg border border-white/5">
                                                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider line-clamp-1 italic">
                                                                OBS: {currentExercise.notes}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-2 md:p-6 md:pt-0">
                                                <div className="hidden md:grid md:grid-cols-12 md:gap-3 mb-4 px-4 text-[10px] font-black text-neutral-500 text-center uppercase tracking-[0.2em] bg-white/2 py-3 rounded-2xl border border-white/5">
                                                    <div className="col-span-1 italic">SQ</div>
                                                    <div className="col-span-3 italic">Obj.</div>
                                                    <div className="col-span-2 italic">Carga (kg)</div>
                                                    <div className="col-span-2 italic">Reps</div>
                                                    <div className="col-span-2 italic">RPE</div>
                                                    <div className="col-span-2 italic">Status</div>
                                                </div>

                                                <div className="space-y-3">
                                                    {currentExercise.sets.map((set, setIndex) => {
                                                        const logSet = currentLogExercise.sets[setIndex];
                                                        const isCompleted = logSet?.completed;
                                                        const historySet = historySets[setIndex];

                                                        return (
                                                            <div
                                                                key={setIndex}
                                                                className={cn(
                                                                    "flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-3 p-3 md:p-3 rounded-2xl md:items-center transition-all duration-500 relative group/set border",
                                                                    isCompleted
                                                                        ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]"
                                                                        : "bg-neutral-900 border-white/5 hover:border-white/10"
                                                                )}
                                                            >
                                                                <div className="flex justify-between items-center md:contents">
                                                                    <div className="flex items-center gap-3 md:col-span-4 z-10 md:justify-start">
                                                                        <span className={cn(
                                                                            "text-[9px] md:text-[10px] font-black w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center border transition-all duration-300 md:ml-auto md:mr-4 shrink-0",
                                                                            isCompleted ? "bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" :
                                                                                set.type === 'warmup' ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
                                                                                    set.type === 'failure' ? "text-red-500 bg-red-500/10 border-red-500/20" :
                                                                                        "text-neutral-500 bg-neutral-950 border-white/5"
                                                                        )}>
                                                                            {setIndex + 1}
                                                                        </span>
                                                                        
                                                                        <div className="text-left md:text-center min-w-0">
                                                                            <div className="text-white font-black text-xs md:text-base italic leading-tight uppercase tracking-wider truncate">
                                                                                OBJ: {set.reps} {set.rpeTarget && <span className="text-neutral-500 text-[9px] md:text-[10px] ml-1">@RPE {set.rpeTarget}</span>}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="md:hidden flex justify-center z-10 shrink-0">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => toggleSetComplete(currentExerciseIndex, setIndex)}
                                                                            className={cn(
                                                                                "h-9 w-9 rounded-xl transition-all duration-500 border",
                                                                                isCompleted
                                                                                    ? "bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-110"
                                                                                    : "bg-neutral-950 text-neutral-700 border-white/5 hover:border-red-600/30"
                                                                            )}
                                                                        >
                                                                            <Check className={cn("w-4 h-4 transition-transform", isCompleted ? "scale-110" : "scale-100", isCompleted ? "text-black" : "text-neutral-600 hover:text-white")} />
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-3 gap-2 md:grid md:grid-cols-6 md:col-span-6 z-10 w-full">
                                                                    <div className="md:col-span-2 relative">
                                                                        <div className="text-[9px] text-neutral-500 uppercase font-black tracking-widest mb-1.5 px-1 truncate md:hidden">Carga (kg)</div>
                                                                        <Input
                                                                            type="text"
                                                                            inputMode="decimal"
                                                                            placeholder={historySet ? `${historySet.weight}` : "-"}
                                                                            value={logSet?.weight}
                                                                            onChange={(e) => {
                                                                                const val = handleNumberInput(e.target.value);
                                                                                if (val !== null) updateSet(currentExerciseIndex, setIndex, "weight", val);
                                                                            }}
                                                                            className={cn(
                                                                                "h-14 md:h-14 px-0 text-center text-lg md:text-2xl font-black border-0 bg-neutral-950 rounded-xl focus:ring-2 focus:ring-white/10 transition-all placeholder:text-neutral-800 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none italic shadow-inner w-full",
                                                                                isCompleted && "text-emerald-400 bg-emerald-950/20 ring-1 ring-emerald-500/30"
                                                                            )}
                                                                        />
                                                                    </div>

                                                                    <div className="md:col-span-2 relative">
                                                                        <div className="text-[9px] text-neutral-500 uppercase font-black tracking-widest mb-1.5 px-1 truncate md:hidden">Reps</div>
                                                                        <Input
                                                                            type="text"
                                                                            inputMode="decimal"
                                                                            placeholder={historySet ? `${historySet.reps}` : "-"}
                                                                            value={logSet?.reps}
                                                                            onChange={(e) => {
                                                                                const val = handleNumberInput(e.target.value);
                                                                                if (val !== null) updateSet(currentExerciseIndex, setIndex, "reps", val);
                                                                            }}
                                                                            className={cn(
                                                                                "h-14 md:h-14 px-0 text-center text-lg md:text-2xl font-black border-0 bg-neutral-950 rounded-xl focus:ring-2 focus:ring-white/10 transition-all placeholder:text-neutral-800 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none italic shadow-inner w-full",
                                                                                isCompleted && "text-emerald-400 bg-emerald-950/20 ring-1 ring-emerald-500/30"
                                                                            )}
                                                                        />
                                                                    </div>

                                                                    <div className="md:col-span-2 relative">
                                                                        <div className="text-[9px] text-neutral-500 uppercase font-black tracking-widest mb-1.5 px-1 truncate md:hidden">RPE</div>
                                                                        <Select
                                                                            value={logSet?.rpe?.toString() || ""}
                                                                            onValueChange={(val) => updateSet(currentExerciseIndex, setIndex, "rpe", val)}
                                                                        >
                                                                            <SelectTrigger
                                                                                className={cn(
                                                                                    "h-14 w-full px-4 justify-center text-center text-lg md:text-2xl font-black border-0 bg-neutral-950 rounded-xl focus:ring-2 focus:ring-white/10 transition-all text-white italic shadow-inner relative group",
                                                                                    isCompleted && "text-emerald-400 bg-emerald-950/20 ring-1 ring-emerald-500/30"
                                                                                )}
                                                                            >
                                                                                <SelectValue placeholder={historySet ? `${historySet.rpe}` : "-"} />
                                                                                <ChevronDown className="w-4 h-4 ml-2 opacity-20 group-hover:opacity-100 transition-opacity absolute right-4" />
                                                                            </SelectTrigger>
                                                                            <SelectContent className="bg-neutral-900 border border-white/10 text-white min-w-[60px] rounded-2xl backdrop-blur-3xl shadow-2xl">
                                                                                {[10, 9, 8, 7, 6, 5].map((val) => (
                                                                                    <SelectItem
                                                                                        key={val}
                                                                                        value={val.toString()}
                                                                                        className="justify-center focus:bg-red-600 focus:text-white font-black italic rounded-xl mx-1"
                                                                                    >
                                                                                        {val}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </div>

                                                                <div className="hidden md:col-span-2 md:flex justify-center z-10 md:ml-auto">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => toggleSetComplete(currentExerciseIndex, setIndex)}
                                                                        className={cn(
                                                                            "h-14 w-14 rounded-xl transition-all duration-500 border",
                                                                            isCompleted
                                                                                ? "bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-110"
                                                                                : "bg-neutral-950 text-neutral-700 border-white/5 hover:border-red-600/30 hover:text-white"
                                                                        )}
                                                                    >
                                                                        <Check className={cn("w-6 h-6 transition-transform", isCompleted ? "scale-110" : "scale-100")} />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="mt-8 px-2 relative z-10">
                                                    <div className="flex items-center gap-3 mb-3 text-neutral-500">
                                                        <Sparkles className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Feedback Operativo</span>
                                                    </div>
                                                    <Input
                                                        placeholder="Añadir observaciones técnicas..."
                                                        value={currentLogExercise.feedback}
                                                        onChange={(e) => updateFeedback(e.target.value)}
                                                        className="h-14 bg-neutral-950/50 border border-white/5 rounded-2xl px-6 text-sm text-neutral-300 focus-visible:ring-1 focus-visible:ring-red-600/50 placeholder:text-neutral-700 transition-all font-black italic tracking-tight"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>

                                {canAddExercises && (
                                    <div className="px-2">
                                        <Button
                                            variant="outline"
                                            onClick={openAddSelector}
                                            className="w-full h-14 border border-dashed border-white/10 bg-neutral-900/20 text-neutral-500 hover:text-white hover:bg-white/5 hover:border-white/20 rounded-2xl transition-all group"
                                        >
                                            <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                            <span className="text-xs font-black uppercase tracking-[0.2em] italic">Agregar Ejercicio</span>
                                        </Button>
                                    </div>
                                )}

                                <WorkoutNavigation
                                    currentIndex={currentExerciseIndex}
                                    totalExercises={mutableExercises.length}
                                    onPrev={handlePrevExercise}
                                    onNext={handleNextExercise}
                                    isLastExercise={currentExerciseIndex === mutableExercises.length - 1}
                                    isFirstExercise={currentExerciseIndex === 0}
                                    onFinish={handleFinishClick}
                                />
                            </>
                        )}
                    </>
                )}
            </div>

            <SessionFeedbackDialog
                open={showFeedback}
                onOpenChange={setShowFeedback}
                onConfirm={handleCompleteSession}
                isSubmitting={isSubmitting}
            />

            <CancelWorkoutDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
                onConfirm={handleCancelConfirm}
            />

            {canAddExercises && (
                <ExerciseSelector
                    open={showExerciseSelector}
                    onOpenChange={setShowExerciseSelector}
                    onSelect={handleExerciseSelected}
                    availableExercises={availableExercises}
                    title={exerciseSelectorMode === "swap" ? "Cambiar Ejercicio" : "Agregar Ejercicio"}
                />
            )}
        </>
    );
}