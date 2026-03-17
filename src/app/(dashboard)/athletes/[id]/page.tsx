import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

import { getPersonalRecords, getWeeklyActivity, getWeeklyProgress } from "@/actions/analytics-actions";
import { getTrainingLogs } from "@/actions/training-actions";
import { getAthleteRoutine, getCoachRoutines } from "@/actions/routine-actions";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { TrainingHistoryList } from "@/components/training/training-history-list";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AssignRoutineModal } from "@/components/routines/assign-routine-modal";
import { ArrowLeft, Dumbbell, Trophy, Target, Calendar, Activity, ShieldAlert, Heart } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CoachAIAnalysis } from "@/components/dashboard/coach-ai-analysis";
import { ScheduleCalendar } from "@/components/dashboard/schedule-calendar";
import { EditHealthDialog } from "@/components/dashboard/edit-health-dialog";
import { ClientMotionDiv } from "@/components/ui/client-motion";
import { AthleteStatsCards } from "@/components/dashboard/athlete-stats-cards";

interface Athlete {
    id: string;
    name?: string;
    image?: string;
    email?: string;
    coachId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt?: any; // Firestore Timestamp
    goal?: string;
    injuries?: string[];
    medicalConditions?: string[];
}

interface ActivityData {
    total: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

interface PersonalRecord {
    exercise: string;
    weight: number;
    date: string;
}

interface PageProps {
    params: Promise<{ id: string }>;
}

interface RoutineData {
    id: string;
    name?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schedule?: any[];
}

export default async function AthleteDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "coach") redirect("/dashboard");

    // 1. Verify access & fetch basic user info
    const userDoc = await adminDb.collection("users").doc(id).get();
    if (!userDoc.exists) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                    <Target className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Atleta no encontrado</h1>
                <p className="text-neutral-400 mb-6">El perfil que buscas no existe.</p>
                <Link href="/athletes">
                    <Button variant="outline" className="rounded-full">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Atletas
                    </Button>
                </Link>
            </div>
        );
    }

    // Check if assigned


    const athlete = { id: userDoc.id, ...userDoc.data() } as Athlete;

    // 2. Fetch Analytics
    const { prs } = await getPersonalRecords(id);
    const { data: activityData } = await getWeeklyActivity(id);
    const { completed: weeklyCompleted, target: weeklyTarget } = await getWeeklyProgress(id);
    const { logs } = await getTrainingLogs(id);
    const routine = (await getAthleteRoutine(id)) as unknown as RoutineData | null;

    // Fetch library routines for assignment model
    const { routines: coachRoutinesRaw } = await getCoachRoutines();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coachRoutines = Array.from(new Map((coachRoutinesRaw || []).map((r: any) => [r.id, r])).values());

    // Calculate total volume from activity data
    const weeklyVolume = activityData?.reduce((acc: number, cur: ActivityData) => acc + cur.total, 0) || 0;

    return (
        <div className="space-y-12 pb-32 md:pb-20 relative">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute top-1/2 -left-20 w-80 h-80 bg-red-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

            {/* Header Area */}
            <ClientMotionDiv
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-8"
            >
                <div className="flex items-center gap-6">
                    <Link href="/athletes">
                        <div className="group h-12 w-12 rounded-2xl border border-white/5 bg-neutral-900/50 flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all duration-500 text-neutral-500 group-hover:text-white group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-500" />
                        </div>
                    </Link>

                    <div className="relative">
                        <div className="absolute inset-0 bg-red-600/20 rounded-3xl blur-xl opacity-20 pointer-events-none" />
                        <Avatar className="h-20 w-20 border-2 border-white/10 rounded-3xl relative z-10 shadow-2xl">
                            <AvatarImage src={athlete.image} className="object-cover" />
                            <AvatarFallback className="bg-neutral-900 text-white font-black text-2xl italic">
                                {athlete.name?.[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
                                {athlete.name}
                            </h1>
                        </div>
                        <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.3em] mt-2">
                            Email: <span className="text-white italic">{athlete.email}</span>
                        </p>
                    </div>
                </div>

                <div className="flex flex-col w-full md:w-auto md:items-end gap-4">
                    {routine ? (
                        <Link href={`/athletes/${athlete.id}/routine`} className="group block">
                            <div className="bg-neutral-900/40 backdrop-blur-3xl border border-white/5 hover:border-red-600/30 rounded-3xl flex items-center pr-8 pl-4 py-3 gap-5 transition-all duration-500 cursor-pointer shadow-2xl h-20">
                                <div className="h-12 w-12 bg-linear-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                    <Dumbbell className="text-white w-6 h-6" />
                                </div>
                                <div className="text-left flex flex-col justify-center">
                                    <p className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em] mb-1.5">Rutina Activa</p>
                                    <p className="text-white font-black text-base uppercase tracking-tight italic group-hover:text-red-500 transition-colors duration-500 truncate max-w-[180px] md:max-w-[250px]">
                                        {routine.name || "Sin Nombre"}
                                    </p>
                                </div>
                                {routine.schedule && (
                                    <div className="hidden lg:flex flex-col items-center border-l border-white/5 pl-6 h-10 justify-center min-w-[60px]">
                                        <span className="text-[9px] text-neutral-600 font-black uppercase tracking-widest leading-none mb-1">Días</span>
                                        <span className="text-lg font-black text-white italic leading-none">{routine.schedule.length}</span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ) : (
                        <div className="h-20 flex items-center justify-center">
                            <AssignRoutineModal
                                athleteId={athlete.id}
                                athleteName={athlete.name || "Atleta"}
                                routines={coachRoutines || []}
                            />
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        {athlete.goal && (
                            <div className="flex items-center gap-2 bg-red-600/10 text-red-500 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-600/20 italic">
                                <Target className="w-4 h-4" />
                                {(() => {
                                    const map: Record<string, string> = {
                                        hypertrophy: "Hipertrofia",
                                        strength: "Fuerza",
                                        weight_loss: "Pérdida de Peso",
                                        endurance: "Resistencia",
                                        maintenance: "Mantenimiento"
                                    };
                                    return map[athlete.goal] || athlete.goal;
                                })()}
                            </div>
                        )}
                        <div className="flex items-center gap-2 bg-neutral-900/50 text-neutral-500 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 italic">
                            <Calendar className="w-4 h-4" />
                            Escalón desde {athlete.createdAt ? new Date(athlete.createdAt.toDate?.() || athlete.createdAt).toLocaleDateString('es', { month: 'short', year: 'numeric' }) : 'N/A'}
                        </div>
                    </div>
                </div>
            </ClientMotionDiv>

            <Tabs defaultValue="overview" className="space-y-10">
                <TabsList className="bg-neutral-900/40 backdrop-blur-3xl border border-white/5 p-1.5 rounded-3xl w-full sm:w-auto h-16 flex items-stretch">
                    <TabsTrigger
                        value="overview"
                        className="flex-1 sm:flex-none rounded-2xl data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-2xl px-10 text-[10px] font-black uppercase tracking-[0.2em] italic transition-all duration-500"
                    >
                        Visión General
                    </TabsTrigger>
                    <TabsTrigger
                        value="schedule"
                        className="flex-1 sm:flex-none rounded-2xl data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-2xl px-10 text-[10px] font-black uppercase tracking-[0.2em] italic transition-all duration-500"
                    >
                        Calendario
                    </TabsTrigger>
                    <TabsTrigger
                        value="history"
                        className="flex-1 sm:flex-none rounded-2xl data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-2xl px-10 text-[10px] font-black uppercase tracking-[0.2em] italic transition-all duration-500"
                    >
                        Historial
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                    {/* AI Analysis Section */}
                    <CoachAIAnalysis athleteId={athlete.id} />

                    {/* KPIs */}
                    <AthleteStatsCards
                        weeklyCompleted={weeklyCompleted || 0}
                        weeklyVolume={weeklyVolume}
                        prsLength={prs?.length || 0}
                    />

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl p-8 md:p-10 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="flex justify-between items-center mb-10 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Actividad Semanal</h3>
                                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">Sincronización de Volumen de Carga</p>
                                </div>
                            </div>
                            <div className="h-[300px] relative z-10">
                                <ActivityChart data={activityData} />
                            </div>
                        </div>

                        <div className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl p-8 md:p-10 flex flex-col group relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-600/5 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-1 relative z-10">Cumplimiento</h3>
                            <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mb-10 relative z-10">Meta Semanal</p>
                            <div className="flex-1 flex items-center justify-center relative z-10">
                                <ProgressChart completed={weeklyCompleted} target={weeklyTarget} />
                            </div>
                        </div>
                    </div>

                    {/* Salud y Lesiones */}
                    <div className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl p-8 md:p-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                                    <Activity className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Estado Biométrico</h3>
                                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">Salud, Lesiones y Limitaciones</p>
                                </div>
                            </div>
                            <EditHealthDialog
                                athlete={{
                                    id: athlete.id,
                                    name: athlete.name || "Atleta",
                                    injuries: athlete.injuries,
                                    medicalConditions: athlete.medicalConditions
                                }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 italic flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" /> Lesiones / Molestias
                                </h4>
                                {athlete.injuries && athlete.injuries.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {athlete.injuries.map((injury, i) => (
                                            <span key={i} className="bg-red-600/10 text-red-500 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-600/20 italic shadow-lg shadow-red-900/10">
                                                {injury}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 border-2 border-dashed border-white/5 rounded-3xl bg-white/2 flex items-center justify-center opacity-50">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 italic">Núcleo Íntegro - Sin Lesiones</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 italic flex items-center gap-2">
                                    <Heart className="w-4 h-4" /> Condiciones Médicas
                                </h4>
                                {athlete.medicalConditions && athlete.medicalConditions.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {athlete.medicalConditions.map((condition, i) => (
                                            <span key={i} className="bg-blue-600/10 text-blue-400 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-600/20 italic shadow-lg shadow-blue-900/10">
                                                {condition}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 border-2 border-dashed border-white/5 rounded-3xl bg-white/2 flex items-center justify-center opacity-50">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 italic">Sin Restricciones Clínicas Detectadas</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PRs Preview */}
                    {prs && prs.length > 0 && (
                        <div className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl p-8 md:p-12 relative overflow-hidden group">
                            <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mb-32 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="flex items-center gap-4 mb-10 relative z-10">
                                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                    <Trophy className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Récords Personales</h3>
                                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-1">Hitos de Capacidad Máxima</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                {prs.slice(0, 3).map((pr: PersonalRecord, i: number) => (
                                    <div key={i} className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 flex flex-col gap-4 hover:border-amber-500/30 transition-all duration-500 group/pr shadow-xl">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-black text-white uppercase italic tracking-tight group-hover/pr:text-amber-500 transition-colors">{pr.exercise}</p>
                                                <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest mt-1">{pr.date}</p>
                                            </div>
                                            <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                                <Trophy className="w-4 h-4 text-amber-500 opacity-50" />
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-2 text-right mt-2">
                                            <p className="text-4xl font-black text-amber-500 italic leading-none">{pr.weight}</p>
                                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-1">kg</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="schedule">
                    <ScheduleCalendar athleteId={athlete.id} activeRoutine={routine} />
                </TabsContent>

                <TabsContent value="history">
                    <TrainingHistoryList logs={logs || []} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
