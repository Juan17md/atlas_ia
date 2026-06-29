"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Plus, Search, Dumbbell, Loader2, ChevronLeft, X, Check } from "lucide-react";
import { toast } from "sonner";
import { createQuickExercise } from "@/actions/exercise-actions";
import { cn } from "@/lib/utils";

const GRUPOS_MUSCULARES = [
    "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps",
    "Cuádriceps", "Isquiotibiales", "Glúteos", "Pantorrillas",
    "Abdominales", "Cardio", "Full Body"
];

interface ExerciseSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (exercise: { id?: string; name: string; muscleGroups?: string[] }) => void;
    availableExercises: { id: string; name: string; muscleGroups?: string[] }[];
    title?: string;
    isVariantSelector?: boolean;
    canCreateExercises?: boolean;
}

const MUSCLE_COLORS: Record<string, string> = {
    Pecho: "from-rose-600/20 to-rose-600/5 border-rose-600/20 text-rose-400",
    Espalda: "from-blue-600/20 to-blue-600/5 border-blue-600/20 text-blue-400",
    Hombros: "from-amber-600/20 to-amber-600/5 border-amber-600/20 text-amber-400",
    Bíceps: "from-purple-600/20 to-purple-600/5 border-purple-600/20 text-purple-400",
    Tríceps: "from-indigo-600/20 to-indigo-600/5 border-indigo-600/20 text-indigo-400",
    Cuádriceps: "from-emerald-600/20 to-emerald-600/5 border-emerald-600/20 text-emerald-400",
    Isquiotibiales: "from-teal-600/20 to-teal-600/5 border-teal-600/20 text-teal-400",
    Glúteos: "from-pink-600/20 to-pink-600/5 border-pink-600/20 text-pink-400",
    Pantorrillas: "from-cyan-600/20 to-cyan-600/5 border-cyan-600/20 text-cyan-400",
    Abdominales: "from-orange-600/20 to-orange-600/5 border-orange-600/20 text-orange-400",
    Cardio: "from-red-600/20 to-red-600/5 border-red-600/20 text-red-400",
    "Full Body": "from-lime-600/20 to-lime-600/5 border-lime-600/20 text-lime-400",
};

