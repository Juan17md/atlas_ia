export interface Assignment {
    id: string;
    routineName: string;
    dayName: string;
    date: string;
    completed?: boolean;
}

export interface LogDelDia {
    id: string;
    routineName: string;
    durationMinutes: number;
    sessionRpe: number | null;
    isRetroactive: boolean;
    exercises: {
        exerciseName: string;
        exerciseId: string;
        sets: { weight: number; reps: number; rpe: number | null; completed: boolean }[];
    }[];
}

export interface ScheduleCalendarProps {
    athleteId: string;
    activeRoutine?: any;
}

export interface CalendarDayData {
    date: Date;
    assignment?: Assignment;
    logs: LogDelDia[];
    isRecorded: boolean;
    isRest: boolean;
}