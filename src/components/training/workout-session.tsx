"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Clock, Trophy, Info, Loader2, Play, Dumbbell, ChevronLeft, ChevronRight, Save, Activity, Sparkles, Plus, Trash2, RefreshCw } from "lucide-react";
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

// --- INTERFACES ---

interface RoutineSet {
    reps?: number;
    weight?: number;
    rpe?: number;
    rpeTarget?: number;
    type?: "warmup" | "working" | "failure";
    rest?: number;
}

interface RoutineExercise {
    exerciseId?: string;
    exerciseName: string;
    notes?: string;
    sets: RoutineSet[];
    variantIds?: string[];
}

interface RoutineDay {
    id?: string;
    name: string;
    exercises: RoutineExercise[];
}

interface Routine {
    id: string;
    name: string;
    schedule: RoutineDay[];
}

interface SessionSet {
    reps: string;
    weight: string;
    rpe: string;
    completed: boolean;
    targetReps?: number;
}

interface SessionExercise {
    exerciseId: string;
    exerciseName: string;
    sets: SessionSet[];
    feedback: string;
    exerciseIdUsed: string; // ID del ejercicio realmente realizado (principal o variante)
}

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

    // Form state structure matching schema
    // We map the active day exercises to a local state for logging
    const [sessionLog, setSessionLog] = useState<SessionExercise[]>([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const { saveLogLocally } = useOfflineSync();

    // Estado mutable de ejercicios del día (permite al atleta avanzado modificar la rutina)
    const [mutableExercises, setMutableExercises] = useState<RoutineExercise[]>([]);

    // Estado para el selector de ejercicios (cambiar/agregar)
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [exerciseSelectorMode, setExerciseSelectorMode] = useState<"swap" | "add">("add");
    const [swapTargetIndex, setSwapTargetIndex] = useState<number>(-1);
    const [availableExercises, setAvailableExercises] = useState<{ id: string; name: string }[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

    const activeDay = routine.schedule[0]; // El componente padre (TrainPage) filtra la rutina para enviar solo el día activo
    // Estado para guardar el historial de la última sesión
    const [historySets, setHistorySets] = useState<any[]>([]);

    // Translate/Clean names for UI

    // Translate/Clean names for UI
    const cleanRoutineName = routine.name.replace(/\(assigned\)/i, '').trim();
    const cleanDayName = activeDay
        ? new Date().toLocaleDateString('es-ES', { weekday: 'long' })
        : "";

    // 1. Initialize State (Load from Storage or Create New)
    useEffect(() => {
        if (!activeDay) return;

        const storageKey = `gymia_session_${routine.id}_${activeDay.name}`;
        const stored = localStorage.getItem(storageKey);

        if (stored) {
            try {
                const data = JSON.parse(stored);
                // Restaurar ejercicios mutables si existen
                if (data.mutableExercises && data.mutableExercises.length > 0) {
                    setMutableExercises(data.mutableExercises);
                } else {
                    setMutableExercises([...activeDay.exercises]);
                }
                // Validate if stored data has sessionLog
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

        // Default Initialization
        setMutableExercises([...activeDay.exercises]);
        setSessionLog(activeDay.exercises.map((ex: RoutineExercise) => ({
            exerciseId: ex.exerciseId || "temp-id",
            exerciseName: ex.exerciseName,
            sets: ex.sets.map((set: RoutineSet) => ({
                reps: "",
                weight: "",
                rpe: "",
                completed: false,
                targetReps: set.reps, // Keep reference to target
            })),
            feedback: "",
            exerciseIdUsed: ex.exerciseId || "temp-id"
        })));
    }, [activeDay, routine.id]);

    // 2. Persistence Effect (Save on Change)
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

    // Cargar ejercicios disponibles para el selector (solo atletas avanzados)
    useEffect(() => {
        if (!isAdvanced) return;
        getExercises().then(res => {
            if (res.success && res.exercises) {
                setAvailableExercises(res.exercises.map((ex: any) => ({ id: ex.id, name: ex.name })));
            }
        });
    }, [isAdvanced]);

    // --- Handlers de edición de rutina (solo advanced_athlete) ---

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
            // Cambiar ejercicio
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
                        ...s,
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
            // Agregar ejercicio
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

        // IA Proactiva: Feedback en tiempo real
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
                                // Aplicar sugerencia al siguiente set si existe
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

        // Transform data to fit Schema
        const logData = {
            routineId: routine.id,
            dayId: activeDay.id || activeDay.name, // Fallback if no specific ID
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
                // Clear storage on success
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
                // Clear storage as it is now in offline queue
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

    if (!activeDay) return <div className="p-10 text-center">No hay día activo seleccionado.</div>;
    
    // Si la rutina NO es libre y no hay ejercicios, mostramos cargando. (Si es libre, length es 0)
    const isFreeWorkout = routine.id.startsWith('free_workout');
    if (mutableExercises.length === 0 && sessionLog.length === 0 && !isFreeWorkout) {
        return <div className="p-10 text-center">Cargando...</div>;
    }

    if (!isStarted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 space-y-8 pb-24 animate-in fade-in duration-500">
                <ClientMotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-3"
                >
                    <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                        {cleanRoutineName}
                    </h1>
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px w-8 bg-red-600/30" />
                        <p className="text-sm md:text-base font-black text-red-500 uppercase tracking-[0.4em] italic">
                            {cleanDayName}
                        </p>
                        <div className="h-px w-8 bg-red-600/30" />
                    </div>
                </ClientMotionDiv>

                <ClientMotionDiv
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-md bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl p-8 space-y-8 relative overflow-hidden group shadow-2xl"
                >
                    <div className="absolute inset-0 bg-linear-to-br from-red-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3 text-neutral-400">
                            <Activity className="w-5 h-5 text-red-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sesión de Entrenamiento</span>
                        </div>
                        <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">{mutableExercises.length} Ejercicios</span>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {mutableExercises.length === 0 ? (
                            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                                <Dumbbell className="w-10 h-10 text-neutral-800" />
                                <p className="text-neutral-500 font-bold text-sm tracking-tight">Sesión en blanco lista.</p>
                                <p className="text-neutral-600 text-[10px] uppercase font-black tracking-widest px-4">
                                    Podrás agregar ejercicios libremente al iniciar.
                                </p>
                            </div>
                        ) : (
                            mutableExercises.map((ex, i) => (
                                <div key={i} className="flex items-center gap-4 group/item">
                                    <div className="h-8 w-8 rounded-xl bg-neutral-950 border border-white/5 flex items-center justify-center text-[10px] font-black text-neutral-600 group-hover/item:text-red-500 group-hover/item:border-red-600/30 transition-all duration-300">
                                        {String(i + 1).padStart(2, '0')}
                                    </div>
                                    <span className="text-neutral-400 font-bold text-sm tracking-tight group-hover/item:text-white transition-colors">
                                        {ex.exerciseName}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </ClientMotionDiv>

                <div className="w-full max-w-md pt-4">
                    <Button
                        onClick={() => setIsStarted(true)}
                        className="w-full h-16 text-xl font-black italic bg-white text-black hover:bg-neutral-200 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                        <Play className="w-6 h-6 mr-2 fill-black" />
                        INICIAR
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard')}
                        className="w-full mt-4 text-neutral-500 hover:text-white cursor-pointer"
                    >
                        Volver
                    </Button>
                </div>
            </div>
        );
    }

    // Get current exercise data
    const currentExercise = mutableExercises[currentExerciseIndex];
    const currentLogExercise = sessionLog[currentExerciseIndex];

    // Check if it's an empty started session
    if (isStarted && mutableExercises.length === 0 && isAdvanced) {
        return (
            <div className="max-w-3xl mx-auto pb-24 space-y-6 pt-4">
                <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-3xl border-b border-white/5 py-4 px-4 -mx-4 md:rounded-b-4xl md:mx-0 shadow-2xl transition-all duration-300">
                    <div className="flex justify-between items-center max-w-3xl mx-auto gap-4">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-bold text-white tracking-tight truncate uppercase italic">
                                Rutina Libre
                            </h2>
                        </div>
                        <div className="flex gap-2 items-center shrink-0">
                            <Button
                                onClick={() => setShowCancelDialog(true)}
                                variant="ghost"
                                className="text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all h-9 px-3"
                            >
                                Abortar
                            </Button>
                            <Button
                                onClick={handleFinishClick}
                                disabled={isSubmitting}
                                className="hidden lg:flex rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all h-9 px-4 shadow-lg shadow-white/5"
                            >
                                Finalizar
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 border border-dashed border-white/10 rounded-3xl bg-neutral-900/20">
                    <Dumbbell className="w-16 h-16 text-neutral-800" />
                    <div className="space-y-2 max-w-xs">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Sesión Vacía</h3>
                        <p className="text-xs text-neutral-500 font-bold">Inicia tu entrenamiento añadiendo el primer ejercicio de tu rutina libre.</p>
                    </div>
                    <Button
                        onClick={openAddSelector}
                        className="h-14 px-8 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl group"
                    >
                        <Plus className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                        Agregar Ejercicio
                    </Button>
                </div>

                {isAdvanced && (
                    <ExerciseSelector
                        open={showExerciseSelector}
                        onOpenChange={setShowExerciseSelector}
                        onSelect={handleExerciseSelected}
                        availableExercises={availableExercises}
                        title={exerciseSelectorMode === "swap" ? "Cambiar Ejercicio" : "Agregar Ejercicio"}
                    />
                )}
                
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
            </div>
        );
    }
    
    if (!currentExercise || !currentLogExercise) return <div className="p-10 text-center">Cargando...</div>;

    return (
        <div className="max-w-3xl mx-auto pb-24 space-y-6">
            {/* Header Sticky */}
            <div className="sticky top-0 z-50 bg-black/40 backdrop-blur-3xl border-b border-white/5 py-4 px-4 -mx-4 md:rounded-b-4xl md:mx-0 shadow-2xl transition-all duration-300">
                <div className="flex justify-between items-center max-w-3xl mx-auto gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-lg">
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">
                                    EJ {currentExerciseIndex + 1}/{mutableExercises.length}
                                </span>
                            </div>
                            <h2 className="text-base font-bold text-white tracking-tight truncate uppercase italic">
                                {currentLogExercise?.exerciseName}
                            </h2>
                            {isAdvanced && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openSwapSelector(currentExerciseIndex)}
                                    className="h-7 w-7 rounded-lg text-neutral-500 hover:text-amber-400 hover:bg-amber-400/10 transition-all shrink-0"
                                    title="Cambiar ejercicio"
                                >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 items-center shrink-0">
                        <AIAssistantDialog
                            muscleGroups={[currentExercise?.exerciseName || "General"]}
                            availableExercises={[currentExercise?.exerciseName]}
                        />

                        <div className="h-6 w-px bg-white/5 mx-1" />

                        <Button
                            onClick={() => setShowCancelDialog(true)}
                            variant="ghost"
                            className="text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all h-9 px-3"
                        >
                            Abortar
                        </Button>

                        <Button
                            onClick={handleFinishClick}
                            disabled={isSubmitting}
                            className="hidden lg:flex rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all h-9 px-4 shadow-lg shadow-white/5"
                        >
                            Finalizar
                        </Button>
                    </div>
                </div>

                {/* Progress Bar Area */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-900 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentExerciseIndex + 1) / mutableExercises.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                        className="h-full bg-linear-to-r from-red-600 to-red-400 shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                    />
                </div>
            </div>

            {/* Current Exercise Card */}
            <div className="space-y-6 min-h-[50vh] relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentExerciseIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, ease: "circOut" }}
                        className="bg-neutral-900/40 backdrop-blur-3xl rounded-4xl border border-white/5 overflow-hidden shadow-2xl relative"
                    >
                        {/* Static Glow decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

                        <div className="bg-white/2 border-b border-white/5 p-6 md:p-8 space-y-4">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                                            {currentLogExercise.exerciseName}
                                        </h3>
                                        {isAdvanced && (
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
                                        <Info className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
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
                            <div className="grid grid-cols-12 gap-1 md:gap-3 mb-4 px-4 text-[10px] font-black text-neutral-500 text-center uppercase tracking-[0.2em] bg-white/2 py-3 rounded-2xl border border-white/5">
                                <div className="hidden md:block md:col-span-1 italic">SQ</div>
                                <div className="col-span-2 md:col-span-3 italic">Objetivo</div>
                                <div className="col-span-3 md:col-span-2 italic">Carga (kg)</div>
                                <div className="col-span-3 md:col-span-2 italic">Reps</div>
                                <div className="col-span-2 italic">RPE</div>
                                <div className="col-span-2 md:col-span-2 italic">Status</div>
                            </div>

                            <div className="space-y-3">
                                {currentExercise.sets.map((set: RoutineSet, setIndex: number) => {
                                    const logSet = currentLogExercise.sets[setIndex];
                                    const isCompleted = logSet?.completed;
                                    const historySet = historySets[setIndex];

                                    return (
                                        <div
                                            key={setIndex}
                                            className={cn(
                                                "grid grid-cols-12 gap-1 md:gap-3 p-2 md:p-3 rounded-2xl items-center transition-all duration-500 relative overflow-hidden group/set border",
                                                isCompleted
                                                    ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]"
                                                    : "bg-neutral-900 border-white/5 hover:border-white/10"
                                            )}
                                        >
                                            <div className="hidden md:flex md:col-span-1 justify-center z-10">
                                                <span className={cn(
                                                    "text-[10px] font-black w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-300",
                                                    isCompleted ? "bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" :
                                                        set.type === 'warmup' ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
                                                            set.type === 'failure' ? "text-red-500 bg-red-500/10 border-red-500/20" :
                                                                "text-neutral-500 bg-neutral-950 border-white/5"
                                                )}>
                                                    {setIndex + 1}
                                                </span>
                                            </div>

                                            <div className="col-span-2 md:col-span-3 text-center z-10">
                                                <div className="text-white font-black text-sm md:text-base italic leading-tight">{set.reps}</div>
                                                {set.rpeTarget && <div className="text-[9px] text-neutral-500 font-black uppercase tracking-widest mt-0.5">RPE {set.rpeTarget}</div>}
                                            </div>

                                            <div className="col-span-3 md:col-span-2 relative z-10">
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder={historySet ? `${historySet.weight}` : "-"}
                                                    value={logSet?.weight}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(",", ".");
                                                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                            updateSet(currentExerciseIndex, setIndex, "weight", val);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "h-12 md:h-14 px-0 text-center text-lg md:text-2xl font-black border-0 bg-neutral-950 rounded-xl focus:ring-2 focus:ring-white/10 transition-all placeholder:text-neutral-800 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none italic",
                                                        isCompleted && "text-emerald-400 bg-emerald-950/20 ring-1 ring-emerald-500/30"
                                                    )}
                                                />
                                            </div>

                                            <div className="col-span-3 md:col-span-2 relative z-10">
                                                <Input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder={historySet ? `${historySet.reps}` : "-"}
                                                    value={logSet?.reps}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(",", ".");
                                                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                            updateSet(currentExerciseIndex, setIndex, "reps", val);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "h-12 md:h-14 px-0 text-center text-lg md:text-2xl font-black border-0 bg-neutral-950 rounded-xl focus:ring-2 focus:ring-white/10 transition-all placeholder:text-neutral-800 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none italic",
                                                        isCompleted && "text-emerald-400 bg-emerald-950/20 ring-1 ring-emerald-500/30"
                                                    )}
                                                />
                                            </div>

                                            <div className="col-span-2 relative z-10">
                                                <Select
                                                    value={logSet?.rpe?.toString() || ""}
                                                    onValueChange={(val) => updateSet(currentExerciseIndex, setIndex, "rpe", val)}
                                                >
                                                    <SelectTrigger
                                                        className={cn(
                                                            "h-12 md:h-14 w-full px-0 justify-center text-center text-lg md:text-2xl font-black border-0 bg-neutral-950 rounded-xl focus:ring-2 focus:ring-white/10 transition-all text-white [&>svg]:hidden italic",
                                                            isCompleted && "text-emerald-400 bg-emerald-950/20 ring-1 ring-emerald-500/30"
                                                        )}
                                                    >
                                                        <SelectValue placeholder={historySet ? `${historySet.rpe}` : "-"} />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-white/10 text-white min-w-[60px] rounded-2xl backdrop-blur-3xl">
                                                        {[10, 9, 8, 7, 6, 5].map((val) => (
                                                            <SelectItem
                                                                key={val}
                                                                value={val.toString()}
                                                                className="justify-center focus:bg-red-600 focus:text-white font-black italic"
                                                            >
                                                                {val}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="col-span-2 md:col-span-2 flex justify-center z-10">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => toggleSetComplete(currentExerciseIndex, setIndex)}
                                                    className={cn(
                                                        "h-12 w-12 md:h-14 md:w-14 rounded-xl transition-all duration-500 border",
                                                        isCompleted
                                                            ? "bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-110"
                                                            : "bg-neutral-950 text-neutral-700 border-white/5 hover:border-red-600/30 hover:text-white"
                                                    )}
                                                >
                                                    <Check className={cn("w-6 h-6 md:w-8 md:h-8 transition-transform", isCompleted ? "scale-110" : "scale-100")} />
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
                                    onChange={(e) => {
                                        const newLog = [...sessionLog];
                                        newLog[currentExerciseIndex].feedback = e.target.value;
                                        setSessionLog(newLog);
                                    }}
                                    className="bg-neutral-950/50 border border-white/5 rounded-2xl px-6 py-8 text-sm text-neutral-300 focus-visible:ring-1 focus-visible:ring-red-600/50 placeholder:text-neutral-700 transition-all"
                                />
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Botón agregar ejercicio (solo advanced_athlete) */}
            {isAdvanced && (
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

            {/* Navigation Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/40 backdrop-blur-3xl border-t border-white/5 flex justify-between items-center gap-6 z-50 animate-in slide-in-from-bottom-full duration-700 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
                <div className="max-w-3xl mx-auto w-full flex justify-between items-center gap-6">
                    <Button
                        onClick={handlePrevExercise}
                        disabled={currentExerciseIndex === 0}
                        className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-neutral-900/50 border border-white/5 text-white hover:bg-white/10 disabled:opacity-20 transition-all shadow-xl group"
                    >
                        <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-x-1 transition-transform" />
                    </Button>

                    <div className="flex-1 flex flex-col items-center justify-center gap-1">
                        <span className="text-[9px] uppercase font-black text-neutral-500 tracking-[0.3em] italic">Ejercicio Actual</span>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-white italic tracking-tighter">
                                <span className="text-red-600">{currentExerciseIndex + 1}</span>
                                <span className="text-neutral-700 mx-1">/</span>
                                {mutableExercises.length}
                            </span>
                        </div>
                    </div>

                    <Button
                        onClick={handleNextExercise}
                        className={cn(
                            "h-14 md:h-16 px-6 md:px-8 rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95 flex items-center gap-3",
                            currentExerciseIndex === mutableExercises.length - 1
                                ? "bg-red-600 text-white hover:bg-red-500 shadow-red-900/40"
                                : "bg-white text-black hover:bg-neutral-200 shadow-white/20"
                        )}
                    >
                        <span>{currentExerciseIndex === mutableExercises.length - 1 ? "Finalizar" : "Siguiente"}</span>
                        {currentExerciseIndex === mutableExercises.length - 1 ? (
                            <Trophy className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                        )}
                    </Button>
                </div>
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

            {/* Selector de ejercicios (solo advanced_athlete) */}
            {isAdvanced && (
                <ExerciseSelector
                    open={showExerciseSelector}
                    onOpenChange={setShowExerciseSelector}
                    onSelect={handleExerciseSelected}
                    availableExercises={availableExercises}
                    title={exerciseSelectorMode === "swap" ? "Cambiar Ejercicio" : "Agregar Ejercicio"}
                />
            )}
        </div>
    );
}