export function ExerciseSelector({ open, onOpenChange, onSelect, availableExercises, title, isVariantSelector = false, canCreateExercises = false }: ExerciseSelectorProps) {
    const [searchValue, setSearchValue] = useState("");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();

    const handleCreateExercise = () => {
        if (!searchValue || searchValue.trim().length < 2) {
            toast.error("El nombre debe tener al menos 2 caracteres");
            return;
        }
        if (selectedGroups.length === 0) {
            toast.error("Selecciona al menos un grupo muscular");
            return;
        }

        startTransition(async () => {
            const result = await createQuickExercise({
                name: searchValue.trim(),
                muscleGroups: selectedGroups,
            });

            if (result.success && result.id) {
                toast.success(`Ejercicio "${result.name}" creado`);
                onSelect({ id: result.id, name: result.name!, muscleGroups: selectedGroups });
                onOpenChange(false);
                setShowCreateForm(false);
                setSelectedGroups([]);
                setSearchValue("");
            } else {
                toast.error(result.error || "Error al crear ejercicio");
            }
        });
    };

    const toggleGroup = (group: string) => {
        setSelectedGroups(prev =>
            prev.includes(group)
                ? prev.filter(g => g !== group)
                : [...prev, group]
        );
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setShowCreateForm(false);
            setSelectedGroups([]);
        }
        onOpenChange(newOpen);
    };

    const sortedExercises = [...availableExercises].sort((a, b) => a.name.localeCompare(b.name, 'es'));

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="p-0 gap-0 bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-white sm:max-w-[520px] w-full sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden rounded-none sm:rounded-3xl border border-white/[0.06] shadow-2xl shadow-black/80">
                {!showCreateForm ? (
                    <>
                        <DialogHeader className="relative px-5 py-5 border-b border-white/[0.06] shrink-0">
                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
                            <DialogTitle className="text-sm font-black uppercase tracking-[0.15em] flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
                                    <Search className="w-4 h-4 text-red-400" />
                                </div>
                                <span className="text-neutral-200">{title || (isVariantSelector ? "Seleccionar Variantes" : "Seleccionar Ejercicio")}</span>
                            </DialogTitle>
                        </DialogHeader>

                        <Command className="bg-transparent flex-1 overflow-hidden flex flex-col" shouldFilter={true}>
                            <div className="p-4 pb-2 shrink-0">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                    <CommandInput
                                        placeholder="Buscar ejercicios..."
                                        className="h-12 w-full bg-neutral-900/80 border border-white/[0.06] rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500/30 focus:border-red-500/30 transition-all"
                                        value={searchValue}
                                        onValueChange={setSearchValue}
                                    />
                                </div>
                            </div>

                            <CommandList className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-hide">
                                <CommandEmpty className="py-16 text-center flex flex-col items-center gap-5">
                                    <div className="w-20 h-20 rounded-2xl bg-neutral-900 border border-white/[0.06] flex items-center justify-center">
                                        <Dumbbell className="w-9 h-9 text-neutral-700" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-neutral-400">No encontramos <span className="text-neutral-300">"{searchValue}"</span></p>
                                        <p className="text-xs text-neutral-600 mt-1">Prueba con otro término o crea uno nuevo</p>
                                    </div>
                                    {canCreateExercises ? (
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowCreateForm(true)}
                                            className="mt-2 border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl h-11 px-6 transition-all font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Crear ejercicio
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                onSelect({ name: searchValue });
                                                onOpenChange(false);
                                            }}
                                            className="mt-2 border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white rounded-2xl h-11 px-6 transition-all font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Usar nombre personalizado
                                        </Button>
                                    )}
                                </CommandEmpty>

                                {sortedExercises.length > 0 && (
                                    <CommandGroup heading="Biblioteca" className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 pb-1">
                                        <div className="space-y-1 mt-2">
                                            {sortedExercises.map((ex) => (
                                                <CommandItem
                                                    key={ex.id}
                                                    value={ex.name}
                                                    onSelect={() => {
                                                        onSelect(ex);
                                                        onOpenChange(false);
                                                    }}
                                                    className="group flex items-center gap-3 px-4 py-3.5 rounded-2xl cursor-pointer transition-all duration-200 data-[selected=true]:bg-red-600/10 data-[selected=true]:border-red-500/20 border border-transparent hover:border-white/[0.06] hover:bg-white/[0.02] text-neutral-400 data-[selected=true]:text-red-300"
                                                >
                                                    <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:bg-neutral-800 group-data-[selected=true]:bg-red-600/10 group-data-[selected=true]:border-red-500/20 transition-all">
                                                        <Dumbbell className="w-4 h-4 text-neutral-600 group-hover:text-neutral-400 group-data-[selected=true]:text-red-400 transition-colors" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-bold text-white group-data-[selected=true]:text-red-200 transition-colors uppercase block truncate">
                                                            {ex.name}
                                                        </span>
                                                        {ex.muscleGroups && ex.muscleGroups.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                                {ex.muscleGroups.slice(0, 3).map(mg => (
                                                                    <span key={mg} className={cn(
                                                                        "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border bg-gradient-to-b",
                                                                        MUSCLE_COLORS[mg] || "from-neutral-600/20 to-neutral-600/5 border-neutral-600/20 text-neutral-500"
                                                                    )}>
                                                                        {mg}
                                                                    </span>
                                                                ))}
                                                                {ex.muscleGroups.length > 3 && (
                                                                    <span className="text-[8px] font-bold text-neutral-600 px-1.5">+{ex.muscleGroups.length - 3}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="w-6 h-6 rounded-lg border border-white/5 bg-white/[0.02] flex items-center justify-center opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 group-data-[selected=true]:border-red-500/30 group-data-[selected=true]:bg-red-500/10 transition-all shrink-0">
                                                        <Plus className="w-3 h-3 text-neutral-600 group-data-[selected=true]:text-red-400" />
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </div>
                                    </CommandGroup>
                                )}
                            </CommandList>

                            {canCreateExercises && (
                                <div className="shrink-0 p-3 border-t border-white/[0.06]">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setShowCreateForm(true)}
                                        className="w-full h-11 rounded-2xl border border-dashed border-white/10 text-neutral-500 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-all text-[11px] font-bold uppercase tracking-widest"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Crear nuevo ejercicio
                                    </Button>
                                </div>
                            )}
                        </Command>
                    </>
                ) : (
                    <>
                        <DialogHeader className="relative px-5 py-5 border-b border-white/[0.06] shrink-0">
                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowCreateForm(false)}
                                    className="w-8 h-8 rounded-xl bg-neutral-800/80 border border-white/[0.06] flex items-center justify-center hover:bg-neutral-700 transition-colors cursor-pointer shrink-0"
                                >
                                    <ChevronLeft className="w-4 h-4 text-neutral-400" />
                                </button>
                                <DialogTitle className="text-sm font-black uppercase tracking-[0.15em] flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-red-600/10 border border-red-600/20 flex items-center justify-center shrink-0">
                                        <Plus className="w-4 h-4 text-red-400" />
                                    </div>
                                    <span className="text-neutral-200">Crear Ejercicio</span>
                                </DialogTitle>
                            </div>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-neutral-800 border border-white/[0.06] flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-neutral-500">1</span>
                                    </span>
                                    Nombre del Ejercicio
                                </label>
                                <div className="bg-neutral-900/80 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm font-bold text-white uppercase tracking-wide">
                                    {searchValue || "Escribe en el buscador..."}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-md bg-neutral-800 border border-white/[0.06] flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-neutral-500">2</span>
                                    </span>
                                    Grupos Musculares
                                    {selectedGroups.length > 0 && (
                                        <span className="text-red-400 text-[10px] ml-1">({selectedGroups.length})</span>
                                    )}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {GRUPOS_MUSCULARES.map(group => {
                                        const isSelected = selectedGroups.includes(group);
                                        const colorClass = MUSCLE_COLORS[group] || "from-neutral-600/20 to-neutral-600/5 border-neutral-600/20 text-neutral-400";
                                        return (
                                            <button
                                                key={group}
                                                onClick={() => toggleGroup(group)}
                                                className={cn(
                                                    "group relative px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 border",
                                                    isSelected
                                                        ? "bg-gradient-to-b border text-white shadow-lg shadow-red-600/10 " + colorClass.split(" ")[0] + " " + colorClass.split(" ")[1] + " " + colorClass.split(" ")[2]
                                                        : "bg-neutral-900/60 border-white/[0.06] text-neutral-500 hover:border-white/20 hover:text-neutral-300"
                                                )}
                                            >
                                                {isSelected && (
                                                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-neutral-950 flex items-center justify-center">
                                                        <Check className="w-2 h-2 text-white" />
                                                    </span>
                                                )}
                                                {group}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 p-4 border-t border-white/[0.06] flex gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setShowCreateForm(false)}
                                className="flex-1 h-12 rounded-2xl border border-white/[0.06] text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all text-[11px] font-bold uppercase tracking-widest"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleCreateExercise}
                                disabled={isPending || selectedGroups.length === 0}
                                className="flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[11px] transition-all disabled:opacity-40 shadow-lg shadow-red-600/20"
                            >
                                {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                )}
                                Crear Ejercicio
                            </Button>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
