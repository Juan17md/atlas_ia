export interface ExerciseSet {
    type?: string;
    reps?: string | number;
    rpeTarget?: number;
    restSeconds?: number;
}

export interface ScheduleExercise {
    exerciseId?: string;
    exerciseName: string;
    notes?: string;
    sets: ExerciseSet[];
    order?: number;
    variantIds?: string[];
}

export interface ScheduleDay {
    id: string;
    name: string;
    exercises: ScheduleExercise[];
}

export interface AIRoutine {
    name: string;
    description?: string;
    type?: string;
    schedule: ScheduleDay[];
}

export interface RoutineFormData {
    id?: string;
    name: string;
    description?: string;
    type: string;
    schedule: ScheduleDay[];
}

export interface AvailableExercise {
    id: string;
    name: string;
}

export const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];