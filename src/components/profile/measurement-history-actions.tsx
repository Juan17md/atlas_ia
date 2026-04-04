"use client";

import { useState } from "react";
import { LogMeasurementDialog } from "./log-measurement-dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, AlertTriangle } from "lucide-react";
import { deleteBodyMeasurement } from "@/actions/measurement-actions";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface MeasurementHistoryActionsProps {
    measurement: any;
    targetUserId: string;
    canEdit: boolean;
}

export function MeasurementHistoryActions({ measurement, targetUserId, canEdit }: MeasurementHistoryActionsProps) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!canEdit) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteBodyMeasurement(measurement.id, targetUserId);
            if (result.success) {
                toast.success("Registro eliminado");
                setIsDeleteDialogOpen(false);
            } else {
                toast.error(result.error || "Error al eliminar");
            }
        } catch (error) {
            console.error("Error deleting measurement:", error);
            toast.error("Error al conectar con el servidor");
        } finally {
            setIsDeleting(false);
        }
    };

    // Extraer campos para pre-cargar el formulario de edición
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, userId, date, createdAt, weight, notes, ...measurements } = measurement;

    return (
        <div className="flex items-center gap-2">
            <LogMeasurementDialog
                isEdit={true}
                measurementId={measurement.id}
                targetUserId={targetUserId}
                initialData={measurements}
                initialWeight={weight}
                initialDate={date ? date.split('T')[0] : undefined}
                initialNotes={notes}
            >
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-white/5 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all">
                    <Pencil className="w-4 h-4" />
                </Button>
            </LogMeasurementDialog>

            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="h-9 w-9 rounded-lg bg-white/5 border border-white/5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
            >
                <Trash2 className="w-4 h-4" />
            </Button>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-neutral-900 border-neutral-800 text-white backdrop-blur-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-500 uppercase italic font-black">
                            <AlertTriangle className="w-5 h-5 text-red-500" /> Confirmar Eliminación
                        </DialogTitle>
                        <DialogDescription className="text-neutral-400 font-medium">
                            ¿Estás seguro de que deseas eliminar este registro del historial? Esta acción no se puede deshacer y actualizará tu perfil si este es el registro más reciente.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3 mt-4">
                        <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="text-white hover:bg-white/5 border-white/5 rounded-xl font-bold uppercase text-[10px] tracking-widest h-12">
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleDelete} 
                            disabled={isDeleting} 
                            className="bg-red-600 hover:bg-red-700 text-white border-none px-6 rounded-xl font-black uppercase text-[10px] tracking-widest h-12 shadow-lg shadow-red-600/20"
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar Definitivamente"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
