"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ExerciseSchema } from "@/lib/schemas";
import { createExercise, updateExercise } from "@/actions/exercise-actions";
import { generateExerciseDetails } from "@/actions/ai-actions";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaUpload } from "@/components/ui/media-upload";
import { Loader2, Dumbbell, Tag, ImagePlay, Search, Eraser, Activity } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Schema para formulario (misma lógica que el schema del servidor)
const FormSchema = ExerciseSchema.omit({
    id: true,
    coachId: true,
    createdAt: true,
    updatedAt: true,
    description: true
});

type FormInput = z.infer<typeof FormSchema>;

const MUSCLE_GROUPS = [
    "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Isquiotibiales", "Glúteos", "Aductores", "Pantorrillas", "Abdominales", "Cardio", "Full Body"
];

const SPECIFIC_MUSCLES_BY_GROUP: Record<string, string[]> = {
    "Pecho": ["Pectoral Mayor", "Pectoral Menor", "Serrato Anterior", "Serrato Posterior", "Pectoral Inferior"],
    "Espalda": ["Dorsal Ancho", "Trapecio", "Romboides", "Redondo Mayor", "Redondo Menor", "Erector de la Columna", "Lumbar"],
    "Hombros": ["Deltoides Anterior", "Deltoides Medio", "Deltoides Posterior", "Manguito Rotador", "Deltoides Inferior", "Deltoides Superior"],
    "Bíceps": ["Bíceps Braquial", "Braquial", "Braquiorradial", "Bíceps Femoral", "Bíceps Longo", "Bíceps Corto"],
    "Tríceps": ["Tríceps Braquial (Cabeza Larga)", "Tríceps Braquial (Cabeza Lateral)", "Tríceps Braquial (Cabeza Medial)", "Tríceps Femoral", "Tríceps Longo", "Tríceps Corto"],
    "Cuádriceps": ["Recto Femoral", "Vasto Lateral", "Vasto Medial", "Vasto Intermedio"],
    "Isquiotibiales": ["Bíceps Femoral", "Semitendinoso", "Semimembranoso", "Isquiotibiales Inferior", "Isquiotibiales Superior"],
    "Glúteos": ["Glúteo Mayor", "Glúteo Medio", "Glúteo Menor", "Glúteo Inferior", "Glúteo Superior"],
    "Aductores": ["Aductor Mayor", "Aductor Largo", "Aductor Corto", "Pectíneo", "Grácil", "Aductor Inferior", "Aductor Superior"],
    "Pantorrillas": ["Gastrocnemio", "Sóleo", "Pantorrilla Inferior", "Pantorrilla Superior"],
    "Abdominales": ["Recto Abdominal", "Oblicuos", "Transverso del Abdomen", "Abdominal Inferior", "Abdominal Superior"],
    "Cardio": ["Corazón", "Resistencia General"],
    "Full Body": ["Cuerpo Completo"]
};

