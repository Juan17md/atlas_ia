export interface RoutineSet {
    reps?: number;
    weight?: number;
    rpe?: number;
    rpeTarget?: number;
    type?: "warmup" | "working" | "failure";
    rest?: number;
}

export interface RoutineExercise {
    exerciseId?: string;
    exerciseName: string;
    notes?: string;
    sets: RoutineSet[];
    variantIds?: string[];
}

export interface RoutineDay {
    id?: string;
    name: string;
    exercises: RoutineExercise[];
}

export interface Routine {
    id: string;
    name: string;
    schedule: RoutineDay[];
}

export interface SessionSet {
    reps: string;
    weight: string;
    rpe: string;
    completed: boolean;
    targetReps?: number;
}

export interface SessionExercise {
    exerciseId: string;
    exerciseName: string;
    sets: SessionSet[];
    feedback: string;
    exerciseIdUsed: string;
}

export interface WorkoutSessionState {
    sessionLog: SessionExercise[];
    mutableExercises: RoutineExercise[];
    elapsedTime: number;
    isStarted: boolean;
    currentExerciseIndex: number;
}