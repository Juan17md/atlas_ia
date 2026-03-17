import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Dumbbell, Play, Moon, Info, Sparkles, Activity, Pencil } from "lucide-react";
import Link from "next/link";
import { getRoutines } from "@/actions/routine-actions";
import { differenceInCalendarWeeks } from "date-fns";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { ClientMotionDiv } from "@/components/ui/client-motion";

// Interfaces para la rutina
interface ScheduleExercise {
    exerciseId?: string;
    exerciseName: string;
    sets: unknown[];
}

interface ScheduleDay {
    name: string;
    exercises?: ScheduleExercise[];
    isRest?: boolean;
}

interface ActiveRoutine {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    startDate?: Date;
    schedule: ScheduleDay[];
}

export default async function MyRoutinePage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    const { success, routines } = await getRoutines();

    // Asumimos que la lógica de backend devuelve solo activas para atletas
    const activeRoutine: ActiveRoutine | null = routines && routines.length > 0 ? (routines[0] as unknown as ActiveRoutine) : null;

    if (!activeRoutine) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

                <ClientMotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                    className="relative space-y-12 max-w-md w-full"
                >
                    <div className="relative mx-auto w-32 h-32 flex items-center justify-center group">
                        <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-3xl border border-white/5 rounded-3xl -rotate-6 group-hover:rotate-0 transition-transform duration-500" />
                        <Dumbbell className="w-12 h-12 text-neutral-600 relative z-10 group-hover:text-red-500 transition-colors" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                            Frecuencia No Detectada
                        </h1>
                        <p className="text-neutral-500 font-bold text-sm leading-relaxed">
                            Aún no tienes una rutina asignada. Contacta con tu entrenador para que te asigne una rutina.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        {session.user.role === "coach" && (
                            <Link href="/routines" className="w-full">
                                <Button className="w-full h-14 bg-white text-black font-black uppercase italic tracking-widest rounded-2xl hover:bg-neutral-200 transition-all shadow-xl shadow-white/5 active:scale-95">
                                    Gestionar Archivos
                                </Button>
                            </Link>
                        )}
                        <Link href="/train" className="w-full">
                            <Button variant="outline" className="w-full h-14 border-neutral-800 text-neutral-400 font-black uppercase italic tracking-widest rounded-2xl hover:bg-white/5 hover:text-white transition-all active:scale-95">
                                Reintentar Enlace
                            </Button>
                        </Link>
                    </div>
                </ClientMotionDiv>
            </div>
        );
    }

    // Calcular métricas
    const schedule = activeRoutine.schedule || [];
    const frequency = schedule.length;
    const totalExercises = schedule.reduce((acc: number, day: ScheduleDay) => acc + (day.exercises?.length || 0), 0);

    const startDateRaw = activeRoutine.startDate ? (typeof activeRoutine.startDate === 'string' ? new Date(activeRoutine.startDate) : activeRoutine.startDate) : (activeRoutine.createdAt ? new Date(activeRoutine.createdAt) : new Date());
    const weeksActive = Math.max(1, differenceInCalendarWeeks(new Date(), startDateRaw));
    const isFuture = startDateRaw > new Date();

    return (
        <div className="space-y-12 pb-32 relative">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[150px] pointer-events-none -z-10" />

            {/* Header */}
            <ClientMotionDiv
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2"
            >
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="h-px w-8 bg-red-600/30" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
                        Mi Rutina <span className="text-red-600">Actual</span>
                    </h2>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/train/log">
                        <Button variant="outline" className="h-14 rounded-2xl border-white/5 bg-neutral-900/40 backdrop-blur-xl text-neutral-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all px-8">
                            Bitácora Manual
                        </Button>
                    </Link>
                    <Link href="/train">
                        <Button className="h-14 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-all px-10 shadow-xl shadow-white/5 flex items-center gap-3 group">
                            <Play className="h-4 w-4 fill-black group-hover:scale-110 transition-transform" />
                            Ejecutar Sesión
                        </Button>
                    </Link>
                </div>
            </ClientMotionDiv>

            {/* Info Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Frecuencia", val: `${frequency} D/S`, icon: Activity, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
                    { label: "Volumen", val: `${totalExercises} MODS`, icon: Dumbbell, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                    { label: "Ciclo", val: `Semana ${weeksActive}`, icon: Sparkles, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }
                ].map((stat, i) => (
                    <ClientMotionDiv
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl p-8 flex items-center gap-6 relative overflow-hidden group shadow-2xl hover:border-white/10 transition-colors"
                    >
                        <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-linear-to-br from-white/5 via-transparent to-transparent")} />

                        <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center border shadow-xl group-hover:scale-110 transition-transform duration-500", stat.bg, stat.border)}>
                            <stat.icon className={cn("h-7 w-7", stat.color)} />
                        </div>

                        <div>
                            <p className="text-neutral-500 text-[10px] uppercase font-black tracking-[0.3em] mb-1 italic">{stat.label}</p>
                            <p className="text-white font-black text-2xl tracking-tighter uppercase italic">{stat.val}</p>
                        </div>
                    </ClientMotionDiv>
                ))}
            </div>

            {/* Banner si comienza en el futuro */}
            {isFuture && (
                <ClientMotionDiv
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl flex items-center gap-4 text-blue-400 backdrop-blur-3xl"
                >
                    <Info className="h-6 w-6 shrink-0" />
                    <p className="text-sm font-black uppercase tracking-tight italic">
                        Rutina programada para iniciar el <span className="underline">{startDateRaw.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
                    </p>
                </ClientMotionDiv>
            )}

            {/* Rutina Activa */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                            {schedule.length === 1
                                ? "Rutina Única"
                                : activeRoutine.name.replace(/\s*\(Assigned\)/gi, "").trim()}
                        </h3>
                        {activeRoutine.description && (
                            <p className="text-neutral-500 text-sm max-w-2xl leading-relaxed italic font-bold">{activeRoutine.description}</p>
                        )}
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-500 px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 backdrop-blur-xl">
                        Estatus: Activo
                    </span>
                </div>

                <div className="grid gap-6">
                    {schedule.map((day: ScheduleDay, index: number) => (
                        <ClientMotionDiv
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "border rounded-4xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between transition-all group relative overflow-hidden shadow-2xl backdrop-blur-3xl",
                                day.isRest
                                    ? "bg-neutral-900/10 border-white/5 opacity-50 grayscale"
                                    : "bg-neutral-900/40 border-white/5 hover:border-white/10"
                            )}
                        >
                            <div className="absolute inset-0 bg-linear-to-r from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                            <div className="flex items-center gap-8 relative z-10 w-full md:w-auto">
                                <div className={cn(
                                    "h-20 w-20 border rounded-3xl flex items-center justify-center font-black text-3xl transition-all shadow-xl",
                                    day.isRest
                                        ? "bg-neutral-950/50 border-white/5 text-neutral-800"
                                        : "bg-black/50 border-white/5 text-neutral-500 group-hover:text-white group-hover:border-red-500/30 group-hover:bg-red-950/20"
                                )}>
                                    {day.isRest ? <Moon className="h-8 w-8" /> : String(index + 1).padStart(2, '0')}
                                </div>
                                <div className="space-y-2">
                                    <h3 className={cn(
                                        "font-black text-xl uppercase italic tracking-tight transition-colors",
                                        day.isRest ? "text-neutral-600" : "text-white group-hover:text-red-500"
                                    )}>{day.name}</h3>
                                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-neutral-600">
                                        {day.isRest ? (
                                            <span className="flex items-center gap-2 italic">
                                                <div className="h-1.5 w-1.5 rounded-full bg-neutral-800" />
                                                Día de Descanso
                                            </span>
                                        ) : (
                                            <>
                                                <span className="flex items-center gap-2">
                                                    <Dumbbell className="h-3.5 w-3.5 text-red-500/50" /> {day.exercises?.length || 0} Ejercicios
                                                </span>
                                                <span className="flex items-center gap-2">
                                                    <Clock className="h-3.5 w-3.5 text-blue-500/50" /> {(day.exercises?.length || 0) * 4} Min
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 md:mt-0 w-full md:w-auto relative z-10 flex gap-2">
                                {!day.isRest && (
                                    <Link href={`/my-routine/day/${index}`} className="block flex-1 md:flex-none">
                                        <Button className="w-full md:w-auto px-8 h-12 rounded-2xl bg-white/5 border border-white/10 text-neutral-300 font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-lg active:scale-95">
                                            Analizar
                                        </Button>
                                    </Link>
                                )}
                                {(session.user.role === "advanced_athlete" || session.user.role === "coach") && (
                                    <Link href={`/routines/${activeRoutine.id}?day=${index}`} className="block">
                                        <Button variant="outline" className="w-12 h-12 p-0 rounded-2xl bg-white/5 border border-white/10 text-neutral-300 hover:bg-white hover:text-black transition-all shadow-lg active:scale-95 flex items-center justify-center">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </ClientMotionDiv>
                    ))}

                    {schedule.length === 0 && (
                        <div className="p-20 text-center bg-neutral-900/20 border border-white/5 rounded-4xl backdrop-blur-3xl shadow-2xl">
                            <span className="text-neutral-600 font-black uppercase tracking-[0.3em] text-[10px]">Sin ejercicios configurados para hoy.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
