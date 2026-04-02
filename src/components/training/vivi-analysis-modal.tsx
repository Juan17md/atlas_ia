"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote, Zap, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { useWorkoutLogger } from "./workout-logger-context";
import { cn } from "@/lib/utils";

export function ViviAnalysisModal() {
    const router = useRouter();
    const { 
        showAiModal, setShowAiModal, 
        aiFeedback, isAnalyzing, 
        sessionRpe 
    } = useWorkoutLogger();

    const getRpeColor = (value: number) => {
        if (value <= 4) return "text-green-500";
        if (value <= 7) return "text-yellow-500";
        return "text-red-500";
    };

    const getRpeLabel = (value: number) => {
        if (value <= 2) return "Muy Fácil";
        if (value <= 4) return "Suave";
        if (value <= 6) return "Moderado";
        if (value <= 8) return "Duro";
        if (value <= 9) return "Muy Duro";
        return "Máximo Esfuerzo";
    };

    const renderHighlightedFeedback = (text: string) => {
        if (!text) return null;
        const keywords = /(RPE\s\d+|[0-9]+kg|[0-9]+\s?kg|excelente|progreso|mejorar|recomiendo|atenci\u00f3n|lesi\u00f3n|descansar|intensidad|volumen|t\u00e9cnica|consistencia|objetivos|¡Sigue adelante!|buen trabajo)/gi;
        const parts = text.split(keywords);
        
        return parts.map((part, i) => {
            if (part.match(keywords)) {
                return (
                    <span key={i} className="text-red-500 font-black drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <AlertDialog open={showAiModal} onOpenChange={setShowAiModal}>
            <AlertDialogContent className="bg-neutral-950 border-neutral-900 text-white max-w-xl p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
                <AlertDialogHeader className="sr-only">
                    <AlertDialogTitle>Análisis de Vivi AI</AlertDialogTitle>
                    <AlertDialogDescription>Feedback técnico de tu sesión</AlertDialogDescription>
                </AlertDialogHeader>

                {/* Banner Superior Premium */}
                <div className="relative h-32 bg-linear-to-br from-red-600 to-black flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30" />
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-linear-to-t from-neutral-950 to-transparent" />
                    
                    <div className="relative z-10 flex flex-col items-center">
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl"
                        >
                            <Zap className="w-8 h-8 text-white fill-white shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                        </motion.div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mt-3 drop-shadow-md">Coach Intelligence</p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Status Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <motion.div 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl flex flex-col items-center justify-center group hover:bg-red-950/20 transition-colors"
                        >
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Carga Local</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-white">{sessionRpe}</span>
                                <span className="text-xs text-neutral-500">/10</span>
                            </div>
                        </motion.div>
                        <motion.div 
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-2xl flex flex-col items-center justify-center group hover:bg-neutral-900 transition-colors"
                        >
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">Estado</span>
                            <span className={cn("text-xs font-black uppercase tracking-tighter", getRpeColor(sessionRpe))}>
                                {getRpeLabel(sessionRpe)}
                            </span>
                        </motion.div>
                    </div>

                    {/* Analysis Content */}
                    <div className="relative min-h-[180px]">
                        <Quote className="absolute -top-4 -left-4 w-12 h-12 text-white opacity-5 pointer-events-none" />
                        {isAnalyzing ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                                <div className="relative">
                                    <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                                    <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full" />
                                </div>
                                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest animate-pulse">Analizando rendimiento...</p>
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-4"
                            >
                                <div className="text-sm md:text-base text-neutral-300 leading-relaxed font-medium italic relative z-10">
                                    {aiFeedback ? (
                                        <div className="whitespace-pre-line tracking-tight px-2">
                                            {renderHighlightedFeedback(aiFeedback)}
                                        </div>
                                    ) : (
                                        "Estamos preparando tu informe..."
                                    )}
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-neutral-900">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Feedback Final de Vivi</span>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* CTA */}
                    {!isAnalyzing && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="pt-2"
                        >
                            <Button 
                                onClick={() => router.push("/dashboard")}
                                className="w-full bg-white text-black hover:bg-neutral-200 font-black uppercase tracking-widest h-14 rounded-2xl transition-all active:scale-95 shadow-[0_10px_40px_rgba(255,255,255,0.1)] group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                Continuar al Dashboard
                            </Button>
                        </motion.div>
                    )}
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
