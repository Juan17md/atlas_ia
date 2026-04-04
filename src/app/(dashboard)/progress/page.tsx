import { auth } from "@/lib/auth";
import { Activity, Flame, Scale, TrendingUp, Trophy, Ruler, Users, ArrowLeft, Dumbbell, Sparkles, History } from "lucide-react";
import { getPersonalRecords, getStrengthProgress } from "@/actions/analytics-actions";
import { getBodyMeasurementsHistory } from "@/actions/measurement-actions";
import { adminDb } from "@/lib/firebase-admin";
import { getAllAthletes } from "@/actions/coach-actions";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogMeasurementDialog } from "@/components/profile/log-measurement-dialog";
import { ClientMotionDiv } from "@/components/ui/client-motion";

interface PersonalRecord {
    exercise: string;
    weight: number;
    date: string;
    reps?: number;
    rpe?: number;
}

interface Athlete {
    id: string;
    name?: string;
    image?: string;
    email?: string;
    [key: string]: unknown;
}

async function getLatestBodyMetrics(userId: string) {
    try {
        const userDoc = await adminDb.collection("users").doc(userId).get();
        if (!userDoc.exists) return null;

        const userData = userDoc.data();

        // Limpiar measurements para asegurar que solo pasamos números al cliente
        const rawMeasurements = userData?.measurements || {};
        const cleanMeasurements: Record<string, number> = {};

        Object.entries(rawMeasurements).forEach(([key, value]) => {
            if (typeof value === 'number') {
                cleanMeasurements[key] = value;
            }
        });

        // TRAYECTORIA DE CÁLCULO: Priorizar campo directo, si no, intentar calcular
        let bodyFat = userData?.bodyFat;

        if (!bodyFat && userData?.height && cleanMeasurements.waist && cleanMeasurements.neck) {
            const h = userData.height;
            const w = cleanMeasurements.waist;
            const n = cleanMeasurements.neck;
            const gender = userData?.gender || "male";
            const log10 = Math.log10;

            if (gender === "male" || gender !== "female") {
                const diff = w - n;
                if (diff > 0) {
                    const denom = 1.0324 - 0.19077 * log10(diff) + 0.15456 * log10(h);
                    bodyFat = (495 / denom) - 450;
                }
            } else if (gender === "female" && cleanMeasurements.hips) {
                const hip = cleanMeasurements.hips;
                const diff = (w + hip) - n;
                if (diff > 0) {
                    const denom = 1.29579 - 0.35004 * log10(diff) + 0.22100 * log10(h);
                    bodyFat = (495 / denom) - 450;
                }
            }

            if (bodyFat !== undefined && !isNaN(bodyFat)) {
                bodyFat = Math.max(2, Math.min(60, bodyFat));
                bodyFat = parseFloat(bodyFat.toFixed(1));
            }
        }

        return {
            name: userData?.name || "Usuario",
            weight: userData?.weight || 0,
            bodyFat: bodyFat || null,
            height: userData?.height || 0,
            measurements: cleanMeasurements,
            startWeight: userData?.startWeight || userData?.weight || 0,
        };
    } catch (e) {
        console.error("Error in getLatestBodyMetrics:", e);
        return null;
    }
}

