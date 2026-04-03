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

export interface WorkoutLoggerState {
    routineName: string;
    date: string;
    sessionRpe: number;
    sessionNotes: string;
    exercises: RetroExercise[];
    isSubmitting: boolean;
    isLoadingLog: boolean;
    existingLogId?: string;
    existingSessionId?: string;
}

export interface WorkoutLoggerActions {
    setRoutineName: (v: string) => void;
    setDate: (v: string) => void;
    setSessionRpe: (v: number) => void;
    setSessionNotes: (v: string) => void;
    setExercises: React.Dispatch<React.SetStateAction<RetroExercise[]>>;
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
    triggerAIAnalysis: (p: any) => Promise<void>;
}

export interface WorkoutLoggerAIState {
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
    availableExercises: { id: string; name: string }[];
}

export interface WorkoutLoggerDialogsState {
    showConfirmDialog: boolean;
    setShowConfirmDialog: (v: boolean) => void;
    pendingActionType: "save" | "rest" | null;
    setPendingActionType: (v: "save" | "rest" | null) => void;
}

export type WorkoutLoggerContextType = WorkoutLoggerState & WorkoutLoggerActions & WorkoutLoggerAIState & WorkoutLoggerDialogsState;