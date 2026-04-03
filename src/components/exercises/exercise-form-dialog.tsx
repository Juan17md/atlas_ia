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
import { Loader2, Dumbbell, Tag, ImagePlay, Search, Eraser, Activity, ChevronRight, ChevronLeft, Sparkles, Youtube, Check, ExternalLink as ExternalLinkIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    const [step, setStep] = useState(1);
    const [isInternalOpen, setIsInternalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const router = useRouter();

    const TOTAL_STEPS = 4;

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
            setStep(1); // Reset to step 1 on open
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
                // Actualizar solo músculos según feedback del usuario
                if (result.data.muscleGroups && Array.isArray(result.data.muscleGroups)) {
                    setValue("muscleGroups", result.data.muscleGroups);
                }
                if (result.data.specificMuscles && Array.isArray(result.data.specificMuscles)) {
                    setValue("specificMuscles", result.data.specificMuscles);
                }
                toast.success("Músculos identificados con IA");
                
                // Si estamos en el paso 1, sugerir avanzar al paso 2
                if (step === 1) {
                    setTimeout(() => setStep(2), 800);
                }
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
            <DialogContent className="sm:max-w-[650px] bg-neutral-950 border-neutral-800 text-white p-0 gap-0 sm:rounded-3xl shadow-2xl shadow-black/50 h-full sm:h-[95vh] sm:max-h-[850px] flex flex-col border-0 sm:border">
                {/* Header Estilizado con Progress Bar */}
                <div className="bg-linear-to-br from-neutral-900 via-neutral-950 to-black p-5 md:p-8 border-b border-white/5 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <DialogHeader className="relative z-10">
                        <div className="flex justify-between items-center mb-4 md:mb-6">
                            <DialogTitle className="flex items-center gap-3 md:gap-4 text-xl md:text-3xl font-black uppercase tracking-tighter italic text-white leading-none">
                                <div className="h-8 w-8 md:h-12 md:w-12 rounded-lg md:rounded-2xl bg-red-600/10 flex items-center justify-center border border-red-600/20 shadow-2xl">
                                    <Dumbbell className="h-4 w-4 md:h-6 md:w-6 text-red-600" />
                                </div>
                                {exercise ? "Editar Ejercicio" : "Nuevo Ejercicio"}
                            </DialogTitle>
                            
                            <div className="flex items-center gap-1.5 md:gap-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div 
                                        key={i} 
                                        className={cn(
                                            "h-1.5 transition-all duration-500 rounded-full",
                                            step === i ? "w-6 bg-red-600" : step > i ? "w-2 bg-red-600/40" : "w-2 bg-neutral-800"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] md:text-xs font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 italic">PASO {step}</span>
                            <DialogDescription className="text-neutral-500 font-bold uppercase tracking-widest text-[8px] md:text-[10px]">
                                {step === 1 && "Identificación Técnica"}
                                {step === 2 && "Arquitectura Muscular"}
                                {step === 3 && "Objetivos Específicos"}
                                {step === 4 && "Media & Referencias"}
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-5 md:p-10 scrollbar-hide">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="space-y-8"
                            >
                                {step === 1 && (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1">Nombre del Ejercicio</Label>
                                            <div className="relative group">
                                                <Input
                                                    {...register("name")}
                                                    placeholder="Ej: Press de Banca"
                                                    className="bg-neutral-900/40 backdrop-blur-md border border-white/5 text-white h-14 md:h-20 rounded-xl md:rounded-3xl px-6 text-lg md:text-2xl font-black uppercase italic tracking-tight focus-visible:ring-red-600/30 focus-visible:border-red-600/50 transition-all placeholder:text-neutral-800 placeholder:not-italic shadow-2xl"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                                                    <Button
                                                        type="button"
                                                        onClick={handleSearch}
                                                        disabled={isSearching || isSubmitting}
                                                        className={cn(
                                                            "h-10 w-10 md:h-14 md:w-14 rounded-lg md:rounded-2xl transition-all shadow-xl group border relative overflow-hidden",
                                                            isSearching ? "bg-neutral-800 border-white/5" : "bg-red-600 border-red-500 hover:bg-red-700 hover:scale-105 active:scale-95"
                                                        )}
                                                    >
                                                        {isSearching ? (
                                                            <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                                                        ) : (
                                                            <>
                                                                <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                <Sparkles className="w-5 h-5 text-white animate-pulse" />
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                            {errors.name && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-2">{errors.name.message}</p>}
                                        </div>

                                        <div className="p-6 bg-red-600/5 border border-red-600/10 rounded-2xl md:rounded-3xl space-y-3">
                                            <div className="flex items-center gap-2 text-red-500">
                                                <Sparkles className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Asistente Maestro</span>
                                            </div>
                                            <p className="text-[11px] md:text-xs text-neutral-400 font-medium leading-relaxed">
                                                Escribe el nombre y usa el botón mágico para que la IA identifique automáticamente los <span className="text-white font-bold italic">grupos musculares</span> involucrados.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-1">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                                                <Tag className="w-3 h-3 text-red-500" /> Grupos Musculares Primarios
                                            </Label>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm"
                                                onClick={handleClear}
                                                className="h-8 text-[9px] font-black uppercase tracking-widest text-neutral-600 hover:text-white"
                                            >
                                                <Eraser className="w-3 h-3 mr-2" /> Limpiar
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 p-4 md:p-6 bg-black/40 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/5 shadow-inner">
                                            {MUSCLE_GROUPS.map(group => {
                                                const isSelected = selectedGroups?.includes(group);
                                                return (
                                                    <div
                                                        key={group}
                                                        onClick={() => toggleMuscleGroup(group)}
                                                        className={cn(
                                                            "px-3 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all border select-none text-center relative overflow-hidden",
                                                            isSelected
                                                                ? "bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/30 scale-[1.02] z-10"
                                                                : "bg-neutral-900/50 border-white/5 text-neutral-500 hover:bg-neutral-800 hover:text-white"
                                                        )}
                                                    >
                                                        {isSelected && <Check className="absolute right-1.5 top-1.5 w-3 h-3 text-white/50" />}
                                                        {group}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {errors.muscleGroups && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest ml-2">{errors.muscleGroups.message}</p>}
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1 flex items-center gap-2">
                                            <Activity className="w-3 h-3 text-red-500" /> Músculos Específicos (Target)
                                        </Label>
                                        {selectedGroups && selectedGroups.length > 0 ? (
                                            <div className="flex flex-wrap gap-2 p-6 bg-black/20 rounded-3xl md:rounded-4xl border border-white/5 border-dashed min-h-[150px] content-start">
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
                                                                "px-3.5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest cursor-pointer transition-all border select-none",
                                                                isSelected
                                                                    ? "bg-red-600/20 text-red-500 border-red-500/40 shadow-sm shadow-red-900/5"
                                                                    : "bg-neutral-900/30 border-white/5 text-neutral-600 hover:bg-neutral-800 hover:text-white"
                                                            )}
                                                        >
                                                            {muscle}
                                                        </div>
                                                    );
                                                })}
                                                {Array.from(new Set(selectedGroups.flatMap(group => SPECIFIC_MUSCLES_BY_GROUP[group] || []))).length === 0 && (
                                                    <div className="w-full flex flex-col items-center justify-center p-10 text-neutral-700 gap-2 opacity-50">
                                                        <Activity className="w-6 h-6" />
                                                        <p className="text-[9px] font-black uppercase tracking-widest">Sin mapeo disponible</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-12 bg-black/20 rounded-3xl md:rounded-4xl border border-white/5 border-dashed flex flex-col items-center justify-center text-neutral-800 gap-4 grayscale opacity-50">
                                                <Activity className="w-10 h-10 opacity-10" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Define Grupos Primero</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {step === 4 && (
                                    <div className="space-y-6">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1 flex items-center gap-2">
                                            <ImagePlay className="w-3 h-3 text-red-500" /> Multimedia & Referencias
                                        </Label>

                                        <div className="p-5 md:p-8 bg-black/40 backdrop-blur-md rounded-2xl md:rounded-3xl border border-white/5 shadow-inner space-y-6">
                                            <div className="space-y-4">
                                                <Label className="text-[9px] font-black uppercase tracking-widest text-neutral-600 ml-1">Video Demo</Label>
                                                <MediaUpload
                                                    value={watch("videoUrl") || ""}
                                                    onChange={(url) => setValue("videoUrl", url)}
                                                    onClear={() => setValue("videoUrl", "")}
                                                    disabled={isSubmitting}
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <Label className="text-[9px] font-black uppercase tracking-widest text-neutral-600 ml-1">Enlace Externo</Label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                                        <Youtube className="w-4 h-4 text-neutral-700 group-focus-within:text-red-500 transition-colors" />
                                                    </div>
                                                    <Input
                                                        {...register("videoUrl")}
                                                        placeholder="URL de YouTube, Vimeo..."
                                                        className="bg-neutral-950/50 border border-white/5 text-white h-12 md:h-14 pl-12 rounded-xl focus-visible:ring-red-600/20 focus-visible:border-red-600/30 transition-all font-medium text-[10px] placeholder:text-neutral-800"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <DialogFooter className={cn(
                        "p-5 md:p-8 border-t border-white/5 gap-3 md:gap-4 bg-black/80 backdrop-blur-3xl flex-row shrink-0",
                        "sticky bottom-0 left-0 right-0 z-50"
                    )}>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                if (step > 1) setStep(step - 1);
                                else setOpen(false);
                            }}
                            className="h-14 md:h-16 rounded-xl md:rounded-2xl text-neutral-500 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] px-6 transition-all border border-white/5 flex-1 md:flex-none"
                        >
                            {step === 1 ? "Cerrar" : (
                                <span className="flex items-center gap-2">
                                    <ChevronLeft className="w-4 h-4" /> Atrás
                                </span>
                            )}
                        </Button>
                        
                        {step < TOTAL_STEPS ? (
                            <Button
                                type="button"
                                onClick={() => setStep(step + 1)}
                                className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] px-8 shadow-xl shadow-red-900/40 hover:-translate-y-1 transition-all duration-300 flex-2 md:flex-none"
                            >
                                <span className="flex items-center gap-2">
                                    Siguiente <ChevronRight className="w-4 h-4" />
                                </span>
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="h-14 md:h-16 rounded-xl md:rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-[10px] px-8 shadow-2xl shadow-red-900/60 hover:-translate-y-1 transition-all duration-500 flex-2 md:flex-none animate-pulse"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        {exercise ? "Actualizar" : "Publicar"}
                                        <Check className="w-4 h-4" />
                                    </span>
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
