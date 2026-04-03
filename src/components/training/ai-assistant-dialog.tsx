"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Brain, Loader2, Dumbbell, AlertTriangle, ArrowRight, HeartPulse } from "lucide-react";
import { generateWarmup, suggestSubstitute } from "@/actions/ai-actions";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AIAssistantDialog({
    muscleGroups = ["General"],
    availableExercises = [],
    open: externalOpen,
    onOpenChange: setExternalOpen
}: {
    muscleGroups?: string[],
    availableExercises?: string[],
    open?: boolean,
    onOpenChange?: (open: boolean) => void
}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = externalOpen !== undefined ? externalOpen : internalOpen;
    const setOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;

    const [loading, setLoading] = useState(false);
    const [warmupRoutine, setWarmupRoutine] = useState<{ name: string, duration: string, notes: string }[] | null>(null);
    const [substituteResult, setSubstituteResult] = useState<{ name: string, why: string }[] | null>(null);

    // Substitution Form
    const [subExercise, setSubExercise] = useState<string>("");
    const [subReason, setSubReason] = useState<string>("busy");

    const handleGenerateWarmup = async () => {
        setLoading(true);
        try {
            const res = await generateWarmup(muscleGroups);
            if (res.success) {
                setWarmupRoutine(res.data);
            } else {
                toast.error(res.error);
            }
        } catch (_error) {
            toast.error("Error generating warmup");
        } finally {
            setLoading(false);
        }
    };

    const handleSubstitute = async () => {
        if (!subExercise) return toast.error("Selecciona un ejercicio");
        setLoading(true);
        try {
            const res = await suggestSubstitute(subExercise, subReason as "busy" | "pain" | "equipment");
            if (res.success) {
                setSubstituteResult(res.data);
            } else {
                toast.error(res.error);
            }
        } catch (_error) {
            toast.error("Error finding substitutes");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!externalOpen && (
                <DialogTrigger asChild>
                    <Button variant="outline" className="border-red-600/30 text-red-500 hover:bg-red-950/30 hover:text-red-400 gap-2 px-3 sm:px-4">
                        <Sparkles className="w-4 h-4" />
                        <span className="hidden sm:inline">Asistente IA</span>
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="bg-neutral-950 border-neutral-800 text-white sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
                        <Brain className="w-5 h-5 text-red-500" />
                        Asistente de Entrenamiento
                    </DialogTitle>
                    <DialogDescription className="text-[10px] md:text-sm text-neutral-400">
                        Pide ayuda a la IA para optimizar tu sesión en tiempo real.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="warmup" className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-2 bg-neutral-900 h-auto p-1">
                        <TabsTrigger value="warmup" className="text-[10px] md:text-sm py-2 uppercase tracking-widest font-black italic">Calentamiento</TabsTrigger>
                        <TabsTrigger value="substitute" className="text-[10px] md:text-sm py-2 uppercase tracking-widest font-black italic">Sustituir</TabsTrigger>
                    </TabsList>

                    {/* WARMUP TAB */}
                    <TabsContent value="warmup" className="space-y-4 pt-4">
                        <div className="bg-neutral-900/50 p-3 md:p-4 rounded-xl border border-neutral-800">
                            <p className="text-xs md:text-sm text-neutral-300 mb-4">
                                Genera una rutina de activación específica para los músculos de hoy: <span className="text-white font-bold">{muscleGroups.join(", ")}</span>.
                            </p>
                            {!warmupRoutine ? (
                                <Button
                                    onClick={handleGenerateWarmup}
                                    disabled={loading}
                                    className="w-full h-9 md:h-10 bg-white text-black hover:bg-neutral-200 text-[10px] md:text-sm font-black uppercase tracking-[0.15em] md:tracking-[0.2em]"
                                >
                                    {loading ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin mr-2" /> : <Dumbbell className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />}
                                    Generar Calentamiento
                                </Button>
                            ) : (
                                <ScrollArea className="h-[250px] pr-4">
                                    <div className="space-y-3">
                                        {warmupRoutine.map((item, i) => (
                                            <div key={i} className="flex gap-3 items-start bg-black/40 p-3 rounded-lg border border-neutral-800">
                                                <div className="bg-red-900/20 text-red-500 font-bold w-6 h-6 rounded flex items-center justify-center text-xs shrink-0 mt-0.5">
                                                    {i + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-white">{item.name}</h4>
                                                    <div className="flex gap-2 text-xs text-neutral-400 mt-1">
                                                        <span className="bg-neutral-800 px-1.5 rounded">{item.duration}</span>
                                                        <span>{item.notes}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Button onClick={() => setWarmupRoutine(null)} variant="ghost" size="sm" className="w-full mt-4 text-neutral-500">
                                        Resetear
                                    </Button>
                                </ScrollArea>
                            )}
                        </div>
                    </TabsContent>

                    {/* SUBSTITUTE TAB */}
                    <TabsContent value="substitute" className="space-y-4 pt-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] md:text-sm font-black uppercase tracking-widest text-neutral-500">Ejercicio a reemplazar</Label>
                                <Select onValueChange={setSubExercise} value={subExercise}>
                                    <SelectTrigger className="h-9 md:h-10 bg-neutral-900 border-neutral-800 text-white text-xs md:text-sm">
                                        <SelectValue placeholder="Selecciona..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                        {availableExercises.map(ex => (
                                            <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] md:text-sm font-black uppercase tracking-widest text-neutral-500">Motivo</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'busy', label: "Ocupado", icon: AlertTriangle },
                                        { id: 'pain', label: "Dolor", icon: HeartPulse }, // Activity doesn't exist? Use dumbell
                                        { id: 'equipment', label: "Falta Equipo", icon: Dumbbell }
                                    ].map(reason => (
                                        <div
                                            key={reason.id}
                                            onClick={() => setSubReason(reason.id)}
                                            className={`
                                                cursor-pointer rounded-lg border p-1.5 md:p-2 flex flex-col items-center gap-1 text-center transition-all
                                                ${subReason === reason.id ? 'bg-red-900/30 border-red-500 text-white' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:bg-neutral-800'}
                                            `}
                                        >
                                            <reason.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                            <span className="text-[9px] md:text-[10px] font-bold">{reason.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {!substituteResult ? (
                                <Button
                                    onClick={handleSubstitute}
                                    disabled={loading || !subExercise}
                                    className="w-full h-9 md:h-10 bg-white text-black hover:bg-neutral-200 text-[10px] md:text-sm font-black uppercase tracking-[0.15em] md:tracking-[0.2em]"
                                >
                                    {loading ? <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin mr-2" /> : <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />}
                                    Buscar Alternativas
                                </Button>
                            ) : (
                                <div className="space-y-3 mt-4">
                                    <h4 className="text-sm font-bold text-neutral-300">Sugerencias:</h4>
                                    {substituteResult.map((alt, i) => (
                                        <div key={i} className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-white text-sm">{alt.name}</span>
                                                <ArrowRight className="w-4 h-4 text-neutral-600" />
                                            </div>
                                            <p className="text-xs text-neutral-500">{alt.why}</p>
                                        </div>
                                    ))}
                                    <Button onClick={() => setSubstituteResult(null)} variant="ghost" size="sm" className="w-full text-neutral-500">
                                        Nueva búsqueda
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
