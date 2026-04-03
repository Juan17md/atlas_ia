"use client";

import { Trophy, CheckCircle2, ArrowLeft, Calendar, LayoutDashboard, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClientMotionDiv } from "@/components/ui/client-motion";
import { cn } from "@/lib/utils";

export function WorkoutCompletedView() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            <ClientMotionDiv
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "circOut" }}
                className="relative space-y-12 max-w-2xl w-full"
            >
                {/* Victory Visual */}
                <div className="relative mx-auto w-36 h-36 md:w-44 md:h-44 flex items-center justify-center group">
                    <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-3xl border border-white/5 rounded-full shadow-2xl group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-3 border border-emerald-500/20 rounded-full border-dashed animate-[spin_20s_linear_infinite]" />
                    <div className="absolute inset-10 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors duration-500" />
                    <Trophy className="w-16 h-16 md:w-20 md:h-20 text-amber-500 relative z-10 drop-shadow-[0_0_25px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform duration-500" />

                    {/* Floating Particles Shorthand */}
                    <div className="absolute -top-4 -right-2 animate-bounce transition-transform duration-1000">
                        <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    </div>
                </div>

                <div className="space-y-6">
                    <ClientMotionDiv
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="inline-flex items-center gap-3 px-6 py-2 rounded-2xl bg-emerald-600/10 border border-emerald-600/20 text-emerald-400"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Misión Finalizada</span>
                    </ClientMotionDiv>

                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
                            OBJETIVO <span className="text-emerald-500">CONSEGUIDO</span>
                        </h1>
                        <p className="text-neutral-500 font-bold uppercase tracking-[0.4em] text-xs">
                            Sincronización: <span className="text-white italic">100% Optimizado</span>
                        </p>
                    </div>

                    <p className="text-neutral-400 text-lg font-medium leading-relaxed max-w-md mx-auto">
                        Has completado la sesión programada. ¡Buen trabajo registrando tu entrenamiento!
                    </p>
                </div>

                <div className="pt-8 flex flex-col gap-6 max-w-md mx-auto">
                    <Link href="/dashboard" className="w-full">
                        <Button className="w-full h-13 md:h-16 rounded-2xl bg-white text-black hover:bg-neutral-200 font-black text-sm uppercase tracking-[0.15em] md:tracking-[0.2em] shadow-2xl shadow-white/10 transition-all active:scale-95 group">
                            <LayoutDashboard className="w-4 h-4 mr-3" />
                            Regresar a la Central
                        </Button>
                    </Link>

                    <button
                        onClick={() => router.push('/history')}
                        className="text-neutral-600 hover:text-white font-black text-[10px] uppercase tracking-[0.3em] transition-colors focus:outline-none"
                    >
                        Analizar Telemetría de Hoy (Historial)
                    </button>
                </div>
            </ClientMotionDiv>
        </div>
    );
}
