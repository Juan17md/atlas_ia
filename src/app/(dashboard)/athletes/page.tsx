import { getAllAthletes } from "@/actions/coach-actions";
import { Button } from "@/components/ui/button";
import { Search, Users, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ClientMotionDiv } from "@/components/ui/client-motion";
import { AthleteCard } from "@/components/athletes/athlete-card";
import type { Athlete } from "@/types";

export default async function AthletesPage() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        redirect("/dashboard");
    }

    const { athletes } = await getAllAthletes();

    return (
        <div className="space-y-12 pb-24 md:pb-10 relative">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-red-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

            <ClientMotionDiv
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-8 md:flex-row md:justify-between md:items-end mb-4 md:mb-6"
            >
                <div className="space-y-1">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Escuadrón</h2>
                    <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-[10px] ml-1">
                        Gestión Técnica: <span className="text-red-500">Supervisión de Atletas y Rendimiento</span>
                    </p>
                </div>

                {/* Modern Search Engine Bar */}
                <div className="w-full md:w-80 group relative">
                    <div className="absolute inset-0 bg-red-600/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 group-focus-within:text-red-500 transition-colors duration-300 z-10" />
                    <Input
                        placeholder="Buscar por nombre o núcleo..."
                        className="relative z-10 pl-12 h-14 bg-neutral-900/40 backdrop-blur-3xl border-white/5 text-white rounded-2xl focus-visible:ring-red-600/30 transition-all placeholder:text-neutral-700 font-medium"
                    />
                </div>
            </ClientMotionDiv>

            {/* Athletes Grid Section */}
            {!athletes || athletes.length === 0 ? (
                <ClientMotionDiv
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative p-12 md:p-24 bg-neutral-900/20 backdrop-blur-3xl rounded-4xl border border-white/5 overflow-hidden group shadow-2xl"
                >
                    <div className="absolute inset-0 bg-linear-to-br from-red-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
                        <div className="w-24 h-24 rounded-3xl bg-neutral-900/50 border border-white/10 flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6">
                            <Users className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Núcleo Sin Atletas</h3>
                        <p className="text-neutral-500 font-medium text-sm leading-relaxed mb-10">
                            No se detectan atletas vinculados a tu código de supervisión. Envía tu enlace único para comenzar la sincronización de rendimiento.
                        </p>
                        <Button className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-neutral-200 font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl hover:shadow-white/10 flex items-center gap-3">
                            <Zap className="w-4 h-4" />
                            Compartir Código Coach
                        </Button>
                    </div>
                </ClientMotionDiv>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {athletes.map((athlete: Athlete) => (
                        <AthleteCard key={athlete.id} athlete={athlete} />
                    ))}
                </div>
            )}
        </div>
    );
}
