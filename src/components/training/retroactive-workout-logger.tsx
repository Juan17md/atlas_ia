"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Plus,
    Trash2,
    Loader2,
    ChevronLeft,
    Calendar,
    Clock,
    Dumbbell,
    Save,
    Zap,
    RefreshCw,
} from "lucide-react";
import { logRetroactiveWorkout, RetroactiveWorkoutData, getWorkoutLogByDate, TrainingLogDbData } from "@/actions/training-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { fechaLocalAString } from "@/lib/fecha-utils";
import { ExerciseSelector } from "@/components/routines/exercise-selector";
import { getExercises } from "@/actions/exercise-actions";

// --- INTERFACES ---

interface RetroSet {
    weight: string;
    reps: string;
    rpe: string;
    targetReps?: string;
    targetRpe?: string;
}

interface RetroExercise {
    exerciseName: string;
    exerciseId: string;
    feedback: string;
    sets: RetroSet[];
}

// Tipo para la rutina si se pasa como prop
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

export function RetroactiveWorkoutLogger({ routineDay, routineId, routineName: initialRoutineName, defaultDate, onBack, userRole }: RetroactiveWorkoutLoggerProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingLogId, setExistingLogId] = useState<string | undefined>();
    const [existingSessionId, setExistingSessionId] = useState<string | undefined>();
    const [isLoadingLog, setIsLoadingLog] = useState(false);

    const isAdvanced = userRole === "advanced_athlete";
    // Permite editar si no hay routineDay (modo libre) O si es atleta avanzado
    const canEdit = !routineDay || isAdvanced;

    // Estado para el selector de ejercicios
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [exerciseSelectorMode, setExerciseSelectorMode] = useState<"swap" | "add">("add");
    const [swapTargetIndex, setSwapTargetIndex] = useState<number>(-1);
    const [availableExercises, setAvailableExercises] = useState<{ id: string; name: string }[]>([]);

    // Formulario global
    const [routineNameState, setRoutineNameState] = useState(() => {
        return (initialRoutineName || "").replace(/\s*\(Assigned\)/gi, "").trim();
    });
    const [date, setDate] = useState(() => {
        if (defaultDate) return defaultDate;
        return fechaLocalAString(new Date());
    });
    const [durationMinutes, setDurationMinutes] = useState("60");
    const [sessionRpe, setSessionRpe] = useState(7);
    const [sessionNotes, setSessionNotes] = useState("");

    // Ejercicios — inicializados desde la rutina si se pasa, o vacío
    const [exercises, setExercises] = useState<RetroExercise[]>(() => {
        if (routineDay?.exercises?.length) {
            return routineDay.exercises.map((ex) => ({
                exerciseName: ex.exerciseName,
                exerciseId: ex.exerciseId || "",
                feedback: "",
                sets: ex.sets.map((s) => ({
                    weight: "",
                    reps: "",
                    rpe: s.rpeTarget?.toString() || "8", // Precargar RPE objetivo o default 8
                    targetReps: s.reps?.toString(),
                    targetRpe: s.rpeTarget?.toString(),
                })),
            }));
        }
        // Por defecto, 1 ejercicio con 3 series
        return [createEmptyExercise()];
    });

    function createEmptyExercise(): RetroExercise {
        return {
            exerciseName: "",
            exerciseId: "",
            feedback: "",
            sets: [{ weight: "", reps: "", rpe: "8" }], // Por defecto RPE 8 para evitar vacíos
        };
    }

    // Efecto para buscar si hay un log existente en la fecha seleccionada
    useEffect(() => {
        let isMounted = true;
        const checkExistingLog = async () => {
            setIsLoadingLog(true);
            try {
                const res = await getWorkoutLogByDate(date);
                if (!isMounted) return;

                if (res.success && res.log) {
                    const log: TrainingLogDbData = res.log;
                    setExistingLogId(log.id);
                    setExistingSessionId(log.sessionId);
                    setRoutineNameState(log.routineName || "");
                    setDurationMinutes(String(log.durationMinutes || "60"));
                    setSessionRpe(log.sessionRpe || 7);
                    setSessionNotes(log.sessionNotes || "");

                    if (log.exercises && log.exercises.length > 0) {
                        setExercises(log.exercises.map((ex: any) => ({
                            exerciseName: ex.exerciseName || "",
                            exerciseId: ex.exerciseId || "",
                            feedback: ex.feedback || "",
                            sets: (ex.sets || []).map((s: any) => ({
                                weight: s.weight ? String(s.weight) : "",
                                reps: s.reps ? String(s.reps) : "",
                                rpe: s.rpe ? String(s.rpe) : "8",
                            })),
                        })));
                        toast.info("Cargaste un entrenamiento previo para editar.", { duration: 2500 });
                    }
                } else {
                    setExistingLogId(undefined);
                    setExistingSessionId(undefined);

                    if (routineDay?.exercises?.length) {
                        setRoutineNameState((initialRoutineName || "").replace(/\s*\(Assigned\)/gi, "").trim());
                        setDurationMinutes("60");
                        setSessionRpe(7);
                        setSessionNotes("");
                        setExercises(routineDay.exercises.map((ex) => ({
                            exerciseName: ex.exerciseName,
                            exerciseId: ex.exerciseId || "",
                            feedback: "",
                            sets: ex.sets.map((s) => ({
                                weight: "",
                                reps: "",
                                rpe: s.rpeTarget?.toString() || "8",
                                targetReps: s.reps?.toString(),
                                targetRpe: s.rpeTarget?.toString(),
                            })),
                        })));
                    } else if (res.log === null && existingLogId) {
                        setRoutineNameState((initialRoutineName || "").replace(/\s*\(Assigned\)/gi, "").trim());
                        setDurationMinutes("60");
                        setSessionRpe(7);
                        setSessionNotes("");
                        setExercises([createEmptyExercise()]);
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (isMounted) setIsLoadingLog(false);
            }
        };

        checkExistingLog();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, initialRoutineName]);

    // Cargar ejercicios disponibles para el selector (solo atletas avanzados)
    useEffect(() => {
        if (!isAdvanced) return;
        getExercises().then(res => {
            if (res.success && res.exercises) {
                setAvailableExercises(res.exercises.map((ex: any) => ({ id: ex.id, name: ex.name })));
            }
        });
    }, [isAdvanced]);

    // --- Handlers para ejercicios ---

    const addExercise = () => {
        setExercises((prev) => [...prev, createEmptyExercise()]);
    };

    const openAddSelector = () => {
        setExerciseSelectorMode("add");
        setSwapTargetIndex(-1);
        setShowExerciseSelector(true);
    };

    const openSwapSelector = (index: number) => {
        setExerciseSelectorMode("swap");
        setSwapTargetIndex(index);
        setShowExerciseSelector(true);
    };

    const handleExerciseSelected = (exercise: { id?: string; name: string }) => {
        if (exerciseSelectorMode === "swap" && swapTargetIndex >= 0) {
            setExercises((prev) => {
                const copy = [...prev];
                copy[swapTargetIndex] = {
                    ...copy[swapTargetIndex],
                    exerciseName: exercise.name,
                    exerciseId: exercise.id || "",
                    sets: copy[swapTargetIndex].sets.map(s => ({ ...s, weight: "", reps: "", rpe: "8" })),
                };
                return copy;
            });
            toast.success(`Ejercicio cambiado a: ${exercise.name}`);
        } else {
            setExercises((prev) => [
                ...prev,
                {
                    exerciseName: exercise.name,
                    exerciseId: exercise.id || "",
                    feedback: "",
                    sets: [{ weight: "", reps: "", rpe: "8" }],
                },
            ]);
            toast.success(`Ejercicio añadido: ${exercise.name}`);
        }
        setShowExerciseSelector(false);
    };

    const removeExercise = (index: number) => {
        if (exercises.length <= 1) return;
        setExercises((prev) => prev.filter((_, i) => i !== index));
    };

    const updateExercise = (index: number, field: keyof RetroExercise, value: string) => {
        setExercises((prev) => {
            const copy = [...prev];
            (copy[index] as unknown as Record<string, unknown>)[field] = value;
            return copy;
        });
    };

    // --- Handlers para series ---

    const addSet = (exIndex: number) => {
        setExercises((prev) => {
            const copy = [...prev];
            const lastSet = copy[exIndex].sets[copy[exIndex].sets.length - 1];
            // Duplicar el último set para conveniencia
            copy[exIndex].sets.push({ ...lastSet });
            return copy;
        });
    };

    const removeSet = (exIndex: number, setIndex: number) => {
        if (exercises[exIndex].sets.length <= 1) return;
        setExercises((prev) => {
            const copy = [...prev];
            copy[exIndex].sets = copy[exIndex].sets.filter((_, i) => i !== setIndex);
            return copy;
        });
    };

    const updateSet = (exIndex: number, setIndex: number, field: keyof RetroSet, value: string) => {
        setExercises((prev) => {
            const copy = [...prev];
            copy[exIndex].sets[setIndex][field] = value;
            return copy;
        });
    };

    // --- Enviar ---

    const handleSubmit = async () => {
        // Validación básica en cliente
        const hasInvalidExercise = exercises.some((ex) => !ex.exerciseName.trim());
        if (hasInvalidExercise) {
            toast.error("Todos los ejercicios deben tener un nombre.");
            return;
        }

        setIsSubmitting(true);

        const payload: RetroactiveWorkoutData = {
            id: existingLogId,
            sessionId: existingSessionId,
            routineId: routineId || undefined,
            dayId: routineDay?.id || undefined,
            routineName: routineNameState.trim() || undefined,
            date,
            durationMinutes: Number(durationMinutes),
            sessionRpe,
            sessionNotes,
            exercises: exercises.map((ex) => ({
                exerciseId: ex.exerciseId || undefined,
                exerciseName: ex.exerciseName,
                feedback: ex.feedback,
                sets: ex.sets
                    .filter((s) => s.weight || s.reps)
                    .map((s) => ({
                        weight: Number(s.weight) || 0,
                        reps: Number(s.reps) || 0,
                        rpe: s.rpe ? Number(s.rpe) : undefined,
                        completed: true,
                    })),
            })),
        };

        try {
            const res = await logRetroactiveWorkout(payload);
            if (res.success) {
                toast.success("¡Entrenamiento registrado!", {
                    description: "Se ha guardado tu sesión correctamente.",
                });
                router.push("/dashboard");
            } else {
                toast.error(res.error || "Error desconocido");
            }
        } catch {
            toast.error("Error de conexión al guardar el entrenamiento.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Helpers UI ---

    const getRpeColor = (value: number) => {
        if (value <= 4) return "text-green-500";
        if (value <= 7) return "text-yellow-500";
        return "text-red-500";
    };

    const getRpeLabel = (value: number) => {
        if (value <= 2) return "Muy Fácil";
        if (value <= 4) return "Suave";
        if (value <= 6) return "Moderado";
        if (value <= 8) return "Duro";
        if (value <= 9) return "Muy Duro";
        return "Máximo Esfuerzo";
    };

    return (
        <div className="max-w-2xl mx-auto pb-32 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onBack ? onBack() : router.back()}
                    className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 shrink-0"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Registrar Entrenamiento
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-500">
                        Historial retroactivo de sesiones completadas
                    </p>
                </div>
            </div>

            {/* Metadatos de la sesión */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-5 space-y-5 shadow-lg shadow-black/20">
                <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    <Dumbbell className="w-3.5 h-3.5" />
                    Detalles de la Sesión
                </div>

                <div className="space-y-4">
                    {/* Nombre de la Rutina */}
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                            Nombre de la rutina
                        </Label>
                        <div className="relative">
                            <Dumbbell className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                            <Input
                                value={routineNameState}
                                onChange={(e) => setRoutineNameState(e.target.value)}
                                disabled={!!routineDay}
                                placeholder="Ej: Push Day, Torso Pesado..."
                                className="bg-neutral-950 border-neutral-800 text-white font-semibold rounded-xl focus:ring-1 focus:ring-white/20 h-12 pl-10 placeholder:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Fecha */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                Fecha
                            </Label>
                            <div className="relative">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                                <Input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    max={fechaLocalAString(new Date())}
                                    className="h-12 bg-neutral-950 border-neutral-800 text-white font-bold rounded-xl text-left pl-10 focus:ring-1 focus:ring-white/20 scheme-dark text-sm uppercase"
                                />
                            </div>
                        </div>

                        {/* Duración - Oculto temporalmente 
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                Duración (min)
                            </Label>
                            <div className="relative">
                                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none" />
                                <Input
                                    type="number"
                                    inputMode="numeric"
                                    value={durationMinutes}
                                    onChange={(e) => setDurationMinutes(e.target.value)}
                                    placeholder="60"
                                    className="h-12 bg-neutral-950 border-neutral-800 text-white font-bold rounded-xl text-left pl-10 focus:ring-1 focus:ring-white/20 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>
                        */}
                    </div>
                </div>
            </div>

            {/* Ejercicios */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                        <Dumbbell className="w-3.5 h-3.5" />
                        Ejercicios ({exercises.length})
                    </div>
                    {canEdit && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={isAdvanced ? openAddSelector : addExercise}
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-bold"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Añadir
                        </Button>
                    )}
                </div>

                {exercises.map((exercise, exIndex) => (
                    <div
                        key={exIndex}
                        className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm hover:border-neutral-700 transition-colors"
                    >
                        {/* Cabecera del ejercicio */}
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

                        {/* Series */}
                        <div className="p-3 sm:p-4 space-y-2">
                            {/* Header de series - Grid optimizado para móvil */}
                            <div className="grid grid-cols-[20px_1fr_1fr_1fr_20px] sm:grid-cols-[28px_1fr_1fr_1fr_28px] gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] uppercase font-bold text-neutral-500 text-center tracking-wider mb-2">
                                <div>#</div>
                                <div>Kg</div>
                                <div>Reps</div>
                                <div>RPE</div>
                                <div></div>
                            </div>

                            {exercise.sets.map((set, setIndex) => (
                                <div
                                    key={setIndex}
                                    className="grid grid-cols-[20px_1fr_1fr_1fr_20px] sm:grid-cols-[28px_1fr_1fr_1fr_28px] gap-1 sm:gap-1.5 items-center group"
                                >
                                    <div className="flex justify-center">
                                        <span className="bg-neutral-800/50 text-neutral-500 text-[9px] sm:text-[10px] font-black w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full shrink-0">
                                            {setIndex + 1}
                                        </span>
                                    </div>
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={set.weight}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(",", ".");
                                            if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                updateSet(exIndex, setIndex, "weight", val);
                                            }
                                        }}
                                        placeholder="-"
                                        className="h-9 sm:h-11 text-center text-sm sm:text-base font-bold bg-neutral-900 border-neutral-800 focus:border-neutral-700 text-white rounded-lg sm:rounded-xl focus:ring-1 focus:ring-white/20 px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-neutral-800 transition-all placeholder:font-normal"
                                    />
                                    <Input
                                        type="text"
                                        inputMode="decimal"
                                        value={set.reps}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(",", ".");
                                            if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                updateSet(exIndex, setIndex, "reps", val);
                                            }
                                        }}
                                        placeholder={set.targetReps || "-"}
                                        className="h-9 sm:h-11 text-center text-sm sm:text-base font-bold bg-neutral-900 border-neutral-800 focus:border-neutral-700 text-white rounded-lg sm:rounded-xl focus:ring-1 focus:ring-white/20 px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-neutral-600 transition-all placeholder:font-normal"
                                    />
                                    <Select
                                        value={set.rpe || ""}
                                        onValueChange={(val) => updateSet(exIndex, setIndex, "rpe", val)}
                                    >
                                        <SelectTrigger
                                            className="h-9 sm:h-11 w-full justify-center text-center text-sm sm:text-base font-bold bg-neutral-900 border-neutral-800 focus:border-neutral-700 text-white rounded-lg sm:rounded-xl focus:ring-1 focus:ring-white/20 px-0 [&>svg]:hidden transition-all"
                                        >
                                            <SelectValue placeholder={set.targetRpe || "-"} />
                                        </SelectTrigger>
                                        <SelectContent className="bg-neutral-900 border-neutral-800 text-white min-w-[60px]">
                                            {[10, 9, 8, 7, 6, 5].map((val) => (
                                                <SelectItem key={val} value={val.toString()} className="justify-center focus:bg-neutral-800 focus:text-white">
                                                    {val}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex justify-center">
                                        {canEdit && exercise.sets.length > 1 ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeSet(exIndex, setIndex)}
                                                className="h-6 w-6 sm:h-7 sm:w-7 text-neutral-700 hover:text-red-500 hover:bg-red-500/10 rounded-md sm:rounded-lg transition-colors shrink-0"
                                            >
                                                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                            </Button>
                                        ) : (
                                            <div className="w-6 h-6 sm:w-7 sm:h-7" />
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Añadir serie */}
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

                            {/* Notas del ejercicio */}
                            <Input
                                value={exercise.feedback}
                                onChange={(e) => updateExercise(exIndex, "feedback", e.target.value)}
                                placeholder="Notas del ejercicio (opcional)..."
                                className="bg-transparent border-0 border-b border-neutral-800 rounded-none px-0 text-sm text-neutral-400 focus-visible:ring-0 focus-visible:border-neutral-600 placeholder:text-neutral-700 py-2"
                            />
                        </div>
                    </div>
                ))}

                {/* Botón añadir ejercicio al final */}
                {canEdit && (
                    <Button
                        variant="outline"
                        onClick={isAdvanced ? openAddSelector : addExercise}
                        className="w-full h-12 border border-dashed border-neutral-800 bg-neutral-900/30 text-neutral-500 hover:text-white hover:bg-neutral-800 hover:border-neutral-700 rounded-xl transition-all group"
                    >
                        <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Añadir Ejercicio</span>
                    </Button>
                )}
            </div>

            {/* Feedback de sesión */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-4 sm:p-6 space-y-5">
                <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    <Zap className="w-3.5 h-3.5" />
                    Percepción de la Sesión
                </div>

                {/* RPE Sesión */}
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <Label className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                            Esfuerzo Global (RPE)
                        </Label>
                        <span className={cn("text-3xl font-black tabular-nums transition-colors", getRpeColor(sessionRpe))}>
                            {sessionRpe}
                            <span className="text-sm text-neutral-600 font-bold">/10</span>
                        </span>
                    </div>

                    <Slider
                        value={[sessionRpe]}
                        onValueChange={(vals) => setSessionRpe(vals[0])}
                        max={10}
                        min={1}
                        step={1}
                        className="py-4 cursor-pointer"
                    />

                    <p className="text-center text-sm font-medium text-neutral-400 bg-neutral-950 py-3 px-2 rounded-xl border border-neutral-800">
                        {getRpeLabel(sessionRpe)}
                    </p>
                </div>

                {/* Notas generales */}
                <div className="space-y-2">
                    <Label className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                        Notas de Sesión (Opcional)
                    </Label>
                    <Textarea
                        placeholder="¿Cómo te sentiste? ¿Algo a destacar?"
                        className="bg-neutral-950 border-neutral-800 focus:border-neutral-700 min-h-[80px] resize-none rounded-xl text-sm"
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                    />
                </div>
            </div>

            {/* Botón de guardar fijo */}
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
