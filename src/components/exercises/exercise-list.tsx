"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Dumbbell, MoreVertical, Edit, Trash, PlayCircle, ExternalLink, X, Activity, Plus } from "lucide-react";
import { ExerciseFormDialog } from "./exercise-form-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteExercise } from "@/actions/exercise-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { ExerciseListItem } from "@/types";

interface ExerciseListProps {
    exercises: ExerciseListItem[];
}

export function ExerciseList({ exercises }: ExerciseListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterGroup, setFilterGroup] = useState<string | null>(null);
    const [editingExercise, setEditingExercise] = useState<ExerciseListItem | null>(null);
    const router = useRouter();

    const filteredExercises = useMemo(() => {
        return exercises
            .filter((ex) => {
                const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                const term = normalize(searchTerm);
                if (!term && !filterGroup) return true;

                const matchesSearch =
                    !term ||
                    normalize(ex.name || "").includes(term) ||
                    ex.specificMuscles?.some((m: string) => normalize(m).includes(term));

                const matchesFilter = filterGroup ? ex.muscleGroups?.includes(filterGroup) : true;

                return matchesSearch && matchesFilter;
            })
            .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [exercises, searchTerm, filterGroup]);

    const handleDelete = async (id: string) => {
        if (confirm("¿Estás seguro de que deseas eliminar este ejercicio?")) {
            const res = await deleteExercise(id);
            if (res.success) {
                toast.success("Ejercicio eliminado");
                router.refresh();
            } else {
                toast.error(res.error || "Error al eliminar");
            }
        }
    };

    const allGroups = useMemo(() => Array.from(new Set(exercises.flatMap(e => e.muscleGroups || []))).sort(), [exercises]);

    const groupColors: Record<string, string> = {
        "pecho": "bg-red-500/10 text-red-500 border-red-500/20",
        "espalda": "bg-blue-500/10 text-blue-500 border-blue-500/20",
        "hombros": "bg-purple-500/10 text-purple-500 border-purple-500/20",
        "bíceps": "bg-orange-500/10 text-orange-500 border-orange-500/20",
        "tríceps": "bg-pink-500/10 text-pink-500 border-pink-500/20",
        "cuádriceps": "bg-green-500/10 text-green-500 border-green-500/20",
        "isquiotibiales": "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        "glúteos": "bg-rose-500/10 text-rose-500 border-rose-500/20",
        "aductores": "bg-lime-500/10 text-lime-500 border-lime-500/20",
        "pantorrillas": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        "abdominales": "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
        "cardio": "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
        "full body": "bg-white/10 text-white border-white/20",
    };

    const getGroupColor = (group: string) => {
        const key = group.toLowerCase();
        return groupColors[key] || "bg-neutral-800 text-neutral-400 border-neutral-700";
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-2 md:top-6 z-20 bg-black/40 backdrop-blur-2xl border border-white/5 rounded-3xl md:rounded-4xl p-1.5 md:p-2 shadow-2xl shadow-black/50 mx-1 md:mx-0"
            >
                <div className="flex flex-col gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 group-focus-within:text-white transition-colors" />
                        <Input
                            placeholder="Buscar por nombre o músculo..."
                            className="pl-12 h-12 md:h-14 bg-transparent border-transparent rounded-full text-white placeholder:text-neutral-500 focus-visible:ring-0 text-base md:text-lg font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 text-neutral-500 hover:text-white rounded-full hover:bg-white/10"
                                onClick={() => setSearchTerm("")}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex gap-2 overflow-x-auto items-center px-2 pb-2 md:pb-0 scrollbar-hide mask-fade-right">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterGroup(null)}
                            className={cn(
                                "rounded-full h-8 md:h-10 px-4 md:px-5 font-bold transition-all border text-[10px] md:text-xs",
                                !filterGroup
                                    ? "bg-white text-black border-white"
                                    : "bg-neutral-800/30 text-neutral-400 border-white/5 hover:bg-neutral-800 hover:text-white"
                            )}
                        >
                            Todos
                        </Button>
                        {allGroups.map(group => (
                            <Button
                                key={group}
                                variant="ghost"
                                size="sm"
                                onClick={() => setFilterGroup(group === filterGroup ? null : group)}
                                className={cn(
                                    "rounded-full h-10 px-5 font-bold whitespace-nowrap transition-all border",
                                    filterGroup === group
                                        ? "bg-white text-black border-white"
                                        : "bg-neutral-800/30 text-neutral-400 border-white/5 hover:bg-neutral-800 hover:text-white"
                                )}
                            >
                                {group}
                            </Button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Floating Action Button for Mobile */}
            <div className="fixed bottom-24 right-6 z-50 md:hidden">
                <ExerciseFormDialog
                    trigger={
                        <Button className="h-14 w-14 rounded-2xl bg-red-600 text-white shadow-2xl shadow-red-900/40 active:scale-90 transition-transform flex items-center justify-center p-0">
                            <Plus className="w-8 h-8 font-black" />
                        </Button>
                    }
                />
            </div>

            {/* Grid Grouped by Muscle */}
            <div className="space-y-12 pb-10">
                <AnimatePresence mode="popLayout">
                    {(() => {
                        const groupsToDisplay = filterGroup
                            ? [filterGroup]
                            : Array.from(new Set(filteredExercises.flatMap(e => e.muscleGroups || []))).sort();

                        if (groupsToDisplay.length === 0 && filteredExercises.length === 0) {
                            return (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex flex-col items-center justify-center py-20 text-center bg-neutral-900/20 backdrop-blur-xl rounded-[3rem] border border-dashed border-white/5 shadow-2xl"
                                >
                                    <div className="w-20 h-20 bg-neutral-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
                                        <Dumbbell className="h-10 w-10 text-neutral-600" />
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Sin Resultados</h3>
                                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px] mb-6">No se encontraron ejercicios con esos filtros.</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => { setSearchTerm(""); setFilterGroup(null); }}
                                        className="rounded-full border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 font-black uppercase tracking-widest text-[10px] h-12 px-8"
                                    >
                                        Limpiar filtros
                                    </Button>
                                </motion.div>
                            );
                        }

                        return groupsToDisplay.map((group: string, gIdx: number) => {
                            const groupExercises = filteredExercises.filter(ex => ex.muscleGroups?.includes(group));

                            if (groupExercises.length === 0) return null;

                            return (
                                <motion.div
                                    key={group}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: gIdx * 0.1 }}
                                    className="space-y-6"
                                >
                                    {/* Section Header */}
                                    <div className="flex items-center gap-4 ml-2">
                                        <div className={cn("h-4 w-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)]", getGroupColor(group).split(" ")[0].replace("/10", ""))}></div>
                                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">{group}</h2>
                                        <div className="h-px flex-1 bg-linear-to-r from-white/10 to-transparent"></div>
                                        <span className="text-[10px] font-black text-neutral-500 bg-neutral-900/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 uppercase tracking-[0.2em]">
                                            {groupExercises.length} items
                                        </span>
                                    </div>

                                    {/* Exercises Grid for this Group */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {groupExercises.map((exercise, eIdx) => (
                                            <motion.div
                                                key={`${group}-${exercise.id}`}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: (gIdx * 0.1) + (eIdx * 0.05) }}
                                                whileHover={{ y: -5 }}
                                                className="group flex flex-col bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl md:rounded-[2.5rem] p-4 md:p-6 hover:border-red-500/30 transition-all duration-500 relative overflow-hidden h-full shadow-2xl"
                                            >
                                                {/* Gradient Blob Overlay */}
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none group-hover:bg-red-600/15 transition-all duration-700"></div>

                                                {/* Header Actions */}
                                                <div className="flex justify-between items-start mb-4 md:mb-6 relative z-10 transition-transform duration-500 group-hover:-translate-y-1">
                                                    <div className="h-12 w-12 md:h-14 md:w-14 bg-neutral-950 rounded-xl md:rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform duration-500 shadow-2xl border border-white/5 relative overflow-hidden">
                                                        <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                        <Dumbbell className="h-6 w-6 md:h-7 md:w-7 relative z-10" />
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-neutral-500 hover:text-white hover:bg-white/5 transition-colors">
                                                                <MoreVertical className="h-5 w-5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-neutral-900/90 backdrop-blur-xl border-white/5 text-white rounded-2xl shadow-2xl p-1.5 min-w-[160px]">
                                                            <DropdownMenuItem
                                                                onClick={() => setEditingExercise(exercise)}
                                                                className="focus:bg-white/10 focus:text-white cursor-pointer px-4 py-3 rounded-xl transition-colors font-bold uppercase tracking-widest text-[10px]"
                                                            >
                                                                <Edit className="h-4 w-4 mr-3 text-neutral-400" /> Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleDelete(exercise.id)}
                                                                className="text-red-500 hover:text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer px-4 py-3 rounded-xl transition-colors mt-0.5 font-bold uppercase tracking-widest text-[10px]"
                                                            >
                                                                <Trash className="h-4 w-4 mr-3" /> Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* Info Section */}
                                                <div className="flex-1 space-y-4 relative z-10">
                                                    <div>
                                                        <h3 className="font-black text-white text-lg md:text-xl leading-tight group-hover:text-red-500 transition-colors tracking-tighter uppercase italic line-clamp-2">
                                                            {exercise.name}
                                                        </h3>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        {exercise.muscleGroups?.slice(0, 2).map((g: string) => (
                                                            <span
                                                                key={g}
                                                                className={cn(
                                                                    "text-[8px] md:text-[9px] uppercase font-black tracking-[0.2em] px-2.5 md:px-3 py-1 md:py-1.5 rounded-full border shadow-sm backdrop-blur-md transition-colors",
                                                                    getGroupColor(g)
                                                                )}
                                                            >
                                                                {g}
                                                            </span>
                                                        ))}
                                                        {(exercise.muscleGroups?.length || 0) > 2 && (
                                                            <span className="text-[8px] md:text-[9px] text-neutral-500 py-1 md:py-1.5 px-2.5 md:px-3 font-black bg-neutral-950/50 rounded-full border border-white/5 uppercase tracking-widest">
                                                                +{exercise.muscleGroups.length - 2}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600">Enfoque específico</p>
                                                        <p className="text-[11px] text-neutral-400 line-clamp-2 font-medium leading-relaxed italic opacity-80 group-hover:opacity-100 transition-opacity">
                                                            {exercise.specificMuscles && exercise.specificMuscles.length > 0
                                                                ? exercise.specificMuscles.join(" • ")
                                                                : "Base técnica general"}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Footer Action */}
                                                <div className="relative z-10 w-full mt-6 md:mt-8">
                                                    {exercise.videoUrl ? (
                                                        <a
                                                            href={exercise.videoUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-between text-[9px] md:text-[10px] text-white font-black bg-neutral-950 hover:bg-red-600 px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl transition-all duration-300 w-full group/btn border border-white/5 hover:border-transparent uppercase tracking-[0.2em] shadow-xl"
                                                        >
                                                            <div className="flex items-center gap-2 md:gap-3">
                                                                <PlayCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500 group-hover/btn:text-white transition-colors" />
                                                                <span>Ver Ejecución</span>
                                                            </div>
                                                            <ExternalLink className="h-3 w-3 md:h-4 md:w-4 opacity-30 group-hover/btn:opacity-100 transition-all duration-300 group-hover/btn:translate-x-1" />
                                                        </a>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-2 md:gap-3 text-[9px] md:text-[10px] text-neutral-600 font-black bg-neutral-950/30 px-4 md:px-5 py-3 md:py-4 rounded-xl md:rounded-2xl w-full border border-white/5 border-dashed cursor-not-allowed uppercase tracking-[0.2em]">
                                                            <Activity className="h-4 w-4 md:h-5 md:w-5 opacity-20" />
                                                            <span>Sin Media</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        });
                    })()}
                </AnimatePresence>
            </div>

            {/* Diálogo de Edición Controlado */}
            <ExerciseFormDialog
                key={editingExercise?.id || 'new'}
                open={!!editingExercise}
                onOpenChange={(open) => !open && setEditingExercise(null)}
                exercise={editingExercise}
            />
        </div>
    );
}
