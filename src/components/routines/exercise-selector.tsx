import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Plus, Search, Dumbbell } from "lucide-react";

interface ExerciseSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (exercise: { id?: string; name: string; muscleGroups?: string[] }) => void;
    availableExercises: { id: string; name: string; muscleGroups?: string[] }[];
    title?: string;
    isVariantSelector?: boolean;
}

export function ExerciseSelector({ open, onOpenChange, onSelect, availableExercises, title, isVariantSelector = false }: ExerciseSelectorProps) {
    // We rely on Command's internal filtering for simplicity with small lists
    // If list is huge, we'd manage filtered state manually
    const [searchValue, setSearchValue] = useState("");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 gap-0 bg-neutral-950 border-neutral-800 text-white sm:max-w-[500px] w-full h-dvh sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden rounded-none sm:rounded-2xl border-none sm:border shadow-2xl">
                <DialogHeader className="px-4 py-4 border-b border-neutral-800 bg-neutral-900 shrink-0">
                    <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-neutral-400">
                        <Search className="w-4 h-4" />
                        {title || (isVariantSelector ? "Seleccionar Variantes" : "Seleccionar Ejercicio")}
                    </DialogTitle>
                </DialogHeader>

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
                            <Button
                                variant="outline"
                                className="mt-2 border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl h-12 px-6 transition-all font-bold"
                                onClick={() => {
                                    onSelect({ name: searchValue });
                                    onOpenChange(false);
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Crear personalizado
                            </Button>
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
            </DialogContent>
        </Dialog>
    );
}
