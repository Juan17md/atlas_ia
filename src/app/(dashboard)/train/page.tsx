import { getActiveRoutine } from "@/actions/athlete-actions";
import { getTodayAssignment } from "@/actions/schedule-actions";
import { getRoutine } from "@/actions/routine-actions";
import { WorkoutSession } from "@/components/training/workout-session";
import { RestDayView } from "@/components/training/rest-day-view";
import { WorkoutCompletedView } from "@/components/training/workout-completed-view";
import { checkCompletedWorkoutToday } from "@/actions/training-actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AlertCircle, Dumbbell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Tipo inline para compatibilidad con WorkoutSession
type WorkoutRoutine = {
    id: string;
    name: string;
    schedule: Array<{
        id?: string;
        name: string;
        isRest?: boolean;
        exercises: Array<{
            exerciseId?: string;
            exerciseName: string;
            variantIds?: string[];
            notes?: string;
            sets: Array<{ reps?: number; weight?: number; type?: "warmup" | "working" | "failure"; rpeTarget?: number }>;
        }>;
    }>;
};

export default async function TrainPage(props: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const searchParams = props.searchParams ? await props.searchParams : {};
    const isFreeMode = searchParams.mode === 'free';
    const isAssignedConfirmed = searchParams.assigned === 'true';
    const isAdvanced = session.user.role === 'advanced_athlete';

    // Detect if today is a weekend day (Saturday = 6, Sunday = 0)
    const todayDate = new Date();
    const dayOfWeek = todayDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const rawDayName = todayDate.toLocaleDateString('es-ES', { weekday: 'long' });
    const dayName = rawDayName.charAt(0).toUpperCase() + rawDayName.slice(1);

    // 0. Check if there's a completed session for today
    const { completed } = await checkCompletedWorkoutToday();
    if (completed) {
        return <WorkoutCompletedView />;
    }

    if (isAdvanced && isFreeMode) {
        const dummyRoutine: WorkoutRoutine = {
            id: `free_workout_${Date.now()}`,
            name: 'Rutina Libre',
            schedule: [{
                id: 'base_day',
                name: dayName,
                isRest: false,
                exercises: []
            }]
        };
        return <WorkoutSession routine={dummyRoutine} userRole={session.user.role as string} />;
    }

    // 1. Check for a specific assignment for TODAY
    const todayISO = todayDate.toISOString().split('T')[0];
    const { assignment } = await getTodayAssignment(session.user.id, todayISO);

    // Si es atleta avanzado y no ha elegido todavía, le mostramos el Triage
    if (isAdvanced && !isFreeMode && !isAssignedConfirmed) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

                <div className="relative space-y-12 max-w-sm md:max-w-md w-full animate-in fade-in zoom-in duration-700">
                    <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                            Selecciona tu Modalidad
                        </h1>
                        <p className="text-neutral-500 font-bold text-xs md:text-sm leading-relaxed px-4">
                            Eres <span className="text-amber-500">Atleta PRO</span>. Puedes completar tu rutina planificada o iniciar un entrenamiento libre.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:gap-6">
                        <Link href="/train?assigned=true" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 rounded-3xl">
                            <Button className="w-full h-24 bg-neutral-900 border border-white/5 text-white hover:bg-white/5 font-black uppercase italic tracking-widest text-lg rounded-3xl transition-all shadow-2xl active:scale-95 flex flex-col items-center justify-center group relative overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-r from-red-600/0 via-red-600/10 to-red-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                <div className="flex items-center gap-3 relative z-10">
                                    <Calendar className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
                                    <span>Asignada</span>
                                </div>
                                <span className="text-[10px] font-bold text-neutral-500 mt-1.5 relative z-10">
                                    {assignment ? "Tienes un entrenamiento programado hoy" : "Revisar plan principal"}
                                </span>
                            </Button>
                        </Link>

                        <Link href="/train?mode=free" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20 rounded-3xl">
                            <Button className="w-full h-24 bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/15 font-black uppercase italic tracking-widest text-lg rounded-3xl transition-all shadow-2xl shadow-amber-900/10 active:scale-95 flex flex-col items-center justify-center group relative overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-r from-amber-600/0 via-amber-600/10 to-amber-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                <div className="flex items-center gap-3 relative z-10">
                                    <Dumbbell className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                                    <span>Rutina Libre</span>
                                </div>
                                <span className="text-[10px] font-bold text-amber-500/70 mt-1.5 relative z-10">
                                    Elige los ejercicios sobre la marcha
                                </span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Si es fin de semana y no hay asignación de coach, es día de descanso
    if (isWeekend && !assignment) {
        return <RestDayView dayName={dayName} />;
    }

    let routine;
    let activeDayId: string | undefined;

    if (assignment) {
        // Cast a través de unknown para evitar error de "no overlap" de tipos
        const assigned = assignment as unknown as { routineId: string; dayId: string };
        // Cargar la rutina asignada
        const routineRes = await getRoutine(assigned.routineId);
        if (routineRes.success && routineRes.routine) {
            routine = routineRes.routine;
            activeDayId = assigned.dayId;
        }
    } else {
        // Fallback: Verificar rutina activa general (modo legacy/simple)
        const { routine: activeRoutine } = await getActiveRoutine();
        routine = activeRoutine;
    }

    if (!routine) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

                <div className="relative space-y-12 max-w-md w-full animate-in fade-in zoom-in duration-700">
                    <div className="relative mx-auto w-32 h-32 flex items-center justify-center group">
                        <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-3xl border border-white/5 rounded-3xl rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                        <AlertCircle className="w-12 h-12 text-red-500 relative z-10 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                            Frecuencia No Encontrada
                        </h1>
                        <p className="text-neutral-500 font-bold text-sm leading-relaxed">
                            No tienes una rutina de entrenamiento asignada para hoy. Pulsa el botón inferior para volver a la base.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <Link href="/dashboard" className="block">
                            <Button className="w-full h-14 bg-white text-black font-black uppercase italic tracking-widest rounded-2xl hover:bg-neutral-200 transition-all shadow-xl shadow-white/5 active:scale-95">
                                Retorno Seguro
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Filtrar la rutina para mostrar solo el día relevante
    let workoutRoutine = routine as unknown as WorkoutRoutine;
    let selectedDay;

    if (activeDayId) {
        selectedDay = workoutRoutine.schedule.find(d => d.id === activeDayId);
    } else {
        // Intentar encontrar un día que coincida con el día actual (insensible a mayúsculas)
        selectedDay = workoutRoutine.schedule.find(d =>
            d.name.toLowerCase().trim() === dayName.toLowerCase().trim()
        );

        // Si no se encuentra por nombre, usar schedule[0] (comportamiento existente) pero al menos lo intentamos
        if (!selectedDay) {
            selectedDay = workoutRoutine.schedule[0];
        }
    }

    if (selectedDay) {
        // Si el día seleccionado es de descanso, mostrar vista de descanso
        if ("isRest" in selectedDay && selectedDay.isRest) {
            return <RestDayView dayName={dayName} />;
        }

        workoutRoutine = {
            ...workoutRoutine,
            schedule: [selectedDay]
        };
    }

    return <WorkoutSession routine={workoutRoutine} userRole={(session.user.role as string) || "athlete"} />;
}
