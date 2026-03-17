"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronRight, Target, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Athlete {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    goal?: string;
    createdAt?: string;
}

interface AthleteCardProps {
    athlete: Athlete;
}

export function AthleteCard({ athlete }: AthleteCardProps) {
    const goalMap: Record<string, string> = {
        hypertrophy: "Hipertrofia",
        strength: "Fuerza",
        weight_loss: "Pérdida de Peso",
        endurance: "Resistencia",
        maintenance: "Mantenimiento"
    };

    const formattedGoal = goalMap[athlete.goal || ""] || athlete.goal || "N/A";
    const memberSince = athlete.createdAt
        ? new Date(athlete.createdAt).toLocaleDateString('es', { month: 'short', year: '2-digit' })
        : "—";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="group relative h-full"
        >
            <div className="absolute inset-0 bg-red-600/5 rounded-4xl blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />

            <Link href={`/athletes/${athlete.id}`} className="block h-full">
                <div className="relative h-full bg-neutral-900/20 backdrop-blur-3xl border border-white/5 hover:border-red-600/30 transition-all duration-500 rounded-4xl overflow-hidden shadow-2xl flex flex-col p-6">
                    {/* Visual Accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    {/* Header with Avatar */}
                    <div className="flex items-start justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <Avatar className="h-16 w-16 border-2 border-white/5 group-hover:border-red-600/50 transition-all duration-500 rounded-2xl relative z-10">
                                    <AvatarImage src={athlete.image || undefined} className="object-cover" />
                                    <AvatarFallback className="bg-neutral-950 text-white font-black text-xl italic">
                                        {athlete.name?.substring(0, 2).toUpperCase() || "UN"}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="overflow-hidden">
                                <h3 className="font-black text-white text-lg uppercase tracking-tighter italic group-hover:text-red-500 transition-colors duration-500 truncate">
                                    {athlete.name}
                                </h3>
                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-[0.2em] truncate">
                                    {athlete.email}
                                </p>
                            </div>
                        </div>
                        <div className="h-10 w-10 rounded-2xl border border-white/5 flex items-center justify-center group-hover:bg-red-600 group-hover:border-red-600 transition-all duration-500 text-neutral-600 group-hover:text-white">
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-500" />
                        </div>
                    </div>

                    {/* Stats Matrix */}
                    <div className="grid grid-cols-3 gap-3 mb-8 relative z-10">
                        <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/5 group-hover:border-red-600/10 transition-colors text-center">
                            <Target className="w-4 h-4 text-red-600 mx-auto mb-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">Objetivo</p>
                            <p className="text-[10px] text-white font-black uppercase italic truncate">{formattedGoal}</p>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/5 group-hover:border-red-600/10 transition-colors text-center">
                            <Calendar className="w-4 h-4 text-red-600 mx-auto mb-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">Registro</p>
                            <p className="text-[10px] text-white font-black uppercase italic">{memberSince}</p>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/5 group-hover:border-red-600/10 transition-colors text-center">
                            <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[8px] font-black text-neutral-600 uppercase tracking-widest mb-1">Estado</p>
                            <p className="text-[10px] text-emerald-500 font-black uppercase italic">Activo</p>
                        </div>
                    </div>

                    {/* Footer / Action */}
                    <div className="mt-auto pt-6 border-t border-white/5 relative z-10">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.3em]">Perfil de Atleta</span>
                            <span className="text-[10px] font-black text-white uppercase italic flex items-center gap-1 group-hover:text-red-500 transition-colors">
                                Analizar <ChevronRight className="w-3 h-3" />
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
