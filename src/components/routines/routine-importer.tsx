"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import type { RoutineFormData } from "./routine-editor-types";

interface RoutineImporterProps {
    routines: RoutineFormData[];
    onImport: (routine: RoutineFormData) => void;
}

export function RoutineImporter({ routines, onImport }: RoutineImporterProps) {
    const [open, setOpen] = useState(false);

    const uniqueRoutines = Array.from(new Map(routines.map(r => [r.id, r])).values());

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 gap-2 transition-all rounded-full px-4 sm:px-6 h-12 text-xs font-bold tracking-wide">
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">IMPORTAR</span>
                    <span className="sm:hidden">IMPORTAR</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[450px] p-0 overflow-hidden rounded-2xl">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter">Copiar de Existente</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Selecciona una rutina para copiar su estructura y ejercicios.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-4">
                    <Command className="bg-transparent text-white">
                        <CommandInput placeholder="Buscar rutina..." className="border-none focus:ring-0 text-white" />
                        <CommandList className="max-h-[300px] mt-2">
                            <CommandEmpty className="py-4 text-center text-neutral-500">No se encontraron rutinas.</CommandEmpty>
                            <CommandGroup>
                                {uniqueRoutines.map((r) => (
                                    <CommandItem
                                        key={r.id}
                                        onSelect={() => {
                                            onImport(r);
                                            setOpen(false);
                                            toast.success(`Datos importados de: ${r.name}`);
                                        }}
                                        className="hover:bg-white/5 cursor-pointer rounded-lg p-3 aria-selected:bg-white/10"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold text-red-500 text-sm uppercase">{r.name}</span>
                                            <span className="text-xs text-neutral-400 line-clamp-1">{r.description || "Sin descripción"}</span>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
                                                    {r.type === 'daily' ? '1 Día' : `${r.schedule?.length || 0} Días`}
                                                </span>
                                                <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
                                                    {r.schedule?.reduce((acc: number, d: any) => acc + (d.exercises?.length || 0), 0)} Ejercicios
                                                </span>
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
            </DialogContent>
        </Dialog>
    );
}