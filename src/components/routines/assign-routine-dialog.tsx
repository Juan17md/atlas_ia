"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { assignRoutineToAthlete } from "@/actions/routine-actions";
import { Users, Search, Loader2, ArrowLeft, Info, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface Athlete {
    id: string;
    name?: string;
    email?: string;
    image?: string;
}

export function AssignRoutineDialog({ routineId, athletes }: { routineId: string, athletes: Athlete[] }) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<'athlete' | 'date'>('athlete');
    const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const filteredAthletes = athletes.filter(athlete =>
        athlete.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        athlete.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectAthlete = (athlete: Athlete) => {
        setSelectedAthlete(athlete);
        setStep('date');
    };

    const handleBack = () => {
        setStep('athlete');
        setSelectedAthlete(null);
    };

    const handleConfirmAssign = async () => {
        if (!selectedAthlete) return;

        setIsSubmitting(true);
        try {
            const res = await assignRoutineToAthlete(selectedAthlete.id, routineId);
            if (res.success) {
                toast.success(`Rutina asignada a ${selectedAthlete.name || "Atleta"}`, {
                    description: `Días identificados automáticamente. Inicio: Próximo Lunes.`
                });
                setOpen(false);
                // Reset states
                setStep('athlete');
                setSelectedAthlete(null);
                setSearchTerm("");
            } else {
                toast.error(res.error || "Error al asignar");
            }
        } catch (_error) {
            toast.error("Error al conectar con el servidor");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) {
                setTimeout(() => {
                    setStep('athlete');
                    setSelectedAthlete(null);
                    setSearchTerm("");
                }, 300);
            }
        }}>
            <DialogTrigger asChild>
                <Button className="w-full bg-neutral-800 text-white hover:bg-neutral-700/80 rounded-xl font-bold h-11 sm:h-10 shadow-sm transition-all ">
                    <Users className="w-4 h-4 mr-2" /> ASIGNAR
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-950 border-white/5 text-white sm:max-w-[450px] p-0 overflow-hidden gap-0 rounded-4xl shadow-2xl shadow-black/80">
                {/* Header Estilizado */}
                <div className="p-8 border-b border-white/5 bg-linear-to-br from-neutral-900 via-neutral-950 to-black relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <DialogHeader className="relative z-10">
                        <div className="flex items-center gap-3">
                            {step === 'date' && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 -ml-2 rounded-xl text-neutral-500 hover:text-white hover:bg-white/5 transition-all"
                                    onClick={handleBack}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            )}
                            <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
                                <Users className="w-6 h-6 text-red-600" />
                                {step === 'athlete' ? 'Arquitecto' : 'Despliegue'}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">
                            {step === 'athlete'
                                ? 'Selección de Atleta para Sincronización'
                                : `Confirmación de Programa: ${selectedAthlete?.name?.split(" ")[0]}`}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {step === 'athlete' ? (
                        <div>
                            <div className="px-8 py-6 bg-black/40 backdrop-blur-md border-b border-white/5">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 group-focus-within:text-red-500 transition-colors" />
                                    <Input
                                        placeholder="Filtrar por nombre o núcleo..."
                                        className="bg-neutral-950 border border-white/5 pl-12 h-14 text-sm focus-visible:ring-red-600/30 focus-visible:border-red-600/50 rounded-2xl transition-all placeholder:text-neutral-800"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <ScrollArea className="h-[400px]">
                                <div className="p-4 space-y-2">
                                    {filteredAthletes.length === 0 ? (
                                        <div className="text-center py-20 px-8 flex flex-col items-center gap-4 opacity-30 grayscale">
                                            <Users className="w-12 h-12" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500">
                                                {searchTerm ? "Sin resultados en la base" : "Lista de atletas no inicializada"}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredAthletes.map((athlete) => (
                                            <button
                                                key={athlete.id}
                                                onClick={() => handleSelectAthlete(athlete)}
                                                className="w-full group flex items-center justify-between gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/5 text-left active:scale-[0.98]"
                                            >
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <Avatar className="h-12 w-12 border-2 border-white/5 group-hover:border-red-600/20 transition-colors">
                                                        <AvatarImage src={athlete.image} />
                                                        <AvatarFallback className="bg-neutral-900 text-[10px] font-black uppercase text-red-500">
                                                            {athlete.name?.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="truncate">
                                                        <h4 className="font-black text-white text-sm uppercase tracking-tight italic group-hover:text-red-500 transition-colors">
                                                            {athlete.name || "UNNAMED ATLETA"}
                                                        </h4>
                                                        <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-0.5">
                                                            {athlete.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="h-8 w-8 rounded-full border border-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-red-600 transition-all text-white">
                                                    <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <div className="flex-1 p-8 space-y-8">
                                <div className="bg-red-600/5 border border-red-600/10 p-6 rounded-3xl flex items-start gap-4 text-red-500 shadow-inner">
                                    <div className="h-10 w-10 rounded-2xl bg-red-600/10 flex items-center justify-center shrink-0 border border-red-600/20">
                                        <Info className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Despliegue Programado</p>
                                        <p className="text-xs leading-relaxed text-neutral-400 font-medium">
                                            La rutina se activará el día seleccionado. El entrenamiento comenzará el
                                            <span className="text-white font-black"> próximo lunes</span> habilitando los días configurados.
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-black/40 backdrop-blur-md p-8 rounded-4xl border border-white/5 space-y-6 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-2xl -mr-12 -mt-12 opacity-50"></div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-neutral-600 italic">Objetivo de Sinc.</span>
                                            <span className="text-white bg-red-600/10 px-3 py-1 rounded-lg border border-red-600/20">{selectedAthlete?.name}</span>
                                        </div>
                                        <div className="h-px bg-white/5 w-full" />
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-neutral-600 italic">Días Operativos</span>
                                            <span className="text-neutral-400">Lun - Vie</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                            <span className="text-neutral-600 italic">Reset Semanal</span>
                                            <span className="text-neutral-400">Domingo / 23:59</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="p-8 border-t border-white/5 bg-black/60 backdrop-blur-2xl">
                                <Button
                                    className="w-full h-16 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-red-900/40 transition-all active:scale-95 duration-500"
                                    onClick={handleConfirmAssign}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <span className="flex items-center gap-3">
                                            Ejecutar Despliegue
                                            <ChevronRight className="w-5 h-5" />
                                        </span>
                                    )}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
            </DialogContent>
        </Dialog>
    );
}
