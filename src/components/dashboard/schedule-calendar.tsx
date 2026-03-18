"use client";

import { useEffect, useState, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { getAthleteAssignments, getRecordedWorkoutDays, getLogsPorFecha } from "@/actions/schedule-actions";
import { startOfMonth, endOfMonth, format, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, Dumbbell, CheckCircle2, Moon, Calendar as CalendarIcon, ChevronRight, Clock, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fechaLocalAString } from "@/lib/fecha-utils";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Capitaliza la primera letra de cada palabra o de la cadena
 */
const capitalize = (str: string) => {
    if (!str) return str;
    return str
        .split(" ")
        .map((word) => (word.toLowerCase() === "de" ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join(" ");
};

interface Assignment {
    id: string;
    routineName: string;
    dayName: string;
    date: string; // YYYY-MM-DD
    completed?: boolean;
}

interface LogDelDia {
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

export function ScheduleCalendar({ athleteId, activeRoutine }: { athleteId: string, activeRoutine?: any }) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [recordedDays, setRecordedDays] = useState<Date[]>([]);
    const [logsDelDia, setLogsDelDia] = useState<LogDelDia[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [month, setMonth] = useState<Date>(new Date());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAssignments = async () => {
            setLoading(true);
            const start = format(startOfMonth(month), "yyyy-MM-dd");
            const end = format(endOfMonth(month), "yyyy-MM-dd");

            const [assignmentRes, recordedRes] = await Promise.all([
                getAthleteAssignments(athleteId, start, end),
                getRecordedWorkoutDays(athleteId, start, end)
            ]);

            if (assignmentRes.success) {
                const rawAssignments = assignmentRes.assignments as Assignment[];
                const uniqueAssignments = Array.from(new Map(rawAssignments.map(a => [a.id, a])).values());
                setAssignments(uniqueAssignments);
            }

            if (recordedRes?.success && recordedRes.recordedDates) {
                setRecordedDays(recordedRes.recordedDates.map((d: string) => parseISO(d)));
            }

            setLoading(false);
        };

        fetchAssignments();
    }, [athleteId, month]);

    const assignedDays = assignments.map(a => parseISO(a.date));

    // Determinar días de entrenamiento y descanso basados en la rutina activa
    const getDayInfo = (day: Date) => {
        if (!activeRoutine || !activeRoutine.schedule || activeRoutine.schedule.length !== 7) return null;

        const startDate = activeRoutine.startDate ? (typeof activeRoutine.startDate === 'string' ? parseISO(activeRoutine.startDate) : activeRoutine.startDate) : null;
        if (startDate && day < startDate) return null;

        // Mapear getDay (0=Dom, 1=Lun...) a nuestro índice (0=Lun, 6=Dom)
        const routineIdx = (day.getDay() + 6) % 7;
        return activeRoutine.schedule[routineIdx];
    };

    const selectedDayAssignments = date
        ? assignments.filter(a => isSameDay(parseISO(a.date), date))
        : [];

    const selectedDayInfo = date ? getDayInfo(date) : null;
    const selectedDayWeekDay = date?.getDay();
    const isWeekend = selectedDayWeekDay === 0 || selectedDayWeekDay === 6;
    const isRestDay = selectedDayInfo ? selectedDayInfo.isRest : (isWeekend && selectedDayAssignments.length === 0);

    const isRecordedDay = date
        ? recordedDays.some(rd => isSameDay(rd, date))
        : false;

    // Cargar logs reales cuando se selecciona un día grabado
    const cargarLogsDelDia = useCallback(async (selectedDate: Date) => {
        const fechaStr = fechaLocalAString(selectedDate);
        setLoadingLogs(true);
        try {
            const res = await getLogsPorFecha(athleteId, fechaStr);
            if (res.success && res.logs) {
                setLogsDelDia(res.logs);
            } else {
                setLogsDelDia([]);
            }
        } catch {
            setLogsDelDia([]);
        }
        setLoadingLogs(false);
    }, [athleteId]);

    useEffect(() => {
        if (date && isRecordedDay) {
            cargarLogsDelDia(date);
        } else {
            setLogsDelDia([]);
        }
    }, [date, isRecordedDay, cargarLogsDelDia]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="md:col-span-2 p-6 bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-4xl shadow-2xl"
            >
                <div className="flex items-center justify-between mb-8 px-2">
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
                                <CalendarIcon className="w-5 h-5 text-red-500" />
                            </div>
                            Planificación
                        </h3>
                        <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest ml-11">Calendario de Actividad</p>
                    </div>
                    {loading && <Loader2 className="w-4 h-4 animate-spin text-red-500" />}
                </div>

                <div className="bg-neutral-950/30 rounded-4xl p-4 border border-white/5 shadow-inner">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        month={month}
                        onMonthChange={setMonth}
                        modifiers={{
                            assigned: assignedDays,
                            recorded: recordedDays,
                            training: (day) => getDayInfo(day)?.isRest === false,
                            rest: (day) => {
                                const info = getDayInfo(day);
                                if (info) return info.isRest === true;
                                const dow = day.getDay();
                                return dow === 0 || dow === 6;
                            }
                        }}
                        modifiersClassNames={{
                            assigned: "before:content-[''] before:absolute before:top-2 before:right-2 before:w-1 before:h-1 before:bg-red-500/60 before:rounded-full before:shadow-[0_0_8px_rgba(239,68,68,0.5)]",
                            recorded: "bg-emerald-500/20 text-emerald-400 font-black hover:bg-emerald-500/30 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] rounded-2xl",
                            training: "after:content-[''] after:absolute after:bottom-2 after:w-1 after:h-1 after:bg-red-600 after:rounded-full after:shadow-[0_0_6px_rgba(220,38,38,0.8)]",
                            rest: "opacity-20 grayscale"
                        }}
                        locale={es}
                        className="w-full"
                        classNames={{
                            month_caption: "flex justify-center pt-2 relative items-center capitalize text-white font-black tracking-tight mb-6",
                            month_grid: "w-full border-collapse",
                            weekday: "text-neutral-500/80 rounded-md w-full font-black text-[0.7rem] text-center capitalize tracking-[0.15em] pb-4",
                            day: "h-12 sm:h-16 w-full text-center text-sm p-1.5 m-0 relative flex items-center justify-center text-white",
                            day_button: "h-10 w-10 sm:h-12 sm:w-12 p-0 font-bold text-inherit hover:bg-white/10 rounded-2xl transition-all duration-300 flex items-center justify-center relative cursor-pointer group",
                            selected: "bg-white !text-black shadow-[0_0_30px_rgba(255,255,255,0.5)] scale-110 z-30 font-black rounded-2xl ring-4 ring-white/20",
                            today: "bg-red-500/10 text-red-500 border border-red-500/30 font-black rounded-2xl",
                        }}
                    />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-4xl p-6 flex flex-col h-full shadow-2xl"
            >
                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-black text-white tracking-tighter leading-none first-letter:uppercase">
                            {date ? format(date, "EEEE d", { locale: es }) : "Hoy"}
                        </h3>
                        {isRecordedDay && (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-black uppercase text-[8px] tracking-[0.2em] px-2.5 py-1 rounded-lg">
                                LOGGED
                            </Badge>
                        )}
                    </div>
                    <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] bg-white/5 px-3 py-1.5 rounded-full inline-block">
                        {date ? format(date, "MMMM yyyy", { locale: es }) : ""}
                    </p>
                </div>

                <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {isRestDay && !isRecordedDay ? (
                            <motion.div
                                key="rest"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="p-8 text-center bg-neutral-950/30 border border-white/5 border-dashed rounded-4xl flex flex-col items-center gap-4 mt-4"
                            >
                                <div className="h-16 w-16 bg-neutral-900 rounded-2xl flex items-center justify-center shadow-lg border border-white/5">
                                    <Moon className="h-8 w-8 text-neutral-600" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-black text-white uppercase tracking-tight">Recuperación</h4>
                                    <p className="text-xs text-neutral-500 font-medium">Escucha a tu cuerpo hoy.</p>
                                </div>
                            </motion.div>
                        ) : selectedDayAssignments.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDayAssignments.map((assignment, idx) => (
                                    <motion.div
                                        key={assignment.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className={cn(
                                            "p-6 rounded-[2rem] border transition-all group relative overflow-hidden backdrop-blur-md",
                                            isRecordedDay
                                                ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_20px_40px_-15px_rgba(16,185,129,0.1)]"
                                                : "bg-neutral-900/60 border-white/5 hover:border-red-500/40 hover:bg-neutral-900/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
                                        )}
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <Dumbbell className="w-12 h-12 text-white" />
                                        </div>
                                        <div className="flex justify-between items-center mb-3 relative z-10">
                                            <Badge variant="outline" className={cn(
                                                "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md",
                                                isRecordedDay ? "border-emerald-500/20 text-emerald-500" : "border-red-500/20 text-red-500"
                                            )}>
                                                {isRecordedDay ? "Finalizado" : "Asignado"}
                                            </Badge>
                                            <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-red-500 transition-all" />
                                        </div>
                                        <h4 className="font-black text-white text-lg tracking-tight relative z-10 group-hover:text-red-500 transition-colors">
                                            {assignment.routineName}
                                        </h4>
                                        <p className="text-xs text-neutral-500 font-bold mt-1 uppercase tracking-widest relative z-10">
                                            {assignment.dayName}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        ) : isRecordedDay ? (
                            <div className="space-y-3">
                                {loadingLogs ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                                    </div>
                                ) : logsDelDia.length > 0 ? (
                                    logsDelDia.map((log, logIdx) => (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: logIdx * 0.1 }}
                                            className="p-6 rounded-[2rem] border bg-emerald-500/10 border-emerald-500/20 shadow-[0_20px_40px_-15px_rgba(16,185,129,0.1)] relative overflow-hidden backdrop-blur-md"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <Dumbbell className="w-12 h-12 text-emerald-400" />
                                            </div>
                                            <div className="flex justify-between items-center mb-3 relative z-10">
                                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border-emerald-500/20 text-emerald-500">
                                                    Finalizado
                                                </Badge>
                                                <div className="flex items-center gap-3">
                                                    {log.durationMinutes > 0 && (
                                                        <span className="text-[10px] text-emerald-400/70 font-bold flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {log.durationMinutes} min
                                                        </span>
                                                    )}
                                                    {log.sessionRpe && (
                                                        <span className="text-[10px] text-orange-400/70 font-bold flex items-center gap-1">
                                                            <Flame className="w-3 h-3" />
                                                            RPE {log.sessionRpe}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <h4 className="font-black text-white text-lg tracking-tight relative z-10">
                                                {log.routineName}
                                            </h4>

                                            {log.exercises.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-emerald-500/10 space-y-2.5 relative z-10">
                                                    {log.exercises.map((ex, i) => (
                                                        <div key={i} className="flex items-start gap-3 text-base">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 mt-2.5 shrink-0" />
                                                            <div className="flex-1">
                                                                <span className="text-neutral-300 font-medium leading-relaxed">{ex.exerciseName}</span>
                                                                <div className="flex flex-wrap gap-1.5 mt-1">
                                                                    {ex.sets.filter(s => s.completed).map((s, si) => (
                                                                        <span key={si} className="text-[10px] text-emerald-400/60 font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded-md">
                                                                            {s.weight}kg×{s.reps}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div
                                        key="extra-fallback"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-4xl flex flex-col items-center gap-4 text-center mt-4"
                                    >
                                        <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <h4 className="font-black text-white uppercase tracking-tight">Sesión Completada</h4>
                                            <p className="text-xs text-neutral-500 font-medium italic">Sin detalles disponibles.</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        ) : selectedDayInfo && !selectedDayInfo.isRest ? (
                            <div className="space-y-3">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        "p-6 rounded-[2rem] border transition-all group relative overflow-hidden backdrop-blur-md",
                                        isRecordedDay
                                            ? "bg-emerald-500/10 border-emerald-500/20 shadow-[0_20px_40px_-15px_rgba(16,185,129,0.1)]"
                                            : "bg-neutral-900/60 border-white/5 hover:border-red-500/40 hover:bg-neutral-900/80 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]"
                                    )}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Dumbbell className="w-12 h-12 text-white" />
                                    </div>
                                    <div className="flex justify-between items-center mb-3 relative z-10">
                                        <Badge variant="outline" className={cn(
                                            "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md",
                                            isRecordedDay ? "border-emerald-500/20 text-emerald-500" : "border-red-500/20 text-red-500"
                                        )}>
                                            {isRecordedDay ? "Finalizado" : "Rutina Activa"}
                                        </Badge>
                                        <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-red-500 transition-all" />
                                    </div>
                                    <h4 className="font-black text-white text-lg tracking-tight relative z-10 group-hover:text-red-500 transition-colors">
                                        {selectedDayInfo.name}
                                    </h4>

                                    {/* Exercise List Preview */}
                                    {selectedDayInfo.exercises && selectedDayInfo.exercises.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-white/5 space-y-2 relative z-10">
                                            {selectedDayInfo.exercises.map((ex: any, i: number) => (
                                                <div key={i} className="flex items-start gap-3 text-base">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-2.5 shrink-0" />
                                                    <span className="text-neutral-300 font-medium leading-relaxed wrap-break-word">{ex.exerciseName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-20 opacity-30 grayscale">
                                <Dumbbell className="h-12 w-12 mb-4" />
                                <p className="text-xs font-black uppercase tracking-widest">Sin Actividad</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
