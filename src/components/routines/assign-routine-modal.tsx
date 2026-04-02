"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, Dumbbell, Loader2, CalendarDays, ArrowLeft, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { assignRoutineToAthlete } from "@/actions/routine-actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

interface RoutineDay {
    id: string;
    name: string;
    exercises?: unknown[];
}

interface Routine {
    id: string;
    name?: string;
    description?: string;
    schedule?: RoutineDay[];
    createdAt?: string;
    updatedAt?: string;
}

interface AssignRoutineModalProps {
    athleteId: string;
    athleteName: string;
    routines: Routine[];
    className?: string;
    trigger?: React.ReactNode;
}

export function AssignRoutineModal({ athleteId, athleteName, routines = [], className, trigger }: AssignRoutineModalProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    // Para rutinas diarias: a qué día de la semana asignar
    const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);

    const router = useRouter();

    const filteredRoutines = routines.filter(routine =>
        routine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        routine.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectRoutine = (routine: Routine) => {
        setSelectedRoutine(routine);
        const isWeekly = (routine.schedule?.length || 0) > 1;

        if (isWeekly) {
            // Rutina semanal: ir a confirmación directa
            setStep(2);
        } else {
            // Rutina diaria: elegir día de la semana
            setSelectedWeekday(null);
            setStep(2);
        }
    };

    const handleBack = () => {
        setStep(1);
        setSelectedRoutine(null);
        setSelectedWeekday(null);
    };

    const handleAssign = async () => {
        if (!selectedRoutine) return;

        const isDaily = (selectedRoutine.schedule?.length || 0) === 1;
        if (isDaily && selectedWeekday === null) {
            toast.error("Selecciona un día de la semana");
            return;
        }

        setLoading(true);
        try {
            // Asignar la rutina al atleta (crea copia activa)
            const result = await assignRoutineToAthlete(athleteId, selectedRoutine.id);

            if (result.success) {
                toast.success(`Rutina asignada a ${athleteName}`);
                setOpen(false);
                resetState();
                router.refresh();
            } else {
                toast.error(result.error || "Error al asignar");
            }
        } catch {
            toast.error("Error al conectar con el servidor");
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        setStep(1);
        setSelectedRoutine(null);
        setSelectedWeekday(null);
        setSearchTerm("");
    };

    const reset = (openState: boolean) => {
        setOpen(openState);
        if (!openState) {
            setTimeout(resetState, 300);
        }
    };

    const isWeekly = selectedRoutine && (selectedRoutine.schedule?.length || 0) > 1;

    return (
        <Dialog open={open} onOpenChange={reset}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className={cn("bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-10 px-6 shadow-lg shadow-red-900/20 transition-all hover:scale-105", className)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Asignar Rutina
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[550px] p-0 overflow-hidden gap-0">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-neutral-800 flex items-center gap-2">
                    {step > 1 && (
                        <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8 -ml-2 mr-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    )}
                    <div>
                        <DialogTitle className="text-xl font-bold">
                            {step === 1 ? `Asignar Rutina a ${athleteName}` : "Confirmar Asignación"}
                        </DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            {step === 1 ? "Selecciona una rutina para asignar." : `Asignando: ${selectedRoutine?.name}`}
                        </DialogDescription>
                    </div>
                </div>

                {/* Step 1: Listado de rutinas */}
                {step === 1 && (
                    <>
                        <div className="px-6 pt-4 pb-2 relative">
                            <Search className="absolute left-9 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                            <Input
                                placeholder="Buscar rutinas..."
                                className="bg-neutral-950/50 border-neutral-800 pl-10 h-10 text-sm focus-visible:ring-red-500 rounded-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[400px]">
                            <div className="p-4 space-y-3">
                                {filteredRoutines.map((routine) => {
                                    const days = routine.schedule?.length || 0;
                                    const isDaily = days === 1;
                                    return (
                                        <div
                                            key={routine.id}
                                            onClick={() => handleSelectRoutine(routine)}
                                            className="group flex items-center justify-between gap-4 p-4 rounded-xl bg-neutral-950/30 border border-neutral-800 hover:border-red-500/30 hover:bg-neutral-800/30 cursor-pointer transition-all"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 text-neutral-400 group-hover:text-red-500 transition-colors">
                                                    <Dumbbell className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white text-sm md:text-base group-hover:text-red-500 transition-colors">
                                                        {routine.name || "Sin nombre"}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-1.5">
                                                        <span className={cn(
                                                            "flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border",
                                                            isDaily
                                                                ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                                                                : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                                        )}>
                                                            {isDaily ? <Clock className="w-3 h-3" /> : <CalendarDays className="w-3 h-3" />}
                                                            {isDaily ? "Diaria" : `Semanal · ${days} días`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredRoutines.length === 0 && (
                                    <div className="text-center py-12 text-neutral-600">
                                        <Dumbbell className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                        <p className="text-sm font-medium">No se encontraron rutinas</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </>
                )}

                {/* Step 2: Configurar y confirmar */}
                {step === 2 && selectedRoutine && (
                    <div className="p-6 space-y-5">
                        {isWeekly ? (
                            /* --- Rutina Semanal: resumen de asignación --- */
                            <>
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm flex items-start gap-3">
                                    <CalendarDays className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold mb-1">Rutina Semanal Completa</p>
                                        <p className="text-emerald-400/80 text-xs">
                                            Se asignarán los {selectedRoutine.schedule?.length} días de la rutina mapeados de Lunes a Viernes.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {selectedRoutine.schedule?.map((day, index) => (
                                        <div key={day.id || index} className="flex items-center gap-3 p-3 bg-neutral-950/50 border border-neutral-800 rounded-xl">
                                            <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0">
                                                <span className="text-[10px] font-black text-neutral-400 uppercase">
                                                    {WEEKDAYS[index]?.slice(0, 3)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{day.name}</p>
                                                <p className="text-xs text-neutral-500">{day.exercises?.length || 0} ejercicios</p>
                                            </div>
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            /* --- Rutina Diaria: elegir día de la semana --- */
                            <>
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm flex items-start gap-3">
                                    <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold mb-1">Rutina Diaria</p>
                                        <p className="text-blue-400/80 text-xs">
                                            Selecciona el día de la semana donde se asignará esta rutina.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 ml-1">
                                        Día de la Semana
                                    </label>
                                    <div className="grid grid-cols-5 gap-2">
                                        {WEEKDAYS.map((day, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() => setSelectedWeekday(index)}
                                                className={cn(
                                                    "flex flex-col items-center justify-center py-3 rounded-xl border-2 transition-all text-center",
                                                    selectedWeekday === index
                                                        ? "bg-red-600/10 border-red-500 text-red-400 shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]"
                                                        : "bg-neutral-950/30 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                                                )}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-wider">
                                                    {day.slice(0, 3)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedWeekday !== null && (
                                    <div className="flex items-center gap-3 p-3 bg-neutral-950/50 border border-neutral-800 rounded-xl animate-in fade-in duration-300">
                                        <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                                            <span className="text-[10px] font-black text-white uppercase">
                                                {WEEKDAYS[selectedWeekday].slice(0, 3)}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">
                                                {selectedRoutine.schedule?.[0]?.name || selectedRoutine.name}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                {selectedRoutine.schedule?.[0]?.exercises?.length || 0} ejercicios
                                            </p>
                                        </div>
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    </div>
                                )}
                            </>
                        )}

                        <Button
                            onClick={handleAssign}
                            disabled={loading || (!isWeekly && selectedWeekday === null)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-xl"
                        >
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Asignar a {athleteName}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
