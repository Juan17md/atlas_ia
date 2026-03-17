"use client";

import { useState } from "react";
import { deleteUser } from "@/actions/user-actions";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteUserButtonProps {
    userId: string;
    userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const result = await deleteUser(userId);
            if (result.success) {
                toast.success("Usuario eliminado correctamente");
            } else {
                toast.error(result.error || "Error al eliminar el usuario");
            }
        } catch (error) {
            toast.error("Error de red al eliminar el usuario");
        } finally {
            setIsLoading(false);
            setShowConfirm(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={isLoading}
                className="p-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 text-red-500 hover:text-red-400 transition-all duration-300 disabled:opacity-50"
                title="Eliminar usuario"
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Trash2 className="w-4 h-4" />
                )}
            </button>

            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="bg-neutral-900 border-red-600/20 text-white rounded-3xl sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="font-black uppercase italic text-xl">Confirmar Eliminación</DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            ¿Estás seguro de que deseas eliminar a <span className="text-white font-bold">{userName}</span>? 
                            Esta acción no se puede deshacer y el usuario perderá acceso al sistema.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3 mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirm(false)}
                            disabled={isLoading}
                            className="rounded-2xl border-white/10 text-neutral-400 hover:bg-white/5 hover:text-white"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isLoading}
                            className="rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-[10px]"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