interface ExerciseFormDialogProps {
    exercise?: any; // Si está presente, es modo edición
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ExerciseFormDialog({ exercise, trigger, open, onOpenChange }: ExerciseFormDialogProps) {
    const [isInternalOpen, setIsInternalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const router = useRouter();

    // Controlado externa o internamente
    const isOpen = open !== undefined ? open : isInternalOpen;
    const setOpen = onOpenChange || setIsInternalOpen;

    const form = useForm<FormInput>({
        resolver: zodResolver(FormSchema),
        defaultValues: exercise ? {
            name: exercise.name,
            muscleGroups: exercise.muscleGroups || [],
            specificMuscles: exercise.specificMuscles || [],
            videoUrl: exercise.videoUrl
        } : {
            name: "",
            muscleGroups: [],
            specificMuscles: [],
            videoUrl: ""
        },
    });

    const { register, handleSubmit, setValue, watch, getValues, reset, formState: { errors } } = form;
    const selectedGroups = watch("muscleGroups");

    // Efecto para actualizar el formulario si cambia el ejercicio o se abre el diálogo
    useEffect(() => {
        if (isOpen) {
            if (exercise) {
                reset({
                    name: exercise.name,
                    muscleGroups: exercise.muscleGroups || [],
                    specificMuscles: exercise.specificMuscles || [],
                    videoUrl: exercise.videoUrl
                });
            } else {
                reset({
                    name: "",
                    muscleGroups: [],
                    specificMuscles: [],
                    videoUrl: ""
                });
            }
        }
    }, [isOpen, exercise?.id, reset]);

    const onSubmit = async (data: FormInput) => {
        setIsSubmitting(true);
        try {
            let result;
            if (exercise) {
                result = await updateExercise(exercise.id, data);
            } else {
                result = await createExercise(data);
            }

            if (result.success) {
                toast.success(exercise ? "Ejercicio actualizado" : "Ejercicio creado");
                setOpen(false);
                router.refresh();
                if (!exercise) reset();
            } else {
                toast.error(result.error || "Error al guardar");
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMuscleGroup = (group: string) => {
        const current = selectedGroups || [];
        if (current.includes(group)) {
            setValue("muscleGroups", current.filter(g => g !== group));
        } else {
            setValue("muscleGroups", [...current, group]);
        }
    };

    const handleSearch = async () => {
        const name = getValues("name");
        if (!name || name.trim().length < 3) {
            toast.error("Ingresa un nombre de ejercicio válido para buscar");
            return;
        }

        setIsSearching(true);
        try {
            const result = await generateExerciseDetails(name);
            if (result.success && result.data) {
                // Actualizar campos
                if (result.data.muscleGroups && Array.isArray(result.data.muscleGroups)) {
                    setValue("muscleGroups", result.data.muscleGroups);
                }
                if (result.data.specificMuscles && Array.isArray(result.data.specificMuscles)) {
                    setValue("specificMuscles", result.data.specificMuscles);
                }
                toast.success("Datos cargados con IA");
            } else {
                toast.error("No se pudieron encontrar detalles para este ejercicio");
            }
        } catch (error) {
            toast.error("Error al buscar detalles");
        } finally {
            setIsSearching(false);
        }
    };

    const handleClear = () => {
        setValue("muscleGroups", []);
        setValue("specificMuscles", []);
        toast.info("Datos de músculos limpiados");
    };

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[650px] bg-neutral-950 border-neutral-800 text-white p-0 gap-0 rounded-3xl shadow-2xl shadow-black/50 max-h-[95vh] flex flex-col">

                {/* Header Estilizado */}
                <div className="bg-linear-to-br from-neutral-900 via-neutral-950 to-black p-6 md:p-8 border-b border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="flex items-center gap-3 md:gap-4 text-2xl md:text-3xl font-black uppercase tracking-tighter italic text-white">
                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-red-600/10 flex items-center justify-center border border-red-600/20 shadow-2xl">
                                <Dumbbell className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
                            </div>
                            {exercise ? "Editar Ejercicio" : "Nuevo Ejercicio"}
                        </DialogTitle>
                        <DialogDescription className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-[8px] md:text-[10px] ml-13 md:ml-16 mt-1">
                            Biblioteca Técnica <span className="text-red-500">/ Engine AI</span>
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 max-h-[65vh] scrollbar-hide">
                        <div className="space-y-8">
                            {/* Nombre */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 ml-1">Identificador Técnico</Label>
                                <div className="flex gap-3">
                                    <Input
                                        {...register("name")}
                                        placeholder="Ej: Press de Banca"
                                        className="bg-neutral-900/40 backdrop-blur-md border border-white/5 text-white h-14 md:h-16 rounded-xl md:rounded-2xl px-4 md:px-6 text-base md:text-lg font-black uppercase italic tracking-tight focus-visible:ring-red-600/30 focus-visible:border-red-600/50 transition-all placeholder:text-neutral-700 placeholder:not-italic flex-1 shadow-2xl"
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleSearch}
                                        disabled={isSearching || isSubmitting}
                                        className="h-14 w-14 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-neutral-900 border border-white/5 hover:bg-neutral-800 text-white transition-all shadow-xl group shrink-0"
                                        title="Buscar detalles con IA"
                                    >
                                        {isSearching ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <Search className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform text-red-500" />}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={handleClear}
                                        disabled={isSearching || isSubmitting}
                                        variant="outline"
                                        className="h-14 w-14 md:h-16 md:w-16 rounded-xl md:rounded-2xl border-white/5 bg-neutral-900/20 hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all shadow-xl shrink-0"
                                        title="Limpiar datos de músculos"
                                    >
                                        <Eraser className="w-5 h-5 md:w-6 md:h-6" />
                                    </Button>
                                </div>
                                {errors.name && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-2">{errors.name.message}</p>}
                            </div>

                            {/* Tags Muscles */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 ml-1 flex items-center gap-2">
                                    <Tag className="w-3 h-3 text-red-500" /> Grupos Musculares Primarios
                                </Label>
                                <div className="flex flex-wrap gap-2 p-4 md:p-6 bg-black/40 backdrop-blur-md rounded-3xl md:rounded-4xl border border-white/5 shadow-inner">
                                    {MUSCLE_GROUPS.map(group => {
                                        const isSelected = selectedGroups?.includes(group);
                                        return (
                                            <div
                                                key={group}
                                                onClick={() => toggleMuscleGroup(group)}
                                                className={cn(
                                                    "px-3.5 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] cursor-pointer transition-all border select-none shadow-sm",
                                                    isSelected
                                                        ? "bg-red-600 text-white border-red-500 shadow-xl shadow-red-900/40 -translate-y-0.5"
                                                        : "bg-neutral-900/50 border-white/5 text-neutral-500 hover:bg-neutral-800 hover:text-white"
                                                )}
                                            >
                                                {group}
                                            </div>
                                        );
                                    })}
                                </div>
                                {errors.muscleGroups && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-2">{errors.muscleGroups.message}</p>}
                            </div>

                            {/* Músculos Específicos */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 ml-1 flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-red-500" /> Músculos Específicos (Target)
                                </Label>
                                {selectedGroups && selectedGroups.length > 0 ? (
                                    <div className="flex flex-wrap gap-2.5 p-6 bg-black/20 rounded-4xl border border-white/5 border-dashed">
                                        {Array.from(new Set(selectedGroups.flatMap(group => SPECIFIC_MUSCLES_BY_GROUP[group] || []))).map(muscle => {
                                            const isSelected = watch("specificMuscles")?.includes(muscle);
                                            return (
                                                <div
                                                    key={muscle}
                                                    onClick={() => {
                                                        const current = watch("specificMuscles") || [];
                                                        if (current.includes(muscle)) {
                                                            setValue("specificMuscles", current.filter(m => m !== muscle));
                                                        } else {
                                                            setValue("specificMuscles", [...current, muscle]);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all border select-none",
                                                        isSelected
                                                            ? "bg-red-600/10 text-red-500 border-red-500/30 shadow-lg shadow-red-900/10"
                                                            : "bg-neutral-900/30 border-white/5 text-neutral-600 hover:bg-neutral-800 hover:text-white"
                                                    )}
                                                >
                                                    {muscle}
                                                </div>
                                            );
                                        })}
                                        {Array.from(new Set(selectedGroups.flatMap(group => SPECIFIC_MUSCLES_BY_GROUP[group] || []))).length === 0 && (
                                            <p className="text-neutral-600 text-[10px] font-black uppercase tracking-widest italic opacity-50">No hay mapeo específico disponible</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-10 bg-black/20 rounded-4xl border border-white/5 border-dashed flex flex-col items-center justify-center text-neutral-700 gap-3 grayscale opacity-50">
                                        <Activity className="w-8 h-8 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Pendiente de Definición</p>
                                    </div>
                                )}
                            </div>

                            {/* Multimedia */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 ml-1 flex items-center gap-2">
                                    <ImagePlay className="w-3 h-3 text-red-500" /> Multimedia & Referencia
                                </Label>

                                <div className="p-6 md:p-8 bg-black/40 backdrop-blur-md rounded-3xl md:rounded-4xl border border-white/5 shadow-inner space-y-6">
                                    <MediaUpload
                                        value={watch("videoUrl") || ""}
                                        onChange={(url) => setValue("videoUrl", url)}
                                        onClear={() => setValue("videoUrl", "")}
                                        disabled={isSubmitting}
                                    />

                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                            <ExternalLink className="w-4 h-4 text-neutral-600 group-focus-within:text-red-500 transition-colors" />
                                        </div>
                                        <Input
                                            {...register("videoUrl")}
                                            placeholder="URL de referencia (YouTube...)"
                                            className="bg-neutral-950/50 border border-white/5 text-white h-12 md:h-14 pl-12 rounded-xl md:rounded-2xl focus-visible:ring-red-600/20 focus-visible:border-red-600/30 transition-all font-medium text-[10px] md:text-xs placeholder:text-neutral-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 md:p-8 border-t border-white/5 gap-3 md:gap-4 bg-black/60 backdrop-blur-2xl flex-row">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            className="h-14 md:h-16 rounded-xl md:rounded-2xl text-neutral-500 hover:text-white hover:bg-white/5 font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] px-4 md:px-8 transition-all flex-1 md:flex-none"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] text-[9px] md:text-[10px] px-6 md:px-10 shadow-2xl shadow-red-900/40 hover:shadow-red-600/40 hover:-translate-y-1 transition-all duration-500 flex-2 md:flex-none"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span className="flex items-center gap-2 md:gap-3">
                                    {exercise ? "Actualizar" : "Publicar"}
                                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Helper icons for the footer and labels
function ExternalLink(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
    );
}

function ChevronRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}
