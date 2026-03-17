import { auth } from "@/lib/auth";
import { adminDb } from "@/lib/firebase-admin";
import { ProfileForm } from "@/components/profile/profile-form";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ruler, User, Activity, Pencil, Flame, HeartPulse, Sparkles } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogMeasurementDialog } from "@/components/profile/log-measurement-dialog";
import { getBodyMeasurementsHistory } from "@/actions/measurement-actions";
import { EditHealthDialog } from "@/components/dashboard/edit-health-dialog";
import dynamic from "next/dynamic";
import { ClientMotionDiv } from "@/components/ui/client-motion";
import { cn } from "@/lib/utils";

const MeasurementChart = dynamic(
    () => import("@/components/profile/measurement-chart").then((mod) => mod.MeasurementChart),
    {
        loading: () => (
            <div className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl h-[380px] w-full animate-pulse shadow-2xl" />
        )
    }
);

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    // Fetch fresh user data
    const userDoc = await adminDb.collection("users").doc(session.user.id).get();
    const rawData = userDoc.data() || {};

    const userData = {
        id: userDoc.id,
        name: rawData.name,
        email: rawData.email,
        image: rawData.image,
        phone: rawData.phone,
        height: rawData.height,
        weight: rawData.weight,
        role: rawData.role,
        onboardingCompleted: rawData.onboardingCompleted,
        injuries: rawData.injuries,
        medicalConditions: rawData.medicalConditions,
        // Explicitly converting dates if needed, though ProfileForm currently doesn't use them directly
        emailVerified: rawData.emailVerified?.toDate?.()?.toISOString() || null,
    };

    // Fetch measurement history if athlete
    let historyData: Array<{
        id: string;
        date: Date;
        weight?: number;
        chest?: number;
        waist?: number;
        hips?: number;
        shoulders?: number;
        neck?: number;
        glutes?: number;
        bicepsLeft?: number;
        bicepsRight?: number;
        forearmsLeft?: number;
        forearmsRight?: number;
        quadsLeft?: number;
        quadsRight?: number;
        calvesLeft?: number;
        calvesRight?: number;
    }> = [];
    const isCoach = session.user.role === "coach";

    if (!isCoach) {
        const historyResult = await getBodyMeasurementsHistory(session.user.id);
        const rawData = historyResult.success && historyResult.data ? historyResult.data : [];
        // Convertir strings a Dates para el componente MeasurementChart
        historyData = rawData.map(item => ({
            ...item,
            date: new Date(item.date)
        }));
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-32 relative">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[150px] pointer-events-none -z-10" />
            <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            {/* Header */}
            <ClientMotionDiv
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2"
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
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] italic">Configuración de Usuario</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                            Mi <span className="text-red-600">Perfil</span>
                        </h1>
                    </div>
                </div>
            </ClientMotionDiv>

            <Tabs defaultValue="details" className="w-full">
                <TabsList className={cn(
                    "grid w-full bg-neutral-900/20 backdrop-blur-3xl border border-white/5 mb-12 rounded-3xl p-1.5 h-14 shadow-2xl",
                    isCoach ? "grid-cols-1" : "grid-cols-3"
                )}>
                    <TabsTrigger value="details" className="rounded-2xl data-[state=active]:bg-white data-[state=active]:text-black transition-all text-neutral-500 font-black uppercase italic tracking-widest h-full text-[10px] px-1">
                        <div className="flex items-center justify-center gap-3">
                            <User className="w-4 h-4 hidden sm:inline" />
                            <span>Datos</span>
                        </div>
                    </TabsTrigger>
                    {!isCoach && (
                        <>
                            <TabsTrigger value="measurements" className="rounded-2xl data-[state=active]:bg-white data-[state=active]:text-black transition-all text-neutral-500 font-black uppercase italic tracking-widest h-full text-[10px] px-1">
                                <div className="flex items-center justify-center gap-3">
                                    <Ruler className="w-4 h-4 hidden sm:inline" />
                                    <span>Progreso</span>
                                </div>
                            </TabsTrigger>
                            <TabsTrigger value="health" className="rounded-2xl data-[state=active]:bg-white data-[state=active]:text-black transition-all text-neutral-500 font-black uppercase italic tracking-widest h-full text-[10px] px-1">
                                <div className="flex items-center justify-center gap-3">
                                    <HeartPulse className="w-4 h-4 hidden sm:inline" />
                                    <span>Salud</span>
                                </div>
                            </TabsTrigger>
                        </>
                    )}
                </TabsList>

                <TabsContent value="details">
                    <ClientMotionDiv
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl p-10 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-linear-to-b from-white/5 to-transparent pointer-events-none" />
                        <div className="relative z-10">
                            <ProfileForm user={userData} />
                        </div>
                    </ClientMotionDiv>
                </TabsContent>

                {!isCoach && (
                    <TabsContent value="measurements" className="space-y-10">
                        <ClientMotionDiv
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col md:flex-row md:justify-between md:items-center bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl p-10 shadow-2xl relative overflow-hidden gap-6"
                        >
                            <div className="absolute inset-0 bg-linear-to-r from-red-600/5 to-transparent pointer-events-none" />
                            <div className="relative z-10 space-y-2">
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Historial Biométrico</h2>
                                <p className="text-neutral-500 font-bold italic text-sm">Registro técnico de evolución cronológica.</p>
                            </div>
                            <div className="w-full md:w-auto relative z-10">
                                <LogMeasurementDialog />
                            </div>
                        </ClientMotionDiv>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <MeasurementChart
                                title="Masa Crítica (KG)"
                                data={historyData}
                                metrics={[{ key: "weight", label: "Peso", color: "#ef4444" }]}
                            />
                            <MeasurementChart
                                title="Perímetros Tronco (CM)"
                                data={historyData}
                                metrics={[
                                    { key: "chest", label: "Pecho", color: "#3b82f6" },
                                    { key: "shoulders", label: "Hombros", color: "#8b5cf6" },
                                    { key: "waist", label: "Cintura", color: "#10b981" },
                                    { key: "hips", label: "Cadera", color: "#f59e0b" },
                                    { key: "glutes", label: "Glúteos", color: "#ec4899" }
                                ]}
                            />
                            <MeasurementChart
                                title="Extremidades Superiores (CM)"
                                data={historyData}
                                metrics={[
                                    { key: "bicepsLeft", label: "Bíceps (I)", color: "#06b6d4" },
                                    { key: "bicepsRight", label: "Bíceps (D)", color: "#0ea5e9" },
                                    { key: "forearmsLeft", label: "Antebrazo (I)", color: "#6366f1" },
                                    { key: "forearmsRight", label: "Antebrazo (D)", color: "#8b5cf6" }
                                ]}
                            />
                            <MeasurementChart
                                title="Extremidades Inferiores (CM)"
                                data={historyData}
                                metrics={[
                                    { key: "quadsLeft", label: "Cuádriceps (I)", color: "#14b8a6" },
                                    { key: "quadsRight", label: "Cuádriceps (D)", color: "#059669" },
                                    { key: "calvesLeft", label: "Pantorilla (I)", color: "#f97316" },
                                    { key: "calvesRight", label: "Pantorilla (D)", color: "#ea580c" }
                                ]}
                            />
                        </div>
                    </TabsContent>
                )}

                {!isCoach && (
                    <TabsContent value="health" className="space-y-10">
                        <ClientMotionDiv
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl p-10 md:p-12 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-linear-to-b from-blue-600/5 to-transparent pointer-events-none" />

                            <div className="flex items-center justify-between mb-12 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center shadow-xl">
                                        <HeartPulse className="w-8 h-8 text-red-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Informe de Salud</h2>
                                        <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] italic">Estado Clínico y Limitaciones Técnicas</p>
                                    </div>
                                </div>
                                <EditHealthDialog
                                    athlete={{
                                        id: userData.id,
                                        name: userData.name || "Mi Perfil",
                                        injuries: userData.injuries,
                                        medicalConditions: userData.medicalConditions
                                    }}
                                    trigger={
                                        <Button className="h-12 px-6 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-black uppercase italic text-[10px] tracking-widest transition-all">
                                            <Pencil className="w-4 h-4 mr-3" /> Editar Reporte
                                        </Button>
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <Flame className="w-4 h-4 text-red-500" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">Historial de Lesiones</h4>
                                    </div>
                                    {userData.injuries && userData.injuries.length > 0 ? (
                                        <div className="flex flex-wrap gap-3">
                                            {userData.injuries.map((injury: string, i: number) => (
                                                <div key={i} className="bg-red-500/10 text-red-500 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase italic border border-red-500/20 shadow-lg">
                                                    {injury}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 border border-dashed border-white/5 rounded-3xl flex items-center justify-center">
                                            <p className="text-neutral-600 text-[10px] font-black uppercase italic tracking-widest">Sin Anomalías Detectadas</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <HeartPulse className="w-4 h-4 text-blue-500" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">Historial Clínico</h4>
                                    </div>
                                    {userData.medicalConditions && userData.medicalConditions.length > 0 ? (
                                        <div className="flex flex-wrap gap-3">
                                            {userData.medicalConditions.map((condition: string, i: number) => (
                                                <div key={i} className="bg-blue-500/10 text-blue-400 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase italic border border-blue-500/20 shadow-lg">
                                                    {condition}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 border border-dashed border-white/5 rounded-3xl flex items-center justify-center">
                                            <p className="text-neutral-600 text-[10px] font-black uppercase italic tracking-widest">Estado Óptimo Permanentemente</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ClientMotionDiv>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
