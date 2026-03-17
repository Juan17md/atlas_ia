import { auth } from "@/lib/auth";
import { getStrengthHistory, getStrengthProgress } from "@/actions/analytics-actions";
import { getAllAthletes } from "@/actions/coach-actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StrengthCharts } from "@/components/progress/strength-charts";
import { ClientMotionDiv } from "@/components/ui/client-motion";

interface StrengthPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StrengthPage({ searchParams }: StrengthPageProps) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const isCoach = session.user.role === "coach";
    let targetUserId = session.user.id;

    if (isCoach) {
        const result = await getAllAthletes();
        const athletes = result.athletes || [];
        const params = await searchParams;
        const requestedId = params?.athleteId as string;

        if (requestedId) {
            targetUserId = requestedId;
        } else if (athletes.length > 0) {
            targetUserId = athletes[0].id;
        }
    }

    const [historyResult, progressResult] = await Promise.all([
        getStrengthHistory(targetUserId),
        getStrengthProgress(targetUserId),
    ]);

    const exercises = historyResult.success && historyResult.exercises ? historyResult.exercises : [];
    const overallProgress = progressResult.success && progressResult.progress ? progressResult.progress : 0;

    return (
        <div className="flex flex-col gap-10 pb-32 relative overflow-hidden">
            {/* Background glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none -z-10" />
            <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            {/* Header */}
            <ClientMotionDiv
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2"
            >
                <div className="flex items-center gap-6">
                    <Link href="/progress">
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5 transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                    </Link>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-px w-8 bg-purple-600/30" />
                            <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] italic">Análisis de Rendimiento</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                            Evolución de Fuerza
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-neutral-900/30 backdrop-blur-xl border border-white/5 rounded-2xl px-5 py-3">
                    <div className="h-10 w-10 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                        <p className="text-xl font-black text-white italic tracking-tighter">
                            {overallProgress >= 0 ? "+" : ""}{overallProgress}%
                        </p>
                        <p className="text-[9px] text-neutral-500 font-black uppercase tracking-[0.2em]">Promedio General</p>
                    </div>
                </div>
            </ClientMotionDiv>

            {/* Charts */}
            <ClientMotionDiv
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <StrengthCharts exercises={exercises} overallProgress={overallProgress} />
            </ClientMotionDiv>
        </div>
    );
}
