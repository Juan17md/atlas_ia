"use client";

import { useState } from "react";
import { deleteRoutine, duplicateRoutine } from "@/actions/routine-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trash, Edit, Copy, Layers, Target, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AssignRoutineDialog } from "@/components/routines/assign-routine-dialog";
import { AssignedAthletesDialog } from "@/components/routines/assigned-athletes-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface RoutineScheduleDay {
    name: string;
    exercises?: unknown[];
}

interface Routine {
    id: string;
    name: string;
    description?: string;
    active?: boolean;
    schedule?: RoutineScheduleDay[];
}

interface Athlete {
    id: string;
    name?: string;
    email?: string;
}

interface RoutineCardProps {
    routine: Routine;
    athletes: Athlete[];
}

export function RoutineCard({ routine, athletes }: RoutineCardProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        const res = await deleteRoutine(routine.id);
        if (res.success) {
            toast.success("Rutina eliminada");
            router.refresh();
        } else {
            toast.error(res.error);
        }
        setIsDeleting(false);
        setShowDeleteConfirm(false);
    };

    const handleDuplicate = async () => {
        setIsDuplicating(true);
        const res = await duplicateRoutine(routine.id);
        if (res.success) {
            toast.success("Rutina duplicada con éxito");
            router.refresh();
        } else {
            toast.error(res.error);
        }
        setIsDuplicating(false);
    };

    const totalExercises = routine.schedule?.reduce((acc, day) => acc + (day.exercises?.length || 0), 0) || 0;
    const dayCount = routine.schedule?.length || 0;
    const isDaily = false;

    const hasAssignedText = routine.name.toUpperCase().includes("(ASSIGNED)");
    const cleanName = routine.name.replace(/\(ASSIGNED\)/gi, "").trim();

    return (
        <>
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="group relative h-full"
            >
                <div className="absolute inset-0 bg-red-600/10 rounded-4xl blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none" />

                <Card className="relative h-full bg-neutral-900/20 backdrop-blur-3xl border border-white/5 hover:border-red-600/30 transition-all duration-500 rounded-4xl overflow-hidden shadow-2xl flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    <CardHeader className="p-4 md:p-6 pb-2 md:pb-4 relative z-10">
                        <div className="flex justify-between items-start gap-4 mb-4">
                            <div className="flex flex-wrap gap-2">
                                <span className={cn(
                                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm",
                                    isDaily
                                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                        : "bg-red-600/10 text-red-500 border-red-600/20"
                                )}>
                                    {isDaily ? "Sesión Diaria" : "Plan Semanal"}
                                </span>

                                {routine.active && (
                                    <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]">
                                        Online
                                    </span>
                                )}

                                {hasAssignedText && (
                                    <AssignedAthletesDialog routineId={routine.id} routineName={cleanName} />
                                )}
                            </div>

                            <div className="flex gap-1.5 translate-x-2 -translate-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-neutral-500 hover:text-white hover:bg-white/5 rounded-xl h-9 w-9"
                                    onClick={handleDuplicate}
                                    disabled={isDuplicating}
                                    title="Duplicar Rutina"
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl h-9 w-9"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isDeleting}
                                    title="Eliminar Registro"
                                >
                                    <Trash className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <CardTitle className="text-xl md:text-2xl font-black text-white leading-tight uppercase tracking-tighter italic group-hover:text-red-500 transition-colors duration-500">
                            {cleanName}
                        </CardTitle>
                        <p className="text-xs text-neutral-500 line-clamp-2 mt-3 font-bold uppercase tracking-wider opacity-60">
                            {routine.description || "NÚCLEO SIN DESCRIPCIÓN TÉCNICA."}
                        </p>
                    </CardHeader>

                    <CardContent className="p-4 md:p-6 pt-0 mt-auto relative z-10 flex flex-col gap-4 md:gap-6">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 group-hover:border-red-600/10 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-white leading-none mb-1 tabular-nums">{dayCount}</span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-1.5">
                                        <Calendar className="w-2.5 h-2.5 text-red-600" /> Ciclos
                                    </span>
                                </div>
                            </div>
                            <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/5 group-hover:border-red-600/10 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black text-white leading-none mb-1 tabular-nums">{totalExercises}</span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-1.5">
                                        <Layers className="w-2.5 h-2.5 text-red-600" /> Cargas
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link href={`/routines/${routine.id}`} className="flex-[1.5]">
                                <Button className="w-full bg-white text-black hover:bg-neutral-200 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] h-12 shadow-xl transition-all hover:-translate-y-1 active:scale-95">
                                    <Edit className="w-3.5 h-3.5 mr-2" /> Programar
                                </Button>
                            </Link>
                            <div className="flex-1">
                                <AssignRoutineDialog routineId={routine.id} athletes={athletes} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent className="bg-neutral-900 border-red-600/20 text-white rounded-3xl sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="font-black uppercase italic text-xl">Confirmar Eliminación</DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            ¿Estás seguro de que deseas eliminar la rutina <span className="text-white font-bold">{cleanName}</span>? 
                            Esta acción no se puede deshacer y los atletas asignados perderán su rutina.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={isDeleting}
                            className="rounded-2xl border-white/10 text-neutral-400 hover:bg-white/5 hover:text-white"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-[10px]"
                        >
                            {isDeleting ? (
                                <span className="flex items-center">
                                    Eliminando...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <Trash className="w-4 h-4 mr-2" /> Eliminar
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