interface ProgressPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
    // ... logic (session, coach, metrics, etc)
    const session = await auth();
    if (!session?.user?.id) return null;

    const isCoach = session.user.role === "coach";
    let targetUserId = session.user.id;
    let athletes: Athlete[] = [];

    // Coach Logic: Determine target user
    if (isCoach) {
        const result = await getAllAthletes();
        athletes = (result.athletes as unknown as Athlete[]) || [];

        const params = await searchParams;
        const requestedId = params?.athleteId as string;

        if (requestedId) {
            targetUserId = requestedId;
        } else if (athletes.length > 0) {
            targetUserId = athletes[0].id;
        } else {
            targetUserId = "";
        }
    }

    // Handle Empty State for Coach
    if (isCoach && !targetUserId) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

                <ClientMotionDiv
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative space-y-12 max-w-md w-full"
                >
                    <div className="relative mx-auto w-32 h-32 flex items-center justify-center group">
                        <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-3xl border border-white/5 rounded-4xl rotate-6 group-hover:rotate-0 transition-transform duration-500" />
                        <Users className="w-12 h-12 text-neutral-600 relative z-10" />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                            Escuadrón No Detectado
                        </h1>
                        <p className="text-neutral-500 font-bold text-sm leading-relaxed">
                            No se han identificado perfiles operativos bajo tu mando. Inicia el reclutamiento para comenzar el seguimiento telemétrico.
                        </p>
                    </div>

                    <Link href="/athletes/new" className="block">
                        <Button className="w-full h-14 bg-white text-black font-black uppercase italic tracking-widest rounded-2xl hover:bg-neutral-200 transition-all shadow-xl shadow-white/5 active:scale-95">
                            Reclutar Atleta
                        </Button>
                    </Link>
                </ClientMotionDiv>
            </div>
        );
    }

    const [prsResult, metrics, strengthResult, historyResult] = await Promise.all([
        getPersonalRecords(targetUserId),
        getLatestBodyMetrics(targetUserId),
        getStrengthProgress(targetUserId),
        getBodyMeasurementsHistory(targetUserId)
    ]);

    const prs = prsResult.success ? prsResult.prs : [];
    const strengthProgress = strengthResult.success && strengthResult.progress ? strengthResult.progress : 0;
    const isStrengthPositive = strengthProgress >= 0;
    const measurementHistory = historyResult.success && historyResult.data ? historyResult.data : [];

    return (
        <div className="flex flex-col gap-12 pb-32 relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[150px] pointer-events-none -z-10" />
            <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            {/* Header & Athlete Selector */}
            <div className="space-y-8">
                <ClientMotionDiv
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-2"
                >
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5 transition-all">
                                <ArrowLeft className="w-6 h-6" />
                            </Button>
                        </Link>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="h-px w-8 bg-red-600/30" />
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] italic">Análisis Biométrico</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                                {isCoach ? (
                                    <>Telemetría: <span className="text-red-600 font-black">{metrics?.name}</span></>
                                ) : "Mi Progreso"}
                            </h1>
                        </div>
                    </div>
                </ClientMotionDiv>

                {isCoach && athletes.length > 0 && (
                    <ClientMotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide px-2"
                    >
                        {athletes.map((athlete, i) => {
                            const isActive = athlete.id === targetUserId;
                            return (
                                <Link
                                    key={athlete.id}
                                    href={`/progress?athleteId=${athlete.id}`}
                                    className={cn(
                                        "flex items-center gap-3 px-2 pr-5 py-2 rounded-2xl transition-all shrink-0 border backdrop-blur-3xl shadow-xl",
                                        isActive
                                            ? "bg-red-600 border-red-500 text-white translate-y-[-2px]"
                                            : "bg-neutral-900/40 border-white/5 text-neutral-500 hover:bg-white/5 hover:text-white hover:border-white/10"
                                    )}
                                >
                                    <Avatar className="h-9 w-9 border border-white/10 shadow-lg">
                                        <AvatarImage src={athlete.image} />
                                        <AvatarFallback className="bg-black text-[10px] font-black italic">
                                            {athlete.name?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-black uppercase tracking-widest italic truncate max-w-[120px]">{athlete.name}</span>
                                </Link>
                            );
                        })}
                    </ClientMotionDiv>
                )}
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Peso Card */}
                <ClientMotionDiv
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <LogMeasurementDialog
                        initialWeight={metrics?.weight}
                        initialData={metrics?.measurements}
                        targetUserId={targetUserId}
                    >
                        <div className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center shadow-2xl">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-600/10 transition-colors"></div>
                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <div className="h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                    <Scale className="h-7 w-7 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">{metrics?.weight || "—"}<span className="text-base ml-1 text-neutral-600">KG</span></p>
                                    <p className="text-[10px] text-neutral-500 uppercase tracking-[0.3em] font-black italic">Masa Corporal</p>
                                </div>
                            </div>
                        </div>
                    </LogMeasurementDialog>
                </ClientMotionDiv>

                {/* Body Fat Card */}
                <ClientMotionDiv
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Link href="#measurements-section" className="block h-full">
                        <div className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl p-8 relative overflow-hidden group hover:border-orange-500/30 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center shadow-2xl">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-orange-600/10 transition-colors"></div>
                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <div className="h-16 w-16 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                    <Flame className="h-7 w-7 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">{metrics?.bodyFat ? `${metrics.bodyFat}%` : "—"}</p>
                                    <p className="text-[10px] text-neutral-500 uppercase tracking-[0.3em] font-black italic">Grasa Estimada</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </ClientMotionDiv>

                {/* Strength Progress Card */}
                <ClientMotionDiv
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <Link href={isCoach ? `/progress/strength?athleteId=${targetUserId}` : "/progress/strength"} className="block h-full">
                        <div className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl p-8 relative overflow-hidden group hover:border-purple-500/30 transition-all cursor-pointer h-full flex flex-col items-center justify-center text-center shadow-2xl">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-purple-600/10 transition-colors"></div>
                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <div className="h-16 w-16 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-xl group-hover:scale-110 transition-transform duration-500">
                                    <TrendingUp className="h-7 w-7 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none mb-2">
                                        {isStrengthPositive ? "+" : ""}{strengthProgress}%
                                    </p>
                                    <p className="text-[10px] text-neutral-500 uppercase tracking-[0.3em] font-black italic">Evolución Fuerza</p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </ClientMotionDiv>
            </div>

            {/* Body Measurements */}
            <div id="measurements-section" className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl overflow-hidden shadow-2xl scroll-mt-24 relative">
                <div className="absolute inset-0 bg-linear-to-b from-red-600/5 to-transparent pointer-events-none" />

                <div className="border-b border-white/5 p-8 flex items-center justify-between bg-black/20 relative z-10 w-full overflow-hidden">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-xl shrink-0">
                            <Ruler className="h-7 w-7 text-red-500" />
                        </div>
                        <div className="min-w-0 pr-4">
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter truncate">Biometría Detallada</h3>
                            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] italic truncate">Tracking de Perímetros (CM)</p>
                        </div>
                    </div>
                    
                    <Link href={`/progress/history${isCoach && targetUserId ? `?athleteId=${targetUserId}` : ''}`}>
                        <Button variant="ghost" className="h-10 px-4 rounded-xl bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest italic group shrink-0">
                            <History className="w-4 h-4 mr-2 text-red-500 group-hover:-rotate-12 transition-transform" />
                            Historial Completo
                        </Button>
                    </Link>
                </div>

                <div className="p-8 relative z-10">
                    {metrics?.measurements && Object.keys(metrics.measurements).length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(() => {
                                const allDisplayMeasurements = { ...metrics.measurements };
                                if (metrics.height) {
                                    allDisplayMeasurements.height = metrics.height;
                                }

                                return Object.entries(allDisplayMeasurements)
                                    .filter(([key]) => !["weight", "bodyfat"].includes(key.toLowerCase()))
                                    .sort(([a], [b]) => {
                                        const order = [
                                            "height", "neck", "shoulders", "chest", "waist", "abdomen", "hips", "glutes",
                                            "bicepsleft", "bicepsright", "forearmsleft", "forearmsright",
                                            "quadsleft", "quadsright", "calvesleft", "calvesright"
                                        ];
                                        const indexA = order.indexOf(a.toLowerCase());
                                        const indexB = order.indexOf(b.toLowerCase());
                                        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                                        if (indexA === -1) return 1;
                                        if (indexB === -1) return -1;
                                        return indexA - indexB;
                                    })
                                    .map(([key, value], i) => {
                                        const labels: Record<string, string> = {
                                            height: "Estatura",
                                            chest: "Torso",
                                            hips: "Cadera",
                                            waist: "Cintura",
                                            abdomen: "Abdomen",
                                            shoulders: "Hombros",
                                            glutes: "Glúteos",
                                            neck: "Cuello",
                                            bicepsleft: "Bíceps (I)",
                                            bicepsright: "Bíceps (D)",
                                            forearmsleft: "Antebrazo (I)",
                                            forearmsright: "Antebrazo (D)",
                                            quadsleft: "Muslo (I)",
                                            quadsright: "Muslo (D)",
                                            calvesleft: "Gemelo (I)",
                                            calvesright: "Gemelo (D)",
                                        };

                                        const isHeight = key.toLowerCase() === "height";

                                        return (
                                            <ClientMotionDiv
                                                key={key}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.05 }}
                                                className={cn(
                                                    "text-center p-6 bg-black/40 border border-white/5 rounded-3xl hover:border-red-500/30 transition-all hover:bg-neutral-900/60 group shadow-xl",
                                                    isHeight && "col-span-2 md:col-span-2 border-red-500/10"
                                                )}
                                            >
                                                <p className="text-3xl font-black text-white mb-1 group-hover:scale-110 transition-transform origin-bottom italic">
                                                    {value as number}
                                                    <span className="text-[10px] text-neutral-600 ml-1 font-black">CM</span>
                                                </p>
                                                <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-black group-hover:text-red-500 transition-colors italic">
                                                    {labels[key.toLowerCase()] || key}
                                                </p>
                                            </ClientMotionDiv>
                                        );
                                    });
                            })()}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-neutral-600 flex flex-col items-center gap-6">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                <Ruler className="h-10 w-10 text-neutral-700" />
                            </div>
                            <p className="font-black uppercase tracking-widest text-xs italic">Sincronización de medidas pendiente</p>
                        </div>
                    )}
                </div>
            </div>

            {/* récords de Ejercicios */}
            <div id="exercises-weight-section" className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl overflow-hidden shadow-2xl scroll-mt-24 relative">
                <div className="absolute inset-0 bg-linear-to-b from-blue-600/5 to-transparent pointer-events-none" />

                <div className="border-b border-white/5 p-8 flex items-center justify-between bg-black/20 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-xl">
                            <Trophy className="h-7 w-7 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Biblioteca de Récords</h3>
                            <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] italic">Potencia Máxima Registrada</p>
                        </div>
                    </div>
                </div>

                {prs && prs.length > 0 ? (
                    <div className="divide-y divide-white/5 relative z-10">
                        {prs.map((pr: PersonalRecord, i: number) => (
                            <ClientMotionDiv
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 md:p-8 flex items-center justify-between hover:bg-white/5 transition-all group"
                            >
                                <div className="flex items-center gap-6 flex-1 min-w-0">
                                    <div className="h-14 w-14 bg-neutral-950/50 rounded-2xl shrink-0 flex items-center justify-center border border-white/5 group-hover:border-blue-500/30 transition-all shadow-lg">
                                        <Dumbbell className="h-6 w-6 text-neutral-700 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                    <div className="min-w-0 space-y-1">
                                        <h4 className="font-black text-white text-lg uppercase italic tracking-tight truncate group-hover:text-blue-500 transition-colors">{pr.exercise}</h4>
                                        <div className="flex items-center gap-4">
                                            <p className="text-[9px] text-neutral-600 font-black uppercase tracking-[0.2em] italic">{pr.date}</p>
                                            <div className="h-1 w-1 rounded-full bg-neutral-800" />
                                            <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em] italic">
                                                {pr.reps} REPS {pr.rpe ? `• RPE ${pr.rpe}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="font-black text-4xl text-white tracking-tighter italic leading-none">{pr.weight}</span>
                                        <span className="text-[10px] font-black text-neutral-600 uppercase italic">KG</span>
                                    </div>
                                    <p className="text-[8px] uppercase tracking-[0.3em] text-blue-500/50 font-black mt-2 italic">Peak Load</p>
                                </div>
                            </ClientMotionDiv>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-neutral-600 flex flex-col items-center gap-6 relative z-10">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <Trophy className="h-10 w-10 text-neutral-700" />
                        </div>
                        <div className="space-y-2">
                            <p className="font-black uppercase tracking-widest text-xs italic">Sin registros de potencia máxima</p>
                            <p className="text-[10px] font-bold text-neutral-700 italic uppercase tracking-wider">La base de datos técnica está vacía.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
