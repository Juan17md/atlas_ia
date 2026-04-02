"use client";

import React from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useWorkoutLogger } from "./workout-logger-context";

export function ConfirmOverwriteDialog() {
    const { showConfirmDialog, setShowConfirmDialog, confirmOverwrite } = useWorkoutLogger();

    return (
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogContent className="bg-neutral-950 border-neutral-800 text-white rounded-3xl max-w-sm">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-lg font-bold">
                        ¿Confirmar cambios?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-neutral-400">
                        Ya hay datos en esta fecha. ¿Deseas reemplazarlos con la nueva información?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 gap-2">
                    <AlertDialogCancel className="bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800 rounded-xl h-10 font-medium flex-1">
                        No, cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={confirmOverwrite}
                        className="bg-white text-black hover:bg-neutral-200 rounded-xl h-10 font-bold flex-1"
                    >
                        Sí, confirmar
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
