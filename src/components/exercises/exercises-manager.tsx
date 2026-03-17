"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, Dumbbell, Trash2, Tag } from "lucide-react";
import { createExercise, deleteExercise } from "@/actions/exercise-actions";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";

interface Exercise {
    id: string;
    name: string;
    muscleGroup: string;
    equipment?: string;
}

interface ExercisesManagerProps {
    initialExercises: Exercise[];
}

const MUSCLE_GROUPS = ["Pecho", "Espalda", "Piernas", "Hombros", "Bíceps", "Tríceps", "Core", "Cardio", "Full Body"];

export function ExercisesManager({ initialExercises }: ExercisesManagerProps) {
    const [exercises, setExercises] = useState(initialExercises);
    const [search, setSearch] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estado del formulario
    const [newName, setNewName] = useState("");
    const [newMuscle, setNewMuscle] = useState("");

    const filteredExercises = exercises.filter(ex =>
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.muscleGroup.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreate = async () => {
        if (!newName || !newMuscle) {
            toast.error("Nombre y grupo muscular requeridos");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = {
                name: newName,
                muscleGroups: [newMuscle], // Array de grupos musculares
            };

            const result = await createExercise(formData);

            if (result.success) {
                toast.success("Ejercicio creado");
                setIsDialogOpen(false);
                setNewName("");
                setNewMuscle("");
                revalidatePath("/exercises");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al crear");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar ${name}?`)) return;

        try {
            const result = await deleteExercise(id);
            if (result.success) {
                toast.success("Eliminado");
                setExercises(prev => prev.filter(e => e.id !== id));
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al eliminar");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                    <Input
                        placeholder="Buscar ejercicio..."
                        className="pl-11 h-12 rounded-full bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-neutral-700 focus-visible:border-neutral-700 transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-full bg-red-600 hover:bg-red-700 text-white font-bold h-12 px-6 shadow-lg shadow-red-900/20">
                            <Plus className="mr-2 h-5 w-5" /> Nuevo Ejercicio
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-neutral-950 border-neutral-800 text-white sm:rounded-4xl">
                        <DialogHeader>
                            <DialogTitle>Añadir Ejercicio</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label className="text-neutral-400">Nombre del Ejercicio</Label>
                                <Input
                                    placeholder="Ej: Press Banca Plano"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="bg-neutral-900 border-neutral-800 h-11 rounded-xl focus-visible:ring-red-600/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-neutral-400">Grupo Muscular</Label>
                                <Select onValueChange={setNewMuscle} value={newMuscle}>
                                    <SelectTrigger className="bg-neutral-900 border-neutral-800 h-11 rounded-xl">
                                        <SelectValue placeholder="Seleccionar grupo" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                        {MUSCLE_GROUPS.map(group => (
                                            <SelectItem key={group} value={group} className="focus:bg-neutral-800 focus:text-white">{group}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={handleCreate}
                                disabled={isSubmitting}
                                className="w-full rounded-full bg-white text-black font-bold h-12 hover:bg-neutral-200"
                            >
                                {isSubmitting ? "Guardando..." : "Guardar Ejercicio"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExercises.map((exercise) => (
                    <div key={exercise.id} className="bg-neutral-900 border border-neutral-800 rounded-4xl p-6 hover:border-neutral-600 transition-all group flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-black border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-500 group-hover:text-red-500 group-hover:border-red-500/30 transition-all">
                                <Dumbbell className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-base mb-1">{exercise.name}</h4>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 bg-black border border-neutral-800 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    {exercise.muscleGroup}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-neutral-600 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={() => handleDelete(exercise.id, exercise.name)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}

                {filteredExercises.length === 0 && (
                    <div className="col-span-full py-20 text-center text-neutral-500 border border-dashed border-neutral-800 rounded-4xl bg-neutral-900/30">
                        <div className="w-16 h-16 bg-neutral-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Dumbbell className="h-6 w-6 text-neutral-600" />
                        </div>
                        <p>
                            {exercises.length === 0
                                ? "La biblioteca está vacía. Añade tus primeros ejercicios."
                                : "No se encontraron ejercicios con ese filtro."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
