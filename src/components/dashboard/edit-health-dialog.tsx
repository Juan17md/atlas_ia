"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/actions/profile-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Pencil, Activity, HeartPulse, User, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditHealthDialogProps {
    athlete: {
        id: string;
        name: string;
        injuries?: string[];
        medicalConditions?: string[];
    };
    trigger?: React.ReactNode;
}

const COMMON_INJURIES = [
    "Hombros", "Rodillas", "Espalda Baja", "Espalda Alta",
    "Muñecas", "Codos", "Tobillos", "Cadera", "Cuello"
];

export function EditHealthDialog({ athlete, trigger }: EditHealthDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const [injuries, setInjuries] = useState<string[]>(athlete.injuries || []);
    const [medicalConditions, setMedicalConditions] = useState<string[]>(athlete.medicalConditions || []);
    const [newCondition, setNewCondition] = useState("");

    // Sync state with props when parent refreshes
    useEffect(() => {
        setInjuries(athlete.injuries || []);
        setMedicalConditions(athlete.medicalConditions || []);
    }, [athlete]);

    const handleToggleInjury = (injury: string) => {
        setInjuries(prev =>
            prev.includes(injury)
                ? prev.filter(i => i !== injury)
                : [...prev, injury]
        );
    };

    const handleAddCondition = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (newCondition.trim()) {
            if (!medicalConditions.includes(newCondition.trim())) {
                setMedicalConditions(prev => [...prev, newCondition.trim()]);
            }
            setNewCondition("");
        }
    };

    const handleRemoveCondition = (condition: string) => {
        setMedicalConditions(prev => prev.filter(c => c !== condition));
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const result = await updateProfile({
                injuries,
                medicalConditions
            }, athlete.id);

            if (result.success) {
                toast.success("Perfil de salud actualizado");
                setIsOpen(false);
                router.refresh();
            } else {
                toast.error(result.error || "Error al actualizar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500 hover:text-white hover:bg-neutral-800">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-neutral-950 border-neutral-800 text-white sm:max-w-lg p-0 overflow-hidden rounded-3xl">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                        <Activity className="w-6 h-6 text-red-500" />
                        Editar Salud: {athlete.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-8 overflow-y-auto max-h-[70vh]">
                    {/* Lesiones */}
                    <div className="space-y-4">
                        <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> Lesiones / Molestias
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {COMMON_INJURIES.map((injury) => {
                                const isSelected = injuries.includes(injury);
                                return (
                                    <button
                                        key={injury}
                                        onClick={() => handleToggleInjury(injury)}
                                        className={cn(
                                            "py-3.5 px-2 rounded-xl border text-sm font-bold transition-all text-center",
                                            "active:scale-[0.98]",
                                            isSelected
                                                ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/20"
                                                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white"
                                        )}
                                    >
                                        {injury}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Condiciones Médicas */}
                    <div className="space-y-4">
                        <Label className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                            <HeartPulse className="w-3 h-3" /> Condiciones Médicas
                        </Label>

                        <div className="flex gap-2">
                            <Input
                                value={newCondition}
                                onChange={(e) => setNewCondition(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAddCondition()}
                                placeholder="Ej: Asma, Hipertensión..."
                                className="bg-neutral-900 border-white/10 rounded-xl h-14 text-sm px-4"
                            />
                            <Button
                                type="button"
                                onClick={() => handleAddCondition()}
                                className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold w-14 h-14 p-0 rounded-xl"
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {medicalConditions.map((condition) => (
                                <span
                                    key={condition}
                                    className="bg-neutral-800 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-neutral-700 group transition-all hover:border-red-500/50"
                                >
                                    {condition}
                                    <button
                                        onClick={() => handleRemoveCondition(condition)}
                                        className="text-neutral-500 hover:text-red-500 transition-all hover:scale-125"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </span>
                            ))}
                            {medicalConditions.length === 0 && (
                                <p className="text-neutral-500 text-xs italic">No hay condiciones registradas.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-neutral-900 border-t border-neutral-800 flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        className="flex-1 text-neutral-400 font-bold h-14 rounded-2xl uppercase tracking-widest text-[10px]"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-2 bg-red-600 hover:bg-red-700 text-white font-black h-14 rounded-2xl shadow-lg shadow-red-900/20 uppercase tracking-widest text-[10px]"
                    >
                        {isLoading ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
