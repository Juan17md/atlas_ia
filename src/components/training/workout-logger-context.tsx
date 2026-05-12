"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logRetroactiveWorkout, getWorkoutLogByDate, TrainingLogDbData, markAsRestDay, RetroactiveWorkoutData } from "@/actions/training-logs";
import { analyzeWorkoutSession } from "@/actions/chat-actions";
import { getExercises } from "@/actions/exercise-actions";
import { obtenerFechaISOLocal } from "@/lib/fecha-utils";
import { useOfflineSync } from "@/hooks/use-offline-sync";

// --- INTERFACES ---

export interface RetroSet {
    weight: string;
    reps: string;
    rpe: string;
    targetReps?: string;
    targetRpe?: string;
}

export interface RetroExercise {
    exerciseName: string;
    exerciseId: string;
    feedback: string;
    sets: RetroSet[];
}

// --- STATE CONTEXT (cambia frecuentemente) ---

interface WorkoutLoggerStateType {
    routineName: string;
    date: string;
    sessionRpe: number;
    sessionNotes: string;
    exercises: RetroExercise[];
    isSubmitting: boolean;
    isLoadingLog: boolean;
    existingLogId?: string;
    existingSessionId?: string;
    aiFeedback: string | null;
    isAnalyzing: boolean;
    showAiModal: boolean;
    showExerciseSelector: boolean;
    exerciseSelectorMode: "swap" | "add" | "insert";
    targetIndex: number;
    availableExercises: { id: string; name: string; muscleGroups?: string[] }[];
    showConfirmDialog: boolean;
    pendingActionType: "save" | "rest" | null;
    canUseSelector?: boolean;
}

// --- DISPATCH CONTEXT (referencias estables) ---

interface WorkoutLoggerDispatchType {
    setRoutineName: (v: string) => void;
    setDate: (v: string) => void;
    setSessionRpe: (v: number) => void;
    setSessionNotes: (v: string) => void;
    setExercises: Dispatch<SetStateAction<RetroExercise[]>>;
    setShowAiModal: (v: boolean) => void;
    setShowExerciseSelector: (v: boolean) => void;
    setExerciseSelectorMode: (v: "swap" | "add" | "insert") => void;
    setTargetIndex: (v: number) => void;
    setShowConfirmDialog: (v: boolean) => void;
    setPendingActionType: (v: "save" | "rest" | null) => void;
    addExercise: () => void;
    openAddSelector: () => void;
    openSwapSelector: (index: number) => void;
    openInsertSelector: (index: number) => void;
    handleExerciseSelected: (exercise: { id?: string; name: string }) => void;
    removeExercise: (index: number) => void;
    updateExercise: (index: number, field: keyof RetroExercise, value: string) => void;
    addSet: (exIndex: number) => void;
    removeSet: (exIndex: number, setIndex: number) => void;
    updateSet: (exIndex: number, setIndex: number, field: keyof RetroSet, value: string) => void;
    handleSubmit: () => Promise<void>;
    handleMarkRestWithConfirm: () => Promise<void>;
    confirmOverwrite: () => void;
    triggerAIAnalysis: (p: RetroactiveWorkoutData) => Promise<void>;
}

// --- CONTEXTOS SEPARADOS ---

const WorkoutLoggerStateContext = createContext<WorkoutLoggerStateType | undefined>(undefined);
const WorkoutLoggerDispatchContext = createContext<WorkoutLoggerDispatchType | undefined>(undefined);

// --- HOOKS ---

export function useWorkoutLoggerState() {
    const ctx = useContext(WorkoutLoggerStateContext);
    if (!ctx) throw new Error("useWorkoutLoggerState must be used within a WorkoutLoggerProvider");
    return ctx;
}

export function useWorkoutLoggerDispatch() {
    const ctx = useContext(WorkoutLoggerDispatchContext);
    if (!ctx) throw new Error("useWorkoutLoggerDispatch must be used within a WorkoutLoggerProvider");
    return ctx;
}

