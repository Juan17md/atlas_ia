import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRoutines } from "@/actions/routine-actions";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Dumbbell, Target, RotateCcw, Hash, Timer, Repeat, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

// Interfaces
interface RoutineSet {
    type?: string;
    reps?: string | number;
    rpeTarget?: number;
    restSeconds?: number;
    duracionSegundos?: number;
}

interface ScheduleExercise {
    exerciseId?: string;
    exerciseName: string;
    sets: RoutineSet[];
    notes?: string;
    ejercicioTipo?: "reps" | "time";
    duracionSegundos?: number;
    comboTipo?: "superset" | "biserie" | "triserie";
    comboGrupo?: string;
}

interface ScheduleDay {
    id?: string;
    name: string;
    exercises?: ScheduleExercise[];
}

interface ActiveRoutine {
    id: string;
    name: string;
    description?: string;
    schedule: ScheduleDay[];
}

function getSetTypeLabel(type?: string): string {
    switch (type) {
        case "warmup": return "Calentamiento";
        case "working": return "Efectiva";
        case "failure": return "Al Fallo";
        case "drop": return "Drop Set";
        default: return "Efectiva";
    }
}

function getSetTypeBadgeClass(type?: string): string {
    switch (type) {
        case "warmup": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
        case "failure": return "bg-red-500/10 text-red-500 border-red-500/20";
        case "drop": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
        default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
}

export default async function RoutineDayDetailPage({ params }: { params: Promise<{ index: string }> }) {
    const session = await auth();
    if (!session?.user) redirect("/login");

    const { index: indexStr } = await params;
    const dayIndex = parseInt(indexStr, 10);

    const { routines } = await getRoutines();
    const activeRoutine: ActiveRoutine | null = routines && routines.length > 0
        ? (routines[0] as unknown as ActiveRoutine)
        : null;

    if (!activeRoutine || isNaN(dayIndex) || dayIndex < 0 || dayIndex >= activeRoutine.schedule.length) {
        redirect("/my-routine");
    }

    const day = activeRoutine.schedule[dayIndex];
    const exercises = day.exercises || [];
    const isDaily = activeRoutine.schedule.length === 1;
    const routineName = isDaily
        ? "Rutina Compuesta"
        : activeRoutine.name.replace(/\s*\(Assigned\)/gi, "").trim();

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/my-routine">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 shrink-0"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
                        {routineName} • Día {dayIndex + 1}
                    </p>
                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {day.name}
                    </h1>
                </div>
            </div>

            {/* Stats rápidas */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-xs font-bold text-neutral-300">
                        {exercises.length} ejercicio{exercises.length !== 1 ? "s" : ""}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1.5">
                    <Hash className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-xs font-bold text-neutral-300">
                        {exercises.reduce((acc, ex) => acc + ex.sets.length, 0)} series totales
                    </span>
                </div>
            </div>

            {/* Lista de ejercicios */}
            <div className="space-y-4">
                {exercises.map((exercise, exIndex) => (
                    <div
                        key={exIndex}
                        className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden"
                    >
                        {/* Nombre del ejercicio */}
                        <div className="px-5 py-4 flex items-center gap-4 border-b border-neutral-800/50">
                            <div className="h-10 w-10 rounded-xl bg-neutral-800 flex items-center justify-center text-sm font-black text-neutral-400">
                                {exIndex + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-white text-base sm:text-lg">
                                        {exercise.exerciseName}
                                    </h3>
                                    {exercise.ejercicioTipo === "time" && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px] font-black text-purple-400 uppercase">
                                            <Timer className="w-3 h-3" />
                                            Tiempo
                                        </span>
                                    )}
                                    {exercise.ejercicioTipo !== "time" && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase">
                                            <Repeat className="w-3 h-3" />
                                            Reps
                                        </span>
                                    )}
                                    {exercise.comboTipo && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 uppercase">
                                            <LinkIcon className="w-3 h-3" />
                                            {exercise.comboTipo === "superset" ? "Superserie" : exercise.comboTipo === "biserie" ? "Biserie" : "Triserie"}
                                        </span>
                                    )}
                                </div>
                                {exercise.duracionSegundos && exercise.ejercicioTipo === "time" && (
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        {exercise.duracionSegundos}s por serie
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Tabla de series */}
                        <div className="px-5 py-3">
                            {/* Header de tabla */}
                            <div className="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-2 px-1">
                                <div className="col-span-1">#</div>
                                <div className="col-span-3">Tipo</div>
                                <div className="col-span-3 text-center">
                                    {exercise.ejercicioTipo === "time" ? "Duración" : "Reps"}
                                </div>
                                <div className="col-span-2 text-center">RPE</div>
                                <div className="col-span-3 text-center">Descanso</div>
                            </div>

                            {/* Series */}
                            {exercise.sets.map((set, setIndex) => (
                                <div
                                    key={setIndex}
                                    className="grid grid-cols-12 gap-2 items-center py-2.5 px-1 border-t border-neutral-800/30 text-sm"
                                >
                                    <div className="col-span-1 text-neutral-600 font-bold text-xs">
                                        {setIndex + 1}
                                    </div>
                                    <div className="col-span-3">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getSetTypeBadgeClass(set.type)}`}>
                                            {getSetTypeLabel(set.type)}
                                        </span>
                                    </div>
                                    <div className="col-span-3 text-center text-white font-bold">
                                        {exercise.ejercicioTipo === "time"
                                            ? (set.duracionSegundos ? `${set.duracionSegundos}s` : "-")
                                            : (set.reps || "-")
                                        }
                                    </div>
                                    <div className="col-span-2 text-center">
                                        {exercise.ejercicioTipo === "time" ? (
                                            <span className="text-neutral-700">-</span>
                                        ) : set.rpeTarget ? (
                                            <span className="flex items-center justify-center gap-1 text-neutral-300 font-bold">
                                                <Target className="w-3 h-3 text-red-500" />
                                                {set.rpeTarget}
                                            </span>
                                        ) : (
                                            <span className="text-neutral-700">-</span>
                                        )}
                                    </div>
                                    <div className="col-span-3 text-center">
                                        {set.restSeconds ? (
                                            <span className="flex items-center justify-center gap-1 text-neutral-400 text-xs">
                                                <RotateCcw className="w-3 h-3" />
                                                {set.restSeconds}s
                                            </span>
                                        ) : (
                                            <span className="text-neutral-700 text-xs">-</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Notas del ejercicio */}
                        {exercise.notes && (
                            <div className="px-5 py-3 border-t border-neutral-800/30 bg-neutral-950/30">
                                <p className="text-xs text-neutral-500 italic">{exercise.notes}</p>
                            </div>
                        )}
                    </div>
                ))}

                {exercises.length === 0 && (
                    <div className="p-12 text-center text-neutral-500 bg-neutral-900 rounded-2xl border border-neutral-800">
                        Este día no tiene ejercicios configurados.
                    </div>
                )}
            </div>
        </div>
    );
}
