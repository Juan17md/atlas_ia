"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { generateRoutineWithAI } from "@/actions/routine-actions";
import { toast } from "sonner";
import type { AIRoutine } from "./routine-editor-types";

interface AIGeneratorProps {
    onGenerate: (routine: AIRoutine) => void;
    currentType: "weekly" | "daily";
}

export function AIGenerator({ onGenerate, currentType }: AIGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [criteria, setCriteria] = useState({
        goal: "hypertrophy",
        daysPerWeek: 3,
        experienceLevel: "intermediate",
        injuries: "",
        focus: "",
        userPrompt: ""
    });

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await generateRoutineWithAI({
                athleteId: "", // Empty for now, backend handles it
                goal: criteria.goal,
                daysPerWeek: criteria.daysPerWeek,
                experienceLevel: criteria.experienceLevel,
                injuries: criteria.injuries ? [criteria.injuries] : [],
                focus: criteria.focus,
                routineType: currentType,
                userPrompt: criteria.userPrompt
            });

            if (res.success && res.routine) {
                onGenerate(res.routine as AIRoutine);
                setOpen(false);
                toast.success("Rutina generada con IA");
            } else {
                toast.error(res.error || "Error al generar rutina");
            }
        } catch (error) {
            toast.error("Error de conexión con IA");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 gap-2 transition-all rounded-full px-4 sm:px-6 h-12 text-xs font-bold tracking-wide">
                    <Wand2 className="w-4 h-4" />
                    <span className="hidden sm:inline">GENERAR</span>
                    <span className="sm:hidden">IA</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[600px] p-0 overflow-hidden rounded-3xl max-h-[90vh] overflow-y-auto">
                <div className="relative">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-red-600/20 to-transparent pointer-events-none" />
                    <DialogHeader className="p-6 pb-2 relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <Sparkles className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black uppercase tracking-tighter">Generador IA</DialogTitle>
                                <DialogDescription className="text-neutral-400 text-xs">Crea tu rutina automáticamente</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6 pt-2 space-y-6 relative z-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-neutral-500">Objetivo</Label>
                                <select
                                    value={criteria.goal}
                                    onChange={(e) => setCriteria({ ...criteria, goal: e.target.value })}
                                    className="w-full h-12 bg-neutral-950 border border-white/10 rounded-xl px-4 text-sm font-bold text-white focus:ring-2 focus:ring-red-500/50"
                                >
                                    <option value="hypertrophy">Hipertrofia</option>
                                    <option value="strength">Fuerza</option>
                                    <option value="endurance">Resistencia</option>
                                    <option value="general">General</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-neutral-500">Días/Semana</Label>
                                <select
                                    value={criteria.daysPerWeek}
                                    onChange={(e) => setCriteria({ ...criteria, daysPerWeek: Number(e.target.value) })}
                                    className="w-full h-12 bg-neutral-950 border border-white/10 rounded-xl px-4 text-sm font-bold text-white focus:ring-2 focus:ring-red-500/50"
                                >
                                    {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                        <option key={d} value={d}>{d} días</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-neutral-500">Nivel</Label>
                            <select
                                value={criteria.experienceLevel}
                                onChange={(e) => setCriteria({ ...criteria, experienceLevel: e.target.value })}
                                className="w-full h-12 bg-neutral-950 border border-white/10 rounded-xl px-4 text-sm font-bold text-white focus:ring-2 focus:ring-red-500/50"
                            >
                                <option value="beginner">Principiante</option>
                                <option value="intermediate">Intermedio</option>
                                <option value="advanced">Avanzado</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-neutral-500">Lesiones (opcional)</Label>
                            <Input
                                placeholder="Ej: hombro, rodilla..."
                                value={criteria.injuries}
                                onChange={(e) => setCriteria({ ...criteria, injuries: e.target.value })}
                                className="h-12 bg-neutral-950 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-neutral-700"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-neutral-500">Enfoque (opcional)</Label>
                            <Input
                                placeholder="Ej: tren superior, push, pull..."
                                value={criteria.focus}
                                onChange={(e) => setCriteria({ ...criteria, focus: e.target.value })}
                                className="h-12 bg-neutral-950 border border-white/10 rounded-xl px-4 text-sm text-white placeholder:text-neutral-700"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-neutral-500">Instrucciones adicionales</Label>
                            <Textarea
                                placeholder="Describe aspectos específicos queQuieres incluir..."
                                value={criteria.userPrompt}
                                onChange={(e) => setCriteria({ ...criteria, userPrompt: e.target.value })}
                                className="h-24 bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-700 resize-none"
                            />
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full h-16 bg-white text-black hover:bg-neutral-200 font-black uppercase italic tracking-widest text-[10px] rounded-2xl shadow-2xl transition-all shadow-white/5 hover:-translate-y-1"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Sparkles className="w-5 h-5 mr-3" />}
                            Iniciar Generación de Datos
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}