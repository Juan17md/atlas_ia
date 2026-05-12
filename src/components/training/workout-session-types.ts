export interface RoutineSet {
    reps?: number;
    weight?: number;
    rpe?: number;
    rpeTarget?: number;
    type?: "warmup" | "working" | "failure" | "drop";
    rest?: number;
    restSeconds?: number;
    duracionSegundos?: number;
}

export interface RoutineExercise {
    exerciseId?: string;
    exerciseName: string;
    notes?: string;
    sets: RoutineSet[];
    variantIds?: string[];

    ejercicioTipo?: "reps" | "time";
    duracionSegundos?: number;

    comboTipo?: "superset" | "biserie" | "triserie";
    comboGrupo?: string;
}

export interface RoutineDay {
    id?: string;
    name: string;
    exercises: RoutineExercise[];

    esCircuito?: boolean;
    circuitoRondas?: number;
    circuitoDescansoRondas?: number;
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
    duracionSegundos?: number;
    tiempoCompletado?: number;
}

export interface SessionExercise {
    exerciseId: string;
    exerciseName: string;
    sets: SessionSet[];
    feedback: string;
    exerciseIdUsed: string;

    ejercicioTipo?: "reps" | "time";
    tiempoCompletado?: number;

    comboTipo?: "superset" | "biserie" | "triserie";
    comboGrupo?: string;
}

export interface WorkoutSessionState {
    sessionLog: SessionExercise[];
    mutableExercises: RoutineExercise[];
    elapsedTime: number;
    isStarted: boolean;
    currentExerciseIndex: number;

    circuitoRondaActual?: number;
    circuitoEjercicioIndice?: number;
}