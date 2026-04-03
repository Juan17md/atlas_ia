"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Activity, PlayCircle, TrendingUp, Plus, Clock, FileText, UserPlus, ChevronRight, Users, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatCard } from "@/components/dashboard/stat-card";
import { ScheduleCalendar } from "@/components/dashboard/schedule-calendar";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardUser, RecentActivity, SerializedRoutine } from "@/types";
import { cn } from "@/lib/utils";

const ActivityChart = dynamic(
    () => import("@/components/dashboard/activity-chart").then(mod => mod.ActivityChart),
    { loading: () => <Skeleton className="w-full h-[250px] rounded-xl bg-neutral-800" /> }
);

const ProgressChart = dynamic(
    () => import("@/components/dashboard/progress-chart").then(mod => mod.ProgressChart),
    { loading: () => <Skeleton className="w-[220px] h-[220px] rounded-full bg-neutral-800 mx-auto" /> }
);

interface AthleteDashboardUIProps {
    user: DashboardUser | undefined;
    activityData: any;
    weeklyCompleted: number;
    weeklyTarget: number;
    routine: any;
}

export function AthleteDashboardUI({ user, activityData, weeklyCompleted, weeklyTarget, routine }: AthleteDashboardUIProps) {
    return (
        <div className="space-y-8 md:space-y-12 pb-24 md:pb-10 relative">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 md:flex-row md:justify-between md:items-end mb-2"
            >
                <div className="space-y-1">
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-tight">Dashboard</h2>
                    <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-[10px] ml-1 flex items-center gap-2">
                        Bienvenido de nuevo, <span className="text-red-500">{user?.name?.split(' ')[0]}</span>
                        {user?.role === 'advanced_athlete' && (
                            <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-lg text-[8px] font-black tracking-widest border border-amber-500/20">PRO</span>
                        )}
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full md:w-auto md:flex md:gap-4">
                    <Link href="/history" className="w-full md:w-auto">
                        <Button variant="ghost" className="w-full rounded-2xl border border-white/5 bg-neutral-900/40 backdrop-blur-md hover:bg-neutral-800 text-white h-11 md:h-14 px-8 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95">
                            Historial
                        </Button>
                    </Link>
                    <Link href="/train" className="w-full md:w-auto">
                        <Button className="w-full rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black h-11 md:h-14 px-10 shadow-2xl shadow-red-900/40 uppercase tracking-widest text-[10px] transition-all active:scale-95 group">
                            <PlayCircle className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                            Entrenar
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="Sesiones"
                    value={weeklyCompleted?.toString() || "0"}
                    label="Esta semana"
                    trend="neutral"
                    icon={Dumbbell}
                    color="red"
                />
                <StatCard
                    title="Volumen Semanal"
                    value={`${Math.round((activityData?.reduce((acc: number, cur: any) => acc + cur.total, 0) || 0) / 1000)}k`}
                    label="Kg levantados"
                    trend="neutral"
                    icon={TrendingUp}
                />
                <StatCard
                    title="Meta"
                    value={weeklyTarget?.toString() || "0"}
                    label="Sesiones objetivo"
                    trend="neutral"
                    icon={Activity}
                    color="blue"
                />
                <StatCard
                    title="Puntos"
                    value="420"
                    label="Nivel 4"
                    trend="up"
                    trendValue="+12%"
                    icon={Plus}
                />
            </div>

            {/* Schedule Section */}
            <div className="relative">
                <ScheduleCalendar athleteId={user?.id || ""} activeRoutine={routine} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="lg:col-span-2 bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl md:rounded-4xl p-5 md:p-10 flex flex-col shadow-2xl"
                >
                    <div className="flex justify-between items-start mb-10">
                        <div className="space-y-1">
                            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Actividad Reciente</h3>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Volumen Acumulado por Sesión</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center">
                            <Activity className="w-5 h-5 text-neutral-400" />
                        </div>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <ActivityChart data={activityData} />
                    </div>
                </motion.div>

                    {/* Progress & Next Routine */}
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl md:rounded-4xl p-5 md:p-8 shadow-2xl"
                    >
                        <div className="mb-px">
                            <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">Objetivo</h3>
                            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">Regularidad Semanal</p>
                        </div>
                        <ProgressChart completed={weeklyCompleted} target={weeklyTarget} />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl md:rounded-4xl overflow-hidden group hover:border-red-500/30 transition-all duration-500 shadow-2xl relative"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-red-600/20 transition-all duration-700" />

                        <div className="relative z-10 p-6 md:p-8">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-2">
                                {new Date().getDay() === 0 || new Date().getDay() === 6 ? "Rest Day" : "Next Session"}
                            </p>
                            {new Date().getDay() === 0 || new Date().getDay() === 6 ? (
                                <>
                                    <h3 className="text-3xl font-black mb-1 text-white uppercase tracking-tighter italic">Recuperación</h3>
                                    <p className="text-xs text-neutral-500 font-medium mb-8 leading-relaxed">Carga energías. Tu cuerpo construye músculo mientras descansas.</p>
                                    <Link href="/train">
                                        <Button variant="ghost" className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-[0.2em] text-[10px] py-6">
                                            Plan de Acción
                                        </Button>
                                    </Link>
                                </>
                            ) : routine ? (
                                <>
                                    <h3 className="text-3xl font-black mb-1 text-white uppercase tracking-tighter italic">{(routine as unknown as SerializedRoutine).name}</h3>
                                    <p className="text-xs text-neutral-500 font-medium mb-8 uppercase tracking-widest">{((routine as unknown as SerializedRoutine).schedule?.length) || 0} bloqueos en calendario</p>
                                    <Link href="/train">
                                        <Button className="w-full rounded-2xl bg-white text-black hover:bg-neutral-200 font-black uppercase tracking-[0.2em] text-[10px] py-6 shadow-xl shadow-white/5 h-12 md:h-14 active:scale-95 transition-all">
                                            Iniciar Sesión
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-black mb-1 text-neutral-500 uppercase italic">Sin Rutina</h3>
                                    <p className="text-xs text-neutral-600 font-medium mb-8">Contacta a tu coach para recibir tu plan personalizado.</p>
                                    <Button disabled className="w-full rounded-2xl bg-neutral-900 text-neutral-700 font-black uppercase tracking-[0.2em] text-[10px] py-6 grayscale">
                                        No disponible
                                    </Button>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* AI Insight Card - Re-Stylized */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-linear-to-br from-neutral-900 via-neutral-900 to-red-900/20 border border-white/5 rounded-3xl md:rounded-4xl p-6 md:p-10 relative overflow-hidden group shadow-3xl"
            >
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
                    <Activity className="w-64 h-64 text-red-500 rotate-12" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase tracking-[0.3em]">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            AI Coach Insight
                        </div>
                        <h3 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                            Tu potencial no <br />tiene límites
                        </h3>
                        <p className="text-neutral-400 font-medium leading-relaxed max-w-xl text-lg opacity-80">
                            {weeklyCompleted >= (weeklyTarget || 0)
                                ? "Has pulverizado tus objetivos semanales. Tus niveles de fuerza están en su punto máximo. Mantén este ritmo pero no descuides el descanso activo."
                                : `Faltan ${weeklyTarget - weeklyCompleted} sesiones para dominar la semana. La constancia es lo que separa a los profesionales de los aficionados.`}
                        </p>
                    </div>

                    <div className="shrink-0 w-full md:w-auto">
                        <Link href="/progress">
                            <Button className="w-full md:w-auto rounded-3xl h-16 px-12 bg-white text-black hover:bg-neutral-200 font-black uppercase tracking-[0.2em] text-[11px] transition-all active:scale-95 shadow-2xl shadow-white/5">
                                Analizar Evolución
                            </Button>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

interface CoachDashboardUIProps {
    user: DashboardUser | undefined;
    stats: any;
    activities: RecentActivity[];
}

export function CoachDashboardUI({ user, stats, activities }: CoachDashboardUIProps) {
    return (
        <div className="space-y-8 md:space-y-12 pb-24 md:pb-10 relative">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6 md:flex-row md:justify-between md:items-end mb-4 md:mb-6"
            >
                <div className="space-y-1">
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Command Center</h2>
                    <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-[10px] ml-1">
                        Panel de Control: <span className="text-red-500">Coach Mode</span>
                    </p>
                </div>
                <div className="flex gap-4 items-center w-full md:w-auto">
                    <Link href="/athletes" className="w-full md:w-auto">
                        <Button className="group relative w-full md:w-auto overflow-hidden rounded-2xl bg-red-600 px-8 h-12 md:h-14 text-xs font-black text-white shadow-2xl shadow-red-900/40 transition-all duration-300 active:scale-95 group hover:bg-red-700">
                            <span className="relative z-10 flex items-center gap-3 uppercase tracking-[0.2em]">
                                <Users className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                                Gestionar Atletas
                                <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                            </span>
                        </Button>
                    </Link>
                </div>
            </motion.div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    title="Atletas Totales"
                    value={stats?.totalAthletes?.toString() || "0"}
                    label="Registrados"
                    trend="neutral"
                    icon={Users}
                    color="red"
                />
                <StatCard
                    title="Rutinas Creadas"
                    value={stats?.totalRoutines?.toString() || "0"}
                    label="En biblioteca"
                    trend="neutral"
                    icon={CalendarDays}
                />
                <StatCard
                    title="Ejercicios"
                    value={stats?.totalExercises?.toString() || "0"}
                    label="Disponibles"
                    trend="neutral"
                    icon={Dumbbell}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Charts & Activity */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Activity Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl md:rounded-4xl p-6 md:p-10 shadow-2xl"
                    >
                        <div className="flex justify-between items-start mb-10">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Actividad Global</h3>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Volumen Semanal Acumulado (Todos los atletas)</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                <Activity className="w-5 h-5 text-red-500" />
                            </div>
                        </div>
                        <ActivityChart data={stats?.weeklyChartData || []} />
                    </motion.div>

                    {/* Recent Activity Feed */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl md:rounded-4xl p-6 md:p-10 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Feed de Actividad</h3>
                                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Monitoreo en tiempo real</p>
                            </div>
                            <Link href="/athletes" className="text-[10px] font-black text-red-500 hover:text-red-400 flex items-center gap-2 uppercase tracking-widest bg-red-500/5 px-4 py-2 rounded-full border border-red-500/10 transition-all hover:bg-red-500/10">
                                Ver Todo <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {activities.length > 0 ? (
                                activities.map((activity: RecentActivity, idx: number) => (
                                    <motion.div
                                        key={activity.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="flex items-center justify-between p-5 bg-black/40 border border-white/5 rounded-3xl hover:bg-white/5 transition-all group hover:border-red-500/20"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                <Avatar className="h-12 w-12 border-2 border-white/10 group-hover:border-red-500/40 transition-colors">
                                                    <AvatarImage src={activity.athleteImage ?? undefined} />
                                                    <AvatarFallback className="bg-neutral-800 text-neutral-400 font-black">
                                                        {activity.athleteName?.[0]?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-black">
                                                    <Dumbbell className="w-2.5 h-2.5 text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-black text-white tracking-tight leading-none mb-1 group-hover:text-red-500 transition-colors">{activity.athleteName}</p>
                                                <p className="text-neutral-500 text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-1.5">
                                                    {activity.routineName}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-black text-xl tracking-tighter leading-none mb-1 italic">
                                                {activity.volume} <span className="text-[10px] font-bold text-neutral-500 not-italic uppercase">kg</span>
                                            </p>
                                            <p className="text-neutral-600 text-[9px] uppercase font-black tracking-widest flex items-center justify-end gap-1.5">
                                                <Clock className="w-3 h-3" /> {new Date(activity.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-6 md:py-12 bg-black/20 rounded-3xl md:rounded-4xl border border-dashed border-white/5">
                                    <Activity className="w-12 h-12 mx-auto mb-4 text-neutral-700 opacity-50" />
                                    <p className="text-xs font-black text-neutral-600 uppercase tracking-widest">Sin actividad registrada hoy</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Right Col: Actions & Status */}
                <div className="space-y-8">
                    {/* Quick Actions Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl md:rounded-4xl p-6 md:p-8 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-red-600/20 transition-all duration-700" />

                        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1 relative z-10">Herramientas</h3>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-8 relative z-10 italic">Acceso rápido a gestión</p>

                        <div className="space-y-3 relative z-10">
                            <Link href="/routines" className="block">
                                <Button className="w-full justify-start h-12 md:h-14 rounded-2xl border border-white/5 bg-neutral-900/50 hover:bg-neutral-800 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:translate-x-1">
                                    <FileText className="w-4 h-4 mr-3 text-red-500" /> Nueva Rutina
                                </Button>
                            </Link>
                            <Link href="/exercises" className="block">
                                <Button className="w-full justify-start h-12 md:h-14 rounded-2xl border border-white/5 bg-neutral-900/50 hover:bg-neutral-800 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:translate-x-1">
                                    <Plus className="w-4 h-4 mr-3 text-red-500" /> Cargar Ejercicio
                                </Button>
                            </Link>
                            <Link href="/athletes" className="block">
                                <Button className="w-full justify-start h-12 md:h-14 rounded-2xl border border-white/5 bg-neutral-900/50 hover:bg-neutral-800 text-white font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:translate-x-1">
                                    <UserPlus className="w-4 h-4 mr-3 text-red-500" /> Alta Atleta
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Active Sessions Mini-List */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl md:rounded-4xl p-6 md:p-8 shadow-2xl"
                    >
                        <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-6">Status del Hub</h3>
                        <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-black text-white uppercase tracking-widest">Motor AI Operativo</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

