import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Plus, Search, Dumbbell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createQuickExercise } from "@/actions/exercise-actions";

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

export function ExerciseSelector({ open, onOpenChange, onSelect, availableExercises, title, isVariantSelector = false, canCreateExercises = false }: ExerciseSelectorProps) {
    const [searchValue, setSearchValue] = useState("");
    const [isCreating, setIsCreating] = useState(false);
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

    // Resetear estado al abrir/cerrar
    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setShowCreateForm(false);
            setSelectedGroups([]);
            setIsCreating(false);
        }
        onOpenChange(newOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="p-0 gap-0 bg-neutral-950 border-neutral-800 text-white sm:max-w-[500px] w-full h-dvh sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden rounded-none sm:rounded-2xl border-none sm:border shadow-2xl">
                <DialogHeader className="px-4 py-4 border-b border-neutral-800 bg-neutral-900 shrink-0">
                    <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-neutral-400">
                        <Search className="w-4 h-4" />
                        {title || (isVariantSelector ? "Seleccionar Variantes" : "Seleccionar Ejercicio")}
                    </DialogTitle>
                </DialogHeader>

                {!showCreateForm ? (
                    <Command className="bg-transparent flex-1 overflow-hidden flex flex-col" shouldFilter={true}>
                        <div className="p-3 shrink-0">
                            <CommandInput
                                placeholder="Buscar ejercicios..."
                                className="bg-neutral-900 border-none rounded-xl h-14 text-base focus:ring-1 focus:ring-red-500/20"
                                value={searchValue}
                                onValueChange={setSearchValue}
                            />
                        </div>

                        <CommandList className="flex-1 overflow-y-auto px-2 pb-10 sm:pb-2 scrollbar-hide">
                            <CommandEmpty className="py-20 text-center text-sm text-neutral-500 flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800">
                                    <Dumbbell className="w-8 h-8 opacity-20" />
                                </div>
                                <p className="font-medium text-neutral-400">No encontramos "{searchValue}"</p>
                                {canCreateExercises ? (
                                    <Button
                                        variant="outline"
                                        className="mt-2 border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl h-12 px-6 transition-all font-bold"
                                        onClick={() => setShowCreateForm(true)}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Crear ejercicio en biblioteca
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="mt-2 border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl h-12 px-6 transition-all font-bold"
                                        onClick={() => {
                                            onSelect({ name: searchValue });
                                            onOpenChange(false);
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Usar nombre personalizado
                                    </Button>
                                )}
                            </CommandEmpty>

                            <CommandGroup heading="Biblioteca" className="text-neutral-500">
                                {[...availableExercises].sort((a, b) => a.name.localeCompare(b.name, 'es')).map((ex) => (
                                    <CommandItem
                                        key={ex.id}
                                        value={ex.name}
                                        onSelect={() => {
                                            onSelect(ex);
                                            onOpenChange(false);
                                        }}
                                        className="data-[selected='true']:bg-red-600 data-[selected='true']:text-white text-neutral-300 py-3 px-3 rounded-lg mb-1 cursor-pointer transition-colors"
                                    >
                                        <span className="font-medium text-base uppercase">{ex.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                ) : (
                    <div className="flex-1 overflow-y-auto p-4 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Nombre del Ejercicio</label>
                            <div className="bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white uppercase">
                                {searchValue}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                                Grupos Musculares ({selectedGroups.length} seleccionados)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {GRUPOS_MUSCULARES.map(group => (
                                    <button
                                        key={group}
                                        onClick={() => toggleGroup(group)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                            selectedGroups.includes(group)
                                                ? "bg-red-600 text-white border border-red-600"
                                                : "bg-neutral-900 text-neutral-400 border border-white/10 hover:border-white/30"
                                        }`}
                                    >
                                        {group}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setShowCreateForm(false)}
                                className="flex-1 h-12 rounded-xl border border-white/10 text-neutral-400 hover:text-white"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleCreateExercise}
                                disabled={isPending || selectedGroups.length === 0}
                                className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest"
                            >
                                {isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <Plus className="w-4 h-4 mr-2" />
                                )}
                                Crear Ejercicio
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
