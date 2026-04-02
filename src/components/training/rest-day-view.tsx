"use client";

import { Moon, Coffee, Heart, ArrowLeft, Calendar, Sparkles, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ClientMotionDiv } from "@/components/ui/client-motion";
import { toast } from "sonner";
import { markAsRestDay } from "@/actions/training-logs";
import { useState } from "react";
import { Loader2 } from "lucide-react";


interface RestDayViewProps {
    dayName: string;
}

export function RestDayView({ dayName }: RestDayViewProps) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);


    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] py-4 md:py-10 px-6 text-center relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            <ClientMotionDiv
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className="relative space-y-4 md:space-y-12 max-w-2xl w-full"
            >
                {/* Visual Anchor */}
                <div className="relative mx-auto w-24 h-24 md:w-32 md:h-32 flex items-center justify-center group">
                    <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-3xl border border-white/5 rounded-full shadow-2xl group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-2 md:inset-3 border border-blue-500/20 rounded-full border-dashed animate-[spin_15s_linear_infinite]" />
                    <div className="absolute inset-5 md:inset-6 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors duration-500" />
                    <Moon className="w-10 h-10 md:w-14 md:h-14 text-blue-400 relative z-10 drop-shadow-[0_0_20px_rgba(96,165,250,0.4)] group-hover:rotate-12 transition-transform duration-500" />
                </div>

                <div className="space-y-3 md:space-y-6">
                    <ClientMotionDiv
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-3 px-6 py-2 rounded-2xl bg-blue-600/10 border border-blue-600/20 text-blue-400"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Día de Descanso</span>
                    </ClientMotionDiv>

                    <div className="space-y-2">
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none">
                            MODO <span className="text-blue-500">{dayName}</span>
                        </h1>
                        <p className="text-neutral-500 font-bold uppercase tracking-[0.4em] text-xs">
                            Estado Actual: <span className="text-white italic">Standby Técnico</span>
                        </p>
                    </div>

                    <p className="text-neutral-400 text-sm md:text-lg font-medium leading-relaxed max-w-md mx-auto">
                        La recuperación es clave para mejorar tu rendimiento. Tómate el día para descansar o realiza una actividad ligera.
                    </p>
                </div>

                <Button
                    disabled={isPending}
                    onClick={async () => {
                        setIsPending(true);
                        try {
                            const res = await markAsRestDay();
                            if (res.success) {
                                toast.success("Día de descanso registrado formalmente");
                                router.push("/dashboard");
                            } else {
                                toast.error(res.error || "Error al registrar descanso");
                            }
                        } catch (error) {
                            toast.error("Error de conexión");
                        } finally {
                            setIsPending(false);
                        }
                    }}
                    className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs md:text-sm uppercase tracking-[0.2em] shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 mb-6"
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Moon className="w-4 h-4" />
                    )}
                    Completar Descanso
                </Button>


                {/* Technical Info Matrix */}
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-6 max-w-md mx-auto">
                    {[
                        { label: "RECARGA", desc: "Nutrición Óptima", icon: Coffee, color: "text-amber-500", glow: "bg-amber-500/5" },
                        { label: "DESCANSO", desc: "Dormir +8h", icon: Heart, color: "text-red-500", glow: "bg-red-500/5" }
                    ].map((stat, i) => (
                        <div key={i} className="p-3 md:p-8 bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-2xl md:rounded-4xl group hover:border-blue-500/30 transition-all duration-500 relative overflow-hidden flex flex-col items-center justify-center">
                            <div className={cn("absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24 rounded-full blur-3xl -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-500", stat.glow)} />
                            <stat.icon className={cn("w-5 h-5 md:w-8 md:h-8 mb-2 md:mb-6 mx-auto group-hover:scale-110 transition-transform duration-500", stat.color)} />
                            <h3 className="text-white font-black text-[9px] md:text-xs uppercase tracking-[0.2em] italic mb-1 text-center">{stat.label}</h3>
                            <p className="text-neutral-600 text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-center">{stat.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="pt-4 md:pt-8 flex flex-col gap-4 max-w-md mx-auto">
                    <Link href="/dashboard" className="w-full">
                        <Button variant="outline" className="w-full h-14 rounded-2xl bg-neutral-900 lg:bg-transparent border-white/10 text-white hover:bg-neutral-800 font-bold text-xs uppercase tracking-[0.2em] transition-all active:scale-95 group">
                            Regresar a la Base
                            <ArrowLeft className="w-4 h-4 ml-3 group-hover:-translate-x-1 transition-transform" />
                        </Button>
                    </Link>

                    <button
                        onClick={() => router.push('/train/log')}
                        className="text-neutral-600 hover:text-white font-black text-[10px] uppercase tracking-[0.3em] transition-colors focus:outline-none"
                    >
                        Registro Manual de Operaciones
                    </button>
                </div>
            </ClientMotionDiv>
        </div>
    );
}
