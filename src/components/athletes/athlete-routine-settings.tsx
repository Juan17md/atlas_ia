"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dumbbell, 
  Eye, 
  Plus, 
  Trash2, 
  Settings2,
  Loader2,
  AlertCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AssignRoutineModal } from "@/components/routines/assign-routine-modal";
import { unassignRoutineFromAthlete } from "@/actions/routine-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface AthleteRoutineSettingsProps {
  athleteId: string;
  athleteName: string;
  hasActiveRoutine: boolean;
  libraryRoutines: any[];
}

export function AthleteRoutineSettings({
  athleteId,
  athleteName,
  hasActiveRoutine,
  libraryRoutines,
}: AthleteRoutineSettingsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const handleUnassign = async () => {
    setIsDeleting(true);
    try {
      const result = await unassignRoutineFromAthlete(athleteId);
      if (result.success) {
        toast.success("Rutina desvinculada correctamente");
        router.refresh();
      } else {
        toast.error(result.error || "Error al desvincular");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {hasActiveRoutine ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800">
                <Dumbbell className="h-4 w-4" />
                Rutina Activa
                <Settings2 className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-neutral-900 border-neutral-800 text-neutral-300">
              <DropdownMenuLabel className="text-neutral-500 text-xs uppercase tracking-wider">Gestión de Rutina</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-neutral-800" />
              
              <DropdownMenuItem asChild className="cursor-pointer focus:bg-neutral-800 focus:text-white">
                <Link href={`/athletes/${athleteId}/routine`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Rutina Actual
                </Link>
              </DropdownMenuItem>

              <AssignRoutineModal 
                athleteId={athleteId} 
                athleteName={athleteName}
                routines={libraryRoutines}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer focus:bg-neutral-800 focus:text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Cambiar por Biblioteca
                  </DropdownMenuItem>
                }
              />

              <DropdownMenuItem asChild className="cursor-pointer focus:bg-neutral-800 focus:text-white">
                <Link href={`/routines/new?athleteId=${athleteId}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Nueva Personalizada
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-neutral-800" />
              
              <DropdownMenuItem 
                onSelect={() => setShowDeleteConfirm(true)}
                className="text-red-500 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar Rutina
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex flex-wrap gap-2">
            <AssignRoutineModal 
              athleteId={athleteId} 
              athleteName={athleteName}
              routines={libraryRoutines}
              trigger={
                <Button size="sm" variant="outline" className="gap-2 bg-neutral-950/50 border-neutral-800 border-dashed text-neutral-400 hover:text-white hover:bg-neutral-900">
                  <Plus className="h-4 w-4" />
                  Asignar de Biblioteca
                </Button>
              }
            />
            <Button size="sm" variant="outline" className="gap-2 bg-neutral-950/50 border-neutral-800 border-dashed text-neutral-400 hover:text-white hover:bg-neutral-900" asChild>
               <Link href={`/routines/new?athleteId=${athleteId}`}>
                  <Plus className="h-4 w-4" />
                  Crear Personalizada
               </Link>
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-neutral-900 border-neutral-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              ¿Confirmar eliminación?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-400">
              Esta acción desactivará la rutina actual de <strong>{athleteName}</strong>. El historial de entrenamientos se conservará, pero el atleta ya no verá esta rutina en su panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700" disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleUnassign();
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar Rutina"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
