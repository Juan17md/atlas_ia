import { getTrainingLogs } from "@/actions/training-logs";
import { TrainingHistoryList } from "@/components/training/training-history-list";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar, Zap, Activity, TrendingUp } from "lucide-react";
import Link from "next/link";
import { ClientMotionDiv } from "@/components/ui/client-motion";

import type { TrainingSetData, TrainingExerciseData, TrainingLogData } from "@/types";

export default async function HistoryPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { logs, error } = await getTrainingLogs(session.user.id);

    // Calculate some stats for the header
    const typedLogs = logs as TrainingLogData[] | undefined;
    const totalSessions = typedLogs?.length || 0;

    // Total Volume
    const totalVolume = typedLogs?.reduce((acc: number, log: TrainingLogData) => {
        return acc + (log.exercises?.reduce((exAcc: number, ex: TrainingExerciseData) => {
            return exAcc + (ex.sets?.reduce((setAcc: number, s: TrainingSetData) => setAcc + ((s.weight || 0) * (s.reps || 0)), 0) || 0);
        }, 0) || 0);
    }, 0) || 0;

    // Average RPE (Session RPE)
    const logsWithRpe = typedLogs?.filter(log => (log.sessionRpe || 0) > 0) || [];
    const avgRpe = logsWithRpe.length > 0
        ? logsWithRpe.reduce((acc, log) => acc + (log.sessionRpe || 0), 0) / logsWithRpe.length
        : 0;

    const thisMonthLogs = typedLogs?.filter((log: TrainingLogData) => {
        const logDate = new Date(log.date);
        const now = new Date();
        return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
    }) || [];

    return (
        <div className="space-y-12 pb-24 md:pb-10 relative">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-red-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

            {/* Header Area */}
            <ClientMotionDiv
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-8"
            >
                <div className="flex items-center gap-6">
                    <Link href="/dashboard">
                        <div className="group h-12 w-12 rounded-2xl border border-white/5 bg-neutral-900/50 flex items-center justify-center hover:bg-red-600 hover:border-red-600 transition-all duration-500 text-neutral-500 group-hover:text-white group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-500" />
                        </div>
                    </Link>
                    <div className="space-y-1">
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Registros</h2>
                        <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-[10px] ml-1">
                            Análisis Temporal: <span className="text-red-500">Historial de Operaciones</span>
                        </p>
                    </div>
                </div>
            </ClientMotionDiv>

            {/* Quick Stats Matrix */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: "Sesiones", value: totalSessions, icon: Activity, color: "text-white", glow: "bg-white/5" },
                    { label: "Carga Total", value: `${Math.round(totalVolume / 1000)}k`, icon: TrendingUp, color: "text-red-500", glow: "bg-red-600/5" },
                    { label: "Mensual", value: thisMonthLogs.length, icon: Calendar, color: "text-blue-500", glow: "bg-blue-600/5" },
                    { label: "Esfuerzo", value: avgRpe > 0 ? avgRpe.toFixed(1) : "0", icon: Zap, color: "text-amber-500", glow: "bg-amber-500/5" }
                ].map((stat, i) => (
                    <ClientMotionDiv
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl p-8 relative overflow-hidden group shadow-2xl"
                    >
                        <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none transition-colors duration-500 opacity-0 group-hover:opacity-100", stat.glow)}></div>
                        <div className="flex flex-col relative z-10">
                            <div className="w-12 h-12 bg-neutral-950 border border-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <p className="text-4xl font-black text-white italic tracking-tighter mb-1">{stat.value}</p>
                            <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em]">{stat.label}</p>
                        </div>
                    </ClientMotionDiv>
                ))}
            </div>

            {/* Logs List Section */}
            <div className="relative">
                {error ? (
                    <ClientMotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-600/10 border border-red-600/20 p-12 rounded-4xl backdrop-blur-3xl text-center"
                    >
                        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-6" />
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Error de Sincronización</h3>
                        <p className="text-red-500 font-bold uppercase tracking-widest text-[10px]">{error}</p>
                    </ClientMotionDiv>
                ) : (
                    <TrainingHistoryList logs={logs || []} />
                )}
            </div>
        </div>
    );
}

// Missing icons and utils
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
