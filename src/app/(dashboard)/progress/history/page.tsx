import { auth } from "@/lib/auth";
import { getBodyMeasurementsHistory } from "@/actions/measurement-actions";
import { adminDb } from "@/lib/firebase-admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History, Calendar, Scale, AlignLeft, Info } from "lucide-react";
import { ClientMotionDiv } from "@/components/ui/client-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HistoryPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MeasurementHistoryPage({ searchParams }: HistoryPageProps) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const isCoach = session.user.role === "coach";
    let targetUserId = session.user.id;
    let athleteName = "Mi Historial";

    if (isCoach) {
        const params = await searchParams;
        const requestedId = params?.athleteId as string;
        if (requestedId) {
            targetUserId = requestedId;
            try {
                const userDoc = await adminDb.collection("users").doc(requestedId).get();
                if (userDoc.exists) {
                     athleteName = `Historial de ${userDoc.data()?.name || 'Atleta'}`;
                }
            } catch (e) {
                console.error("Error fetching athlete name", e);
            }
        }
    }

    const historyResult = await getBodyMeasurementsHistory(targetUserId);
    const history = historyResult.success && historyResult.data ? historyResult.data : [];
    
    // Sort descending by date
    const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const measurementKeys = [
        "chest", "waist", "hips", "shoulders", "glutes", "neck",
        "bicepsLeft", "bicepsRight", "forearmsLeft", "forearmsRight",
        "quadsLeft", "quadsRight", "calvesLeft", "calvesRight"
    ];

    const labels: Record<string, string> = {
        chest: "Torso", hips: "Cadera", waist: "Cintura", shoulders: "Hombros", glutes: "Glúteos", neck: "Cuello",
        bicepsLeft: "Bíceps (I)", bicepsRight: "Bíceps (D)", forearmsLeft: "Antebrazo (I)", forearmsRight: "Antebrazo (D)",
        quadsLeft: "Muslo (I)", quadsRight: "Muslo (D)", calvesLeft: "Gemelo (I)", calvesRight: "Gemelo (D)",
    };

    return (
        <div className="flex flex-col gap-12 pb-32 relative min-h-screen">
            {/* Ambient background glows */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[150px] pointer-events-none -z-10" />
            <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            {/* Header */}
            <ClientMotionDiv
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-6 px-2"
            >
                <Link href={`/progress${isCoach && targetUserId !== session.user.id ? `?athleteId=${targetUserId}` : ''}`}>
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl bg-neutral-900/40 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5 transition-all shadow-xl">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                </Link>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="h-px w-8 bg-red-600/30" />
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.4em] italic">Bitácora Métrica</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
                        {athleteName}
                    </h1>
                </div>
            </ClientMotionDiv>

            <div className="max-w-screen-2xl mx-auto w-full px-4 mt-8">
                {sortedHistory.length > 0 ? (
                    <div className="relative border-l-2 border-white/5 ml-4 md:ml-8 space-y-16">
                        {sortedHistory.map((item, index) => {
                            const itemDate = new Date(item.date);
                            const loggedMeasurements = measurementKeys.filter(key => item[key as keyof typeof item] !== undefined && item[key as keyof typeof item] !== null);

                            return (
                                <ClientMotionDiv
                                    key={item.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative pl-8 md:pl-12"
                                >
                                    {/* Timeline Dot */}
                                    <div className="absolute -left-[11px] top-1 w-5 h-5 bg-black border-[3px] border-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                                    
                                    <div className="flex flex-col gap-6">
                                        {/* Date Header */}
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
                                                <Calendar className="w-5 h-5 text-red-500" />
                                            </div>
                                            <span className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter italic">
                                                {format(itemDate, "d 'de' MMMM, yyyy", { locale: es })}
                                            </span>
                                        </div>

                                        <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/10 rounded-4xl overflow-hidden shadow-2xl relative group hover:border-red-500/30 hover:shadow-[0_0_40px_rgba(239,68,68,0.1)] transition-all duration-500">
                                            {/* Glow decorativo interno */}
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[80px] -z-10 group-hover:bg-red-500/20 transition-colors duration-700" />
                                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-600/5 rounded-full blur-[60px] -z-10 group-hover:bg-orange-500/10 transition-colors duration-700" />

                                            {/* Upper row: Weight & Meta */}
                                            {item.weight && (
                                                <div className="p-6 md:p-8 border-b border-white/10 bg-linear-to-r from-red-950/20 to-transparent relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 w-1 h-full bg-linear-to-b from-red-500 to-transparent" />
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 shadow-inner">
                                                                <Scale className="w-7 h-7 text-red-400" />
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] font-black text-red-500/80 uppercase tracking-[0.2em] italic block mb-1">Registro de Masa Corporal</span>
                                                                <span className="text-base font-bold text-white tracking-wide">Peso Total</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="font-black text-transparent bg-clip-text bg-linear-to-br from-white to-neutral-500 text-6xl md:text-7xl italic tracking-tighter leading-none drop-shadow-sm">
                                                                {item.weight}
                                                            </span>
                                                            <span className="text-sm text-red-500 uppercase font-black ml-2 tracking-[0.3em] italic">KG</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Measurements Grid */}
                                            {loggedMeasurements.length > 0 && (
                                                <div className="p-6 md:p-10 bg-black/20">
                                                    <div className="flex items-center gap-3 mb-8">
                                                        <AlignLeft className="w-5 h-5 text-neutral-400" />
                                                        <span className="text-sm font-black text-neutral-300 uppercase tracking-[0.2em] italic">Perímetros Corporales</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-4 md:gap-6">
                                                        {loggedMeasurements.map(key => (
                                                            <div key={key} className="bg-neutral-900/60 border border-white/5 rounded-[1.25rem] p-5 flex flex-col justify-between items-start group/card hover:bg-neutral-800 hover:border-red-500/40 hover:-translate-y-1 transition-all duration-300 shadow-xl relative overflow-hidden">
                                                                <div className="absolute inset-0 bg-linear-to-br from-red-500/0 via-transparent to-red-500/0 group-hover/card:to-red-500/5 pointer-events-none transition-colors duration-500" />
                                                                <span className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.15em] mb-3 italic">{labels[key] || key}</span>
                                                                <div className="flex items-baseline gap-1 mt-auto">
                                                                    <span className="text-3xl font-black text-white italic group-hover/card:text-red-400 transition-colors uppercase tracking-tight">
                                                                        {item[key as keyof typeof item] as React.ReactNode}
                                                                    </span>
                                                                    <span className="text-[11px] font-bold text-neutral-600 tracking-widest">CM</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* prominent Notes Section */}
                                            {item.notes && (
                                                <div className="p-6 md:p-8 bg-red-950/30 border-t border-red-500/20 relative overflow-hidden backdrop-blur-md">
                                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                                                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
                                                    <div className="flex items-start gap-5 relative z-10">
                                                        <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center shrink-0 border border-red-500/40 shadow-lg">
                                                            <Info className="w-6 h-6 text-red-400" />
                                                        </div>
                                                        <div className="flex-1 mt-1">
                                                            <h4 className="text-[11px] font-black text-red-400 uppercase tracking-[0.3em] italic mb-3">Observación del Entrenador</h4>
                                                            <p className="text-base md:text-lg text-white/90 font-medium leading-relaxed italic border-l-2 border-red-500/30 pl-5 py-2 tracking-wide">
                                                                &ldquo;{item.notes}&rdquo;
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </ClientMotionDiv>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
                        <div className="w-24 h-24 bg-neutral-900/50 rounded-full flex items-center justify-center border border-white/5 shadow-2xl relative">
                             <div className="absolute inset-0 bg-red-500/10 rounded-full blur-xl" />
                             <History className="w-10 h-10 text-neutral-600 relative z-10" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Base de Datos Vacía</h2>
                            <p className="text-sm font-bold text-neutral-500 tracking-wide max-w-sm">No existen registros históricos de biometría. Las actualizaciones futuras aparecerán en este timeline.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