// Hook combinado para compatibilidad (consumidores que necesitan ambos)
export function useWorkoutLogger(): WorkoutLoggerStateType & WorkoutLoggerDispatchType {
    return { ...useWorkoutLoggerState(), ...useWorkoutLoggerDispatch() };
}

// --- PROVIDER ---

interface ProviderProps {
    children: ReactNode;
    initialRoutineName?: string;
    routineDay?: any;
    routineId?: string;
    defaultDate?: string;
    userRole?: string;
}

export function WorkoutLoggerProvider({ children, initialRoutineName, routineDay, routineId, defaultDate, userRole }: ProviderProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [existingLogId, setExistingLogId] = useState<string | undefined>();
    const [existingSessionId, setExistingSessionId] = useState<string | undefined>();
    const [isLoadingLog, setIsLoadingLog] = useState(false);
    
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingActionType, setPendingActionType] = useState<"save" | "rest" | null>(null);
    
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [exerciseSelectorMode, setExerciseSelectorMode] = useState<"swap" | "add" | "insert">("add");
    const [targetIndex, setTargetIndex] = useState<number>(-1);
    const [availableExercises, setAvailableExercises] = useState<{ id: string; name: string; muscleGroups?: string[] }[]>([]);
    
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);

    const [routineName, setRoutineName] = useState(() => (initialRoutineName || "").replace(/\s*\(Assigned\)/gi, "").trim());
    const [date, setDate] = useState(() => defaultDate || obtenerFechaISOLocal());
    const [sessionRpe, setSessionRpe] = useState(7);
    const [sessionNotes, setSessionNotes] = useState("");
    const { isOnline, saveLogLocally } = useOfflineSync();

    const createEmptyExercise = useCallback((): RetroExercise => ({
        exerciseName: "",
        exerciseId: "",
        feedback: "",
        sets: [{ weight: "", reps: "", rpe: "8" }],
    }), []);

    const [exercises, setExercises] = useState<RetroExercise[]>(() => {
        if (typeof window !== "undefined" && !routineId) {
            const draft = localStorage.getItem("gymia_workout_draft");
            if (draft) {
                try {
                    const parsed = JSON.parse(draft);
                    if (parsed.exercises && Array.isArray(parsed.exercises)) {
                        return parsed.exercises;
                    }
                } catch (e) { console.error("Error loading draft", e); }
            }
        }

        if (routineDay?.exercises?.length) {
            return routineDay.exercises.map((ex: any) => ({
                exerciseName: ex.exerciseName,
                exerciseId: ex.exerciseId || "",
                feedback: "",
                sets: ex.sets.map((s: any) => ({
                    weight: "",
                    reps: "",
                    rpe: s.rpeTarget?.toString() || "8",
                    targetReps: s.reps?.toString(),
                    targetRpe: s.rpeTarget?.toString(),
                })),
            }));
        }
        return [createEmptyExercise()];
    });

    // Guardar borrador automáticamente (Auto-save)
    useEffect(() => {
        if (!existingLogId && exercises.length > 0) {
            const timer = setTimeout(() => {
                const draft = {
                    routineName,
                    sessionRpe,
                    sessionNotes,
                    exercises,
                    date,
                    updatedAt: new Date().toISOString()
                };
                localStorage.setItem("gymia_workout_draft", JSON.stringify(draft));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [exercises, routineName, sessionRpe, sessionNotes, date, existingLogId]);

    useEffect(() => {
        if (!existingLogId && !routineId && typeof window !== "undefined") {
            const draftStr = localStorage.getItem("gymia_workout_draft");
            if (draftStr) {
                try {
                    const draft = JSON.parse(draftStr);
                    if (draft.routineName) setRoutineName(draft.routineName);
                    if (draft.sessionRpe) setSessionRpe(draft.sessionRpe);
                    if (draft.sessionNotes) setSessionNotes(draft.sessionNotes);
                } catch (e) { }
            }
        }
    }, [existingLogId, routineId]);

    useEffect(() => {
        let isMounted = true;
        const checkExistingLog = async () => {
            setIsLoadingLog(true);
            try {
                const res = await getWorkoutLogByDate(date);
                if (!isMounted) return;

                if (res.success && res.log) {
                    const log: TrainingLogDbData = res.log as any;
                    setExistingLogId(log.id);
                    setExistingSessionId(log.sessionId);
                    setRoutineName(log.routineName || "");
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
                    } else {
                        setExercises([createEmptyExercise()]);
                    }
                    toast.info("Datos cargados para editar.", { duration: 2000 });
                } else {
                    setExistingLogId(undefined);
                    setExistingSessionId(undefined);
                    if (routineDay?.exercises?.length) {
                        setRoutineName((initialRoutineName || "").replace(/\s*\(Assigned\)/gi, "").trim());
                        setSessionRpe(7);
                        setSessionNotes("");
                        setExercises(routineDay.exercises.map((ex: any) => ({
                            exerciseName: ex.exerciseName,
                            exerciseId: ex.exerciseId || "",
                            feedback: "",
                            sets: ex.sets.map((s: any) => ({
                                weight: "",
                                reps: "",
                                rpe: s.rpeTarget?.toString() || "8",
                                targetReps: s.reps?.toString(),
                                targetRpe: s.rpeTarget?.toString(),
                            })),
                        })));
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
    }, [date, initialRoutineName, routineDay, createEmptyExercise]);

    useEffect(() => {
        getExercises().then(res => {
            if (res.success && res.exercises) {
                setAvailableExercises(res.exercises.map((ex: any) => ({ 
                    id: ex.id, 
                    name: ex.name,
                    muscleGroups: ex.muscleGroups || []
                })));
            }
        });
    }, []);

    // --- DISPATCH FUNCTIONS (estables con useCallback) ---

    const addExercise = useCallback(() => setExercises(prev => [...prev, createEmptyExercise()]), [createEmptyExercise]);
    
    const openAddSelector = useCallback(() => { 
        setExerciseSelectorMode("add"); 
        setTargetIndex(-1); 
        setShowExerciseSelector(true); 
    }, []);

    const openSwapSelector = useCallback((index: number) => { 
        setExerciseSelectorMode("swap"); 
        setTargetIndex(index); 
        setShowExerciseSelector(true); 
    }, []);

    const openInsertSelector = useCallback((index: number) => { 
        setExerciseSelectorMode("insert"); 
        setTargetIndex(index); 
        setShowExerciseSelector(true); 
    }, []);

    const handleExerciseSelected = useCallback((exercise: { id?: string; name: string }) => {
        setExercises(prev => {
            const copy = [...prev];
            if (exerciseSelectorMode === "swap" && targetIndex >= 0) {
                copy[targetIndex] = { ...copy[targetIndex], exerciseName: exercise.name, exerciseId: exercise.id || "", sets: copy[targetIndex].sets.map(s => ({ ...s, weight: "", reps: "", rpe: "8" })) };
            } else if (exerciseSelectorMode === "insert" && targetIndex >= 0) {
                copy.splice(targetIndex, 0, { exerciseName: exercise.name, exerciseId: exercise.id || "", feedback: "", sets: [{ weight: "", reps: "", rpe: "8" }] });
            } else {
                copy.push({ exerciseName: exercise.name, exerciseId: exercise.id || "", feedback: "", sets: [{ weight: "", reps: "", rpe: "8" }] });
            }
            return copy;
        });
        toast.success(`Ejercicio seleccionado: ${exercise.name}`);
        setShowExerciseSelector(false);
    }, [exerciseSelectorMode, targetIndex]);

    const removeExercise = useCallback((index: number) => { 
        setExercises(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev); 
    }, []);

    const updateExercise = useCallback((index: number, field: keyof RetroExercise, value: string) => {
        setExercises(prev => prev.map((ex, i) => i === index ? { ...ex, [field]: value } : ex));
    }, []);

    const addSet = useCallback((exIndex: number) => setExercises(prev => {
        const copy = [...prev];
        const lastSet = copy[exIndex].sets[copy[exIndex].sets.length - 1];
        copy[exIndex].sets.push({ weight: lastSet?.weight || "", reps: lastSet?.reps || "", rpe: lastSet?.rpe || "8" });
        return copy;
    }), []);

    const removeSet = useCallback((exIndex: number, setIndex: number) => {
        setExercises(prev => {
            if (prev[exIndex].sets.length <= 1) return prev;
            const copy = [...prev];
            copy[exIndex].sets = copy[exIndex].sets.filter((_, i) => i !== setIndex);
            return copy;
        });
    }, []);

    const updateSet = useCallback((exIndex: number, setIndex: number, field: keyof RetroSet, value: string) => setExercises(prev => {
        const copy = [...prev];
        copy[exIndex].sets[setIndex] = { ...copy[exIndex].sets[setIndex], [field]: value };
        return copy;
    }), []);

    const triggerAIAnalysis = useCallback(async (p: RetroactiveWorkoutData) => {
        setIsAnalyzing(true); setShowAiModal(true);
        try {
            const res = await analyzeWorkoutSession(p);
            setAiFeedback(res.success ? res.message || null : "¡Gran entrenamiento! Vivi no pudo analizarlo ahora.");
        } catch {
            setAiFeedback("Error con Vivi, pero tus datos están a salvo.");
        } finally { setIsAnalyzing(false); }
    }, []);

    const handleSubmit = useCallback(async () => {
        if (exercises.some(ex => !ex.exerciseName.trim())) { toast.error("Todos los ejercicios deben tener nombre."); return; }
        setIsSubmitting(true);
        const payload: RetroactiveWorkoutData = {
            id: existingLogId, sessionId: existingSessionId, routineId, dayId: routineDay?.id, routineName: routineName.trim() || undefined, date, sessionRpe, sessionNotes,
            exercises: exercises.map(ex => ({
                exerciseId: ex.exerciseId || undefined, exerciseName: ex.exerciseName, feedback: ex.feedback,
                sets: ex.sets.filter(s => Number(s.weight) > 0 || Number(s.reps) > 0).map(s => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, rpe: Number(s.rpe) || undefined, completed: true }))
            }))
        };
        if (existingLogId) { setPendingActionType("save"); setShowConfirmDialog(true); setIsSubmitting(false); }
        else {
            try {
                if (!isOnline) {
                    const saved = saveLogLocally(payload as any);
                    if (saved) {
                        toast.success("Modo Offline: Guardado localmente para sincronizar.");
                        localStorage.removeItem("gymia_workout_draft");
                        router.push("/dashboard");
                    } else {
                        toast.error("Error al guardar borrador offline");
                    }
                    return;
                }

                const res = await logRetroactiveWorkout(payload);
                if (res.success) { 
                    toast.success("¡Registrado!"); 
                    localStorage.removeItem("gymia_workout_draft");
                    triggerAIAnalysis(payload); 
                }
                else toast.error(res.error);
            } catch { 
                toast.error("Error de conexión. Intentando guardar localmente..."); 
                const saved = saveLogLocally(payload as any);
                if (saved) {
                    toast.success("Guardado localmente. Se sincronizará al recuperar conexión.");
                    localStorage.removeItem("gymia_workout_draft");
                }
            }
            finally { setIsSubmitting(false); }
        }
    }, [exercises, existingLogId, existingSessionId, routineId, routineDay?.id, routineName, date, sessionRpe, sessionNotes, isOnline, saveLogLocally, router, triggerAIAnalysis]);

    const handleMarkRestWithConfirm = useCallback(async () => {
        setIsSubmitting(true);
        if (existingLogId) { setPendingActionType("rest"); setShowConfirmDialog(true); setIsSubmitting(false); }
        else {
            try {
                const res = await markAsRestDay(date, existingLogId);
                if (res.success) { toast.success("Día de descanso"); router.push("/dashboard"); }
                else toast.error(res.error);
            } catch { toast.error("Error de conexión"); }
            finally { setIsSubmitting(false); }
        }
    }, [existingLogId, date, router]);

    const confirmOverwrite = useCallback(async () => {
        setShowConfirmDialog(false);
        setIsSubmitting(true);
        const payload: RetroactiveWorkoutData = {
            id: existingLogId, sessionId: existingSessionId, routineId, dayId: routineDay?.id, routineName: routineName.trim() || undefined, date, sessionRpe, sessionNotes,
            exercises: exercises.map(ex => ({
                exerciseId: ex.exerciseId || undefined, exerciseName: ex.exerciseName, feedback: ex.feedback,
                sets: ex.sets.filter(s => Number(s.weight) > 0 || Number(s.reps) > 0).map(s => ({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, rpe: Number(s.rpe) || undefined, completed: true }))
            }))
        };
        try {
            if (pendingActionType === "save") {
                const res = await logRetroactiveWorkout(payload);
                if (res.success) { toast.success("Actualizado"); triggerAIAnalysis(payload); }
                else toast.error(res.error);
            } else if (pendingActionType === "rest") {
                const res = await markAsRestDay(date, existingLogId);
                if (res.success) { toast.success("Descanso registrado"); router.push("/dashboard"); }
                else toast.error(res.error);
            }
        } catch { toast.error("Error"); }
        finally { setIsSubmitting(false); }
    }, [existingLogId, existingSessionId, routineId, routineDay?.id, routineName, date, sessionRpe, sessionNotes, exercises, pendingActionType, router, triggerAIAnalysis]);

    // --- STATE CONTEXT VALUE (cambia cuando cambia el estado) ---

    const stateValue = useMemo<WorkoutLoggerStateType>(() => ({
        routineName, date, sessionRpe, sessionNotes, exercises,
        isSubmitting, isLoadingLog, existingLogId, existingSessionId,
        aiFeedback, isAnalyzing, showAiModal,
        showExerciseSelector, exerciseSelectorMode, targetIndex, availableExercises,
        showConfirmDialog, pendingActionType,
        canUseSelector: true
    }), [
        routineName, date, sessionRpe, sessionNotes, exercises,
        isSubmitting, isLoadingLog, existingLogId, existingSessionId,
        aiFeedback, isAnalyzing, showAiModal,
        showExerciseSelector, exerciseSelectorMode, targetIndex, availableExercises,
        showConfirmDialog, pendingActionType
    ]);

    // --- DISPATCH CONTEXT VALUE (estable, memoizado) ---

    const dispatchValue = useMemo<WorkoutLoggerDispatchType>(() => ({
        setRoutineName, setDate, setSessionRpe, setSessionNotes, setExercises,
        setShowAiModal, setShowExerciseSelector, setExerciseSelectorMode, setTargetIndex,
        setShowConfirmDialog, setPendingActionType,
        addExercise, openAddSelector, openSwapSelector, openInsertSelector,
        handleExerciseSelected, removeExercise, updateExercise, addSet, removeSet, updateSet,
        handleSubmit, handleMarkRestWithConfirm, confirmOverwrite, triggerAIAnalysis
    }), [
        addExercise, openAddSelector, openSwapSelector, openInsertSelector,
        handleExerciseSelected, removeExercise, updateExercise, addSet, removeSet, updateSet,
        handleSubmit, handleMarkRestWithConfirm, confirmOverwrite, triggerAIAnalysis
    ]);

    return (
        <WorkoutLoggerStateContext.Provider value={stateValue}>
            <WorkoutLoggerDispatchContext.Provider value={dispatchValue}>
                {children}
            </WorkoutLoggerDispatchContext.Provider>
        </WorkoutLoggerStateContext.Provider>
    );
}
