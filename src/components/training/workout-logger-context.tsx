"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from "react";
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

interface WorkoutLoggerContextType {
    // Estado
    routineName: string;
    setRoutineName: (v: string) => void;
    date: string;
    setDate: (v: string) => void;
    sessionRpe: number;
    setSessionRpe: (v: number) => void;
    sessionNotes: string;
    setSessionNotes: (v: string) => void;
    exercises: RetroExercise[];
    setExercises: Dispatch<SetStateAction<RetroExercise[]>>;
    
    isSubmitting: boolean;
    isLoadingLog: boolean;
    existingLogId?: string;
    existingSessionId?: string;
    
    // IA & Selector
    aiFeedback: string | null;
    isAnalyzing: boolean;
    showAiModal: boolean;
    setShowAiModal: (v: boolean) => void;
    showExerciseSelector: boolean;
    setShowExerciseSelector: (v: boolean) => void;
    exerciseSelectorMode: "swap" | "add" | "insert";
    setExerciseSelectorMode: (v: "swap" | "add" | "insert") => void;
    targetIndex: number;
    setTargetIndex: (v: number) => void;
    availableExercises: { id: string; name: string; muscleGroups?: string[] }[];
    
    // Diálogos
    showConfirmDialog: boolean;
    setShowConfirmDialog: (v: boolean) => void;
    pendingActionType: "save" | "rest" | null;
    setPendingActionType: (v: "save" | "rest" | null) => void;

    // Handlers
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
    canUseSelector?: boolean;
}

const WorkoutLoggerContext = createContext<WorkoutLoggerContextType | undefined>(undefined);

export function useWorkoutLogger() {
    const context = useContext(WorkoutLoggerContext);
    if (!context) {
        throw new Error("useWorkoutLogger must be used within a WorkoutLoggerProvider");
    }
    return context;
}

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

    const createEmptyExercise = (): RetroExercise => ({
        exerciseName: "",
        exerciseId: "",
        feedback: "",
        sets: [{ weight: "", reps: "", rpe: "8" }],
    });

    const [exercises, setExercises] = useState<RetroExercise[]>(() => {
        // Primero intentar cargar borrador si es un entrenamiento nuevo
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

    // Intentar cargar otros campos del borrador al montar
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

    // Efecto para buscar si hay un log existente
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
    }, [date, initialRoutineName, routineDay]);

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

    // Handlers con useCallback
    const addExercise = React.useCallback(() => setExercises(prev => [...prev, createEmptyExercise()]), []);
    
    const openAddSelector = React.useCallback(() => { 
        setExerciseSelectorMode("add"); 
        setTargetIndex(-1); 
        setShowExerciseSelector(true); 
    }, []);

    const openSwapSelector = React.useCallback((index: number) => { 
        setExerciseSelectorMode("swap"); 
        setTargetIndex(index); 
        setShowExerciseSelector(true); 
    }, []);

    const openInsertSelector = React.useCallback((index: number) => { 
        setExerciseSelectorMode("insert"); 
        setTargetIndex(index); 
        setShowExerciseSelector(true); 
    }, []);

    const handleExerciseSelected = React.useCallback((exercise: { id?: string; name: string }) => {
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

    const removeExercise = React.useCallback((index: number) => { 
        setExercises(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev); 
    }, []);

    const updateExercise = React.useCallback((index: number, field: keyof RetroExercise, value: string) => {
        setExercises(prev => prev.map((ex, i) => i === index ? { ...ex, [field]: value } : ex));
    }, []);

    const addSet = React.useCallback((exIndex: number) => setExercises(prev => {
        const copy = [...prev];
        const lastSet = copy[exIndex].sets[copy[exIndex].sets.length - 1];
        copy[exIndex].sets.push({ weight: lastSet?.weight || "", reps: lastSet?.reps || "", rpe: lastSet?.rpe || "8" });
        return copy;
    }), []);

    const removeSet = React.useCallback((exIndex: number, setIndex: number) => {
        setExercises(prev => {
            if (prev[exIndex].sets.length <= 1) return prev;
            const copy = [...prev];
            copy[exIndex].sets = copy[exIndex].sets.filter((_, i) => i !== setIndex);
            return copy;
        });
    }, []);

    const updateSet = React.useCallback((exIndex: number, setIndex: number, field: keyof RetroSet, value: string) => setExercises(prev => {
        const copy = [...prev];
        copy[exIndex].sets[setIndex] = { ...copy[exIndex].sets[setIndex], [field]: value };
        return copy;
    }), []);

    const triggerAIAnalysis = async (p: RetroactiveWorkoutData) => {
        setIsAnalyzing(true); setShowAiModal(true);
        try {
            const res = await analyzeWorkoutSession(p);
            setAiFeedback(res.success ? res.message || null : "¡Gran entrenamiento! Vivi no pudo analizarlo ahora.");
        } catch {
            setAiFeedback("Error con Vivi, pero tus datos están a salvo.");
        } finally { setIsAnalyzing(false); }
    };

    const handleSubmit = async () => {
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
    };

    const handleMarkRestWithConfirm = async () => {
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
    };

    const confirmOverwrite = async () => {
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
    };

    const contextValue = React.useMemo(() => ({
        routineName, setRoutineName, date, setDate, sessionRpe, setSessionRpe, sessionNotes, setSessionNotes, exercises, setExercises,
        isSubmitting, isLoadingLog, existingLogId, existingSessionId,
        aiFeedback, isAnalyzing, showAiModal, setShowAiModal,
        showExerciseSelector, setShowExerciseSelector, exerciseSelectorMode, setExerciseSelectorMode, targetIndex, setTargetIndex, availableExercises,
        showConfirmDialog, setShowConfirmDialog, pendingActionType, setPendingActionType,
        addExercise, openAddSelector, openSwapSelector, openInsertSelector, handleExerciseSelected, removeExercise, updateExercise, addSet, removeSet, updateSet,
        handleSubmit, handleMarkRestWithConfirm, confirmOverwrite, triggerAIAnalysis,
        canUseSelector: true
    }), [
        routineName, date, sessionRpe, sessionNotes, exercises,
        isSubmitting, isLoadingLog, existingLogId, existingSessionId,
        aiFeedback, isAnalyzing, showAiModal,
        showExerciseSelector, exerciseSelectorMode, targetIndex, availableExercises,
        showConfirmDialog, pendingActionType,
        addExercise, openAddSelector, openSwapSelector, openInsertSelector, handleExerciseSelected, removeExercise, updateExercise, addSet, removeSet, updateSet,
        handleSubmit, handleMarkRestWithConfirm, confirmOverwrite, triggerAIAnalysis
    ]);

    return (
        <WorkoutLoggerContext.Provider value={contextValue}>
            {children}
        </WorkoutLoggerContext.Provider>
    );
}
