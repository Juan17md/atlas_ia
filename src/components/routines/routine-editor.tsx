"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { createRoutine, updateRoutine } from "@/actions/routine-actions";
import { generateRoutineDescription } from "@/actions/ai-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Save, ArrowLeft, Check, ChevronsUpDown, Dumbbell, CalendarDays, Clock, Copy, Activity, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RoutineSafetyCheck } from "@/components/routines/routine-safety-check";
import { ExerciseSelector } from "@/components/routines/exercise-selector";
import { ClientMotionDiv } from "@/components/ui/client-motion";
import { motion, AnimatePresence } from "framer-motion";

import type { RoutineFormData, ScheduleDay, ScheduleExercise, AIRoutine } from "./routine-editor-types";
import { WEEKDAYS } from "./routine-editor-types";
import { AIGenerator } from "./ai-generator";
import { RoutineImporter } from "./routine-importer";

interface RoutineEditorProps {
    initialData?: RoutineFormData;
    isEditing?: boolean;
    availableExercises?: { id: string; name: string }[];
    athleteId?: string;
    availableRoutines?: RoutineFormData[];
    initialDayIndex?: number;
}

export function RoutineEditor({ initialData, isEditing = false, availableExercises = [], athleteId, availableRoutines = [], initialDayIndex = 0 }: RoutineEditorProps) {
    const sortedExercises = useMemo(() => {
        return [...availableExercises].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [availableExercises]);

    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
    const [activeDayIndex, setActiveDayIndex] = useState(initialDayIndex);
    const [step, setStep] = useState(1);

    const DRAFT_KEY = "gymia-routine-draft";

    const form = useForm({
        defaultValues: initialData || {
            name: "",
            description: "",
            type: "weekly",
            schedule: [
                { id: "day-1", name: "Día 1", exercises: [] }
            ]
        }
    });

    const { register, control, handleSubmit, setValue, watch, reset } = form;
    const { fields: dayFields, append: appendDay, remove: removeDay } = useFieldArray({
        control,
        name: "schedule"
    });

    const formData = watch();
    const schedule = watch("schedule");
    const routineType = watch("type");

    useEffect(() => {
        if (!isEditing) {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                try {
                    const parsedDraft = JSON.parse(savedDraft);
                    const hasContent = parsedDraft.name || (parsedDraft.schedule[0]?.exercises?.length > 0);

                    if (hasContent) {
                        reset(parsedDraft);
                        toast.info("Se ha restaurado el borrador anterior", {
                            description: "No perderás tu progreso aunque se reinicie la página.",
                            action: {
                                label: "Descartar",
                                onClick: () => {
                                    localStorage.removeItem(DRAFT_KEY);
                                    reset({
                                        name: "",
                                        description: "",
                                        type: "weekly",
                                        schedule: [{ id: "day-1", name: "Día 1", exercises: [] }]
                                    });
                                }
                            }
                        });
                    }
                } catch (e) {
                    console.error("Error al cargar borrador:", e);
                }
            }
        }
    }, [isEditing, reset]);

    useEffect(() => {
        if (!isEditing) {
            const timer = setTimeout(() => {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [formData, isEditing]);

    const addExerciseToDay = (dayIndex: number, insertAt?: number) => {
        const newExercise = {
            exerciseId: "",
            exerciseName: "Nuevo Ejercicio",
            sets: [
                { type: "working", reps: "10-12", rpeTarget: 8, restSeconds: 60 }
            ],
            order: 0,
            variantIds: []
        };
        const updatedSchedule = [...schedule];
        
        if (!updatedSchedule[dayIndex].exercises) {
            updatedSchedule[dayIndex].exercises = [];
        }
        
        if (insertAt !== undefined) {
             updatedSchedule[dayIndex].exercises.splice(insertAt, 0, newExercise);
        } else {
             updatedSchedule[dayIndex].exercises.push(newExercise);
        }
        
        updatedSchedule[dayIndex].exercises = updatedSchedule[dayIndex].exercises.map((ex: any, idx: number) => ({...ex, order: idx + 1}));
        
        setValue("schedule", updatedSchedule);
    };

    const updateExerciseField = (dayIndex: number, exIndex: number, field: string, value: string | any[]) => {
        const updatedSchedule = [...schedule];
        if (updatedSchedule[dayIndex] && updatedSchedule[dayIndex].exercises[exIndex]) {
            if (field === 'exerciseName') {
                const found = sortedExercises.find(ex => ex.name === value);
                if (found) {
                    updatedSchedule[dayIndex].exercises[exIndex].exerciseId = found.id;
                }
            }
            (updatedSchedule[dayIndex].exercises[exIndex] as any)[field] = value;
            setValue("schedule", updatedSchedule);
        }
    };

    const removeExercise = (dayIndex: number, exIndex: number) => {
        const updatedSchedule = [...schedule];
        if (updatedSchedule[dayIndex] && updatedSchedule[dayIndex].exercises) {
            updatedSchedule[dayIndex].exercises.splice(exIndex, 1);
            setValue("schedule", updatedSchedule);
        }
    };

    const handleGenerateDescription = async () => {
        setIsGeneratingDescription(true);
        try {
            const scheduleWithIds = schedule.map((day, idx) => ({
                id: day.id || `day-${idx}`,
                name: day.name,
                exercises: day.exercises.map((ex, exIdx) => ({
                    exerciseId: ex.exerciseId || `ex-${exIdx}`,
                    exerciseName: ex.exerciseName,
                    sets: ex.sets.map(s => ({
                        type: s.type || "working",
                        reps: String(s.reps || ""),
                        rpeTarget: s.rpeTarget,
                        restSeconds: s.restSeconds,
                    })),
                    order: ex.order || exIdx,
                    notes: ex.notes || "",
                    variantIds: ex.variantIds || [],
                })),
            }));
            const res = await generateRoutineDescription(scheduleWithIds as any);
            if (res.success && res.description) {
                setValue("description", res.description);
                toast.success("Descripción generada");
            } else {
                toast.error("No se pudo generar la descripción");
            }
        } catch (error) {
            toast.error("Error al conectar con IA");
        } finally {
            setIsGeneratingDescription(false);
        }
    };

    const onAIResult = (aiRoutine: AIRoutine) => {
        reset({
            name: aiRoutine.name,
            description: aiRoutine.description,
            type: aiRoutine.type || "weekly",
            schedule: aiRoutine.schedule
        });
        toast.success("Rutina aplicada al editor");
    };

    const onSubmit = async (data: RoutineFormData) => {
        setIsSaving(true);
        try {
            const res = isEditing && initialData?.id
                ? await updateRoutine(initialData.id, data as any)
                : await createRoutine(data as any);

            if (res.success) {
                toast.success(isEditing ? "Rutina actualizada" : "Rutina creada");

                if (!isEditing) {
                    localStorage.removeItem(DRAFT_KEY);
                }

                if (athleteId) {
                    router.push(`/athletes/${athleteId}`);
                } else {
                    router.push("/routines");
                }
                router.refresh();
            } else {
                toast.error(res.error);
            }
        } catch (error) {
            toast.error("Error guardando rutina");
        } finally {
            setIsSaving(false);
        }
    };

    const [selectorOpen, setSelectorOpen] = useState(false);
    const [selectorContext, setSelectorContext] = useState<{ dayIndex: number; exIndex: number } | null>(null);

    const openExerciseSelector = (dayIndex: number, exIndex: number) => {
        setSelectorContext({ dayIndex, exIndex });
        setSelectorOpen(true);
    };

    const handleExerciseSelect = (exercise: { id?: string; name: string }) => {
        if (selectorContext) {
            const { dayIndex, exIndex } = selectorContext;
            if (isVariantMode) {
                if (exercise.id) {
                    const updatedSchedule = [...schedule];
                    const currentVariants = updatedSchedule[dayIndex].exercises[exIndex].variantIds || [];
                    if (!currentVariants.includes(exercise.id)) {
                        updatedSchedule[dayIndex].exercises[exIndex].variantIds = [...currentVariants, exercise.id];
                        setValue("schedule", updatedSchedule);
                        toast.success("Variante añadida");
                    }
                }
            } else {
                updateExerciseField(dayIndex, exIndex, "exerciseName", exercise.name);
                if (exercise.id) {
                    const updatedSchedule = [...schedule];
                    updatedSchedule[dayIndex].exercises[exIndex].exerciseId = exercise.id;
                    setValue("schedule", updatedSchedule);
                }
            }
        }
        setSelectorOpen(false);
        setSelectorContext(null);
        setIsVariantMode(false);
    };

    const removeVariant = (dayIndex: number, exIndex: number, variantId: string) => {
        const updatedSchedule = [...schedule];
        const currentVariants = updatedSchedule[dayIndex].exercises[exIndex].variantIds || [];
        updatedSchedule[dayIndex].exercises[exIndex].variantIds = currentVariants.filter((id: string) => id !== variantId);
        setValue("schedule", updatedSchedule);
    };

    const [isVariantMode, setIsVariantMode] = useState(false);

    const totalSteps = routineType === "daily" ? 3 : 4;
    
    const nextStep = () => {
        if (step === 1 && !formData.name) {
            toast.error("El nombre de la rutina es obligatorio");
            return;
        }
        let next = step + 1;
        if (routineType === "daily" && next === 2) next = 3;
        if (next <= 4) setStep(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const prevStep = () => {
        let prev = step - 1;
        if (routineType === "daily" && prev === 2) prev = 1;
        if (prev >= 1) setStep(prev);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <div className="container mx-auto max-w-7xl px-0 md:px-6 relative flex flex-col h-dvh md:h-auto md:min-h-screen bg-black overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none" />

            <div className="px-4 md:px-0 pt-6 md:pt-10 pb-4 md:pb-8 flex flex-col gap-4 bg-black/80 backdrop-blur-xl z-20 shrink-0 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="link"
                            onClick={() => router.back()}
                            className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-neutral-900/80 border border-white/5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all flex items-center justify-center p-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
                                {isEditing ? "Editar" : "Crear"} <span className="text-neutral-500">Rutina</span>
                            </h1>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mt-1">
                                Paso {routineType === "daily" ? (step === 1 ? 1 : step === 3 ? 2 : 3) : step} de {totalSteps}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {step === 1 && (
                            <AIGenerator onGenerate={onAIResult} currentType={watch("type") as "weekly" | "daily"} />
                        )}
                        <RoutineImporter routines={availableRoutines} onImport={onAIResult} />
                    </div>
                </div>

                <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden mt-2">
                    <motion.div 
                        className="h-full bg-red-600 rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${(step / totalSteps) * 100}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            <main className="flex-1 overflow-y-auto px-4 md:px-0 py-8 scrollbar-hide">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-12 pb-24"
                        >
                            <div className="bg-neutral-900/30 backdrop-blur-3xl border border-white/5 rounded-4xl p-8 md:p-10 shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-linear-to-b from-white/2 to-transparent pointer-events-none" />
                                
                                <div className="space-y-10 relative z-10">
                                    <div className="space-y-4">
                                        <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">Nombre de la Rutina</Label>
                                        <Input
                                            {...register("name")}
                                            placeholder="NOMBRE DE LA RUTINA..."
                                            className="bg-neutral-950/50 border border-white/5 h-16 rounded-2xl px-6 text-sm font-black text-white placeholder:text-neutral-800 transition-all focus-visible:ring-1 focus-visible:ring-red-500/50 uppercase italic tracking-widest"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">Descripción</Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleGenerateDescription}
                                                disabled={isGeneratingDescription}
                                                className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400"
                                            >
                                                {isGeneratingDescription ? (
                                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                                ) : (
                                                    <Sparkles className="w-3 h-3 mr-1" />
                                                )}
                                                Generar con IA
                                            </Button>
                                        </div>
                                        <Textarea
                                            {...register("description")}
                                            placeholder="Describe el objetivo y características de la rutina..."
                                            className="h-32 bg-neutral-950/50 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-neutral-800 transition-all focus-visible:ring-1 focus-visible:ring-red-500/50 resize-none"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">Tipo de Rutina</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <label className={cn(
                                                "relative cursor-pointer group",
                                                routineType === "weekly" ? "col-span-1" : "col-span-1 opacity-50"
                                            )}>
                                                <input
                                                    type="radio"
                                                    value="weekly"
                                                    {...register("type")}
                                                    className="sr-only"
                                                />
                                                <div className={cn(
                                                    "p-6 rounded-2xl border-2 transition-all text-center",
                                                    routineType === "weekly"
                                                        ? "border-red-500 bg-red-500/10"
                                                        : "border-white/10 bg-neutral-950/50 hover:border-white/20"
                                                )}>
                                                    <CalendarDays className={cn("w-8 h-8 mx-auto mb-2", routineType === "weekly" ? "text-red-500" : "text-neutral-500")} />
                                                    <span className={cn("text-sm font-black uppercase tracking-widest", routineType === "weekly" ? "text-white" : "text-neutral-500")}>Semanal</span>
                                                </div>
                                            </label>
                                            <label className={cn(
                                                "relative cursor-pointer group",
                                                routineType === "daily" ? "col-span-1" : "col-span-1 opacity-50"
                                            )}>
                                                <input
                                                    type="radio"
                                                    value="daily"
                                                    {...register("type")}
                                                    className="sr-only"
                                                />
                                                <div className={cn(
                                                    "p-6 rounded-2xl border-2 transition-all text-center",
                                                    routineType === "daily"
                                                        ? "border-red-500 bg-red-500/10"
                                                        : "border-white/10 bg-neutral-950/50 hover:border-white/20"
                                                )}>
                                                    <Dumbbell className={cn("w-8 h-8 mx-auto mb-2", routineType === "daily" ? "text-red-500" : "text-neutral-500")} />
                                                    <span className={cn("text-sm font-black uppercase tracking-widest", routineType === "daily" ? "text-white" : "text-neutral-500")}>Diaria</span>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={nextStep}
                                    className="h-14 px-8 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all"
                                >
                                    Siguiente
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 pb-24"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Días de Entrenamiento</h2>
                                <Button
                                    onClick={() => {
                                        const newDayName = routineType === "weekly" 
                                            ? WEEKDAYS[dayFields.length] || `Día ${dayFields.length + 1}`
                                            : `Día ${dayFields.length + 1}`;
                                        appendDay({ id: `day-${Date.now()}`, name: newDayName, exercises: [] });
                                    }}
                                    className="h-10 px-4 bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Añadir Día
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {dayFields.map((day, dayIndex) => (
                                    <ClientMotionDiv
                                        key={day.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: dayIndex * 0.05 }}
                                        className={cn(
                                            "relative p-6 rounded-3xl border-2 transition-all cursor-pointer",
                                            activeDayIndex === dayIndex
                                                ? "border-red-500 bg-red-500/10"
                                                : "border-white/10 bg-neutral-900/30 hover:border-white/20"
                                        )}
                                        onClick={() => setActiveDayIndex(dayIndex)}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <input
                                                {...register(`schedule.${dayIndex}.name`)}
                                                className="bg-transparent border-none text-lg font-black text-white uppercase italic tracking-tight focus:outline-none focus:ring-0 w-full"
                                                placeholder="Nombre del día"
                                            />
                                            {dayFields.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeDay(dayIndex);
                                                        if (activeDayIndex >= dayIndex && activeDayIndex > 0) {
                                                            setActiveDayIndex(prev => prev - 1);
                                                        }
                                                    }}
                                                    className="h-8 w-8 rounded-lg text-neutral-600 hover:text-red-500 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                                            <Dumbbell className="w-3 h-3" />
                                            {schedule[dayIndex]?.exercises?.length || 0} Ejercicios
                                        </div>
                                        {activeDayIndex === dayIndex && (
                                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-500 rounded-full" />
                                        )}
                                    </ClientMotionDiv>
                                ))}
                            </div>

                            <div className="flex justify-between">
                                <Button
                                    onClick={prevStep}
                                    variant="ghost"
                                    className="h-14 px-8 text-neutral-500 font-black uppercase tracking-widest rounded-2xl hover:text-white transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-2" />
                                    Atrás
                                </Button>
                                <Button
                                    onClick={nextStep}
                                    className="h-14 px-8 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all"
                                >
                                    Siguiente
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 pb-24"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Ejercicios</h2>
                                    <p className="text-sm text-neutral-500 font-bold mt-1">
                                        {schedule[activeDayIndex]?.name || `Día ${activeDayIndex + 1}`}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => addExerciseToDay(activeDayIndex)}
                                    className="h-10 px-4 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-neutral-200 transition-all"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Añadir Ejercicio
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {(schedule[activeDayIndex]?.exercises || []).map((exercise: any, exIndex: number) => (
                                    <ClientMotionDiv
                                        key={exIndex}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: exIndex * 0.03 }}
                                        className="bg-neutral-900/30 border border-white/5 rounded-3xl p-6 space-y-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="h-auto p-0 text-left hover:bg-transparent font-black text-lg text-white uppercase italic tracking-tighter hover:text-red-400 transition-colors flex items-center gap-2"
                                                        >
                                                            {exercise.exerciseName || "Seleccionar ejercicio"}
                                                            <ChevronsUpDown className="w-4 h-4 text-neutral-500" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="p-0 bg-neutral-900 border-white/10 rounded-2xl max-h-[300px] overflow-y-auto" side="bottom" align="start">
                                                        <Command className="bg-transparent">
                                                            <CommandInput placeholder="Buscar ejercicio..." className="border-none focus:ring-0" />
                                                            <CommandList>
                                                                <CommandEmpty>No encontrado</CommandEmpty>
                                                                <CommandGroup>
                                                                    {sortedExercises.map((ex) => (
                                                                        <CommandItem
                                                                            key={ex.id}
                                                                            value={ex.name}
                                                                            onSelect={() => {
                                                                                updateExerciseField(activeDayIndex, exIndex, "exerciseName", ex.name);
                                                                                if (ex.id) {
                                                                                    const updated = [...schedule];
                                                                                    updated[activeDayIndex].exercises[exIndex].exerciseId = ex.id;
                                                                                    setValue("schedule", updated);
                                                                                }
                                                                            }}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            {ex.name}
                                                                        </CommandItem>
                                                                    ))}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const current = schedule[activeDayIndex].exercises;
                                                        if (exIndex > 0) {
                                                            const updated = [...schedule];
                                                            [updated[activeDayIndex].exercises[exIndex - 1], updated[activeDayIndex].exercises[exIndex]] = 
                                                            [updated[activeDayIndex].exercises[exIndex], updated[activeDayIndex].exercises[exIndex - 1]];
                                                            setValue("schedule", updated);
                                                        }
                                                    }}
                                                    disabled={exIndex === 0}
                                                    className="h-8 w-8 rounded-lg text-neutral-600 hover:text-white hover:bg-white/10 disabled:opacity-30"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const updated = [...schedule];
                                                        const exs = updated[activeDayIndex].exercises;
                                                        if (exIndex < exs.length - 1) {
                                                            [updated[activeDayIndex].exercises[exIndex], updated[activeDayIndex].exercises[exIndex + 1]] = 
                                                            [updated[activeDayIndex].exercises[exIndex + 1], updated[activeDayIndex].exercises[exIndex]];
                                                            setValue("schedule", updated);
                                                        }
                                                    }}
                                                    disabled={exIndex === (schedule[activeDayIndex]?.exercises?.length || 0) - 1}
                                                    className="h-8 w-8 rounded-lg text-neutral-600 hover:text-white hover:bg-white/10 disabled:opacity-30"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeExercise(activeDayIndex, exIndex)}
                                                    className="h-8 w-8 rounded-lg text-neutral-600 hover:text-red-500 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                            {exercise.sets?.map((set: any, setIndex: number) => (
                                                <div key={setIndex} className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            {...register(`schedule.${activeDayIndex}.exercises.${exIndex}.sets.${setIndex}.type`)}
                                                            className="bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-black text-white uppercase"
                                                        >
                                                            <option value="working">Working</option>
                                                            <option value="warmup">Warmup</option>
                                                            <option value="failure">Failure</option>
                                                        </select>
                                                    </div>
                                                    <Input
                                                        {...register(`schedule.${activeDayIndex}.exercises.${exIndex}.sets.${setIndex}.reps`)}
                                                        placeholder="Reps"
                                                        className="h-10 bg-neutral-950 border border-white/10 rounded-xl px-3 text-sm font-black text-white placeholder:text-neutral-700"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            {...register(`schedule.${activeDayIndex}.exercises.${exIndex}.sets.${setIndex}.rpeTarget`)}
                                                            type="number"
                                                            placeholder="RPE"
                                                            className="h-10 w-16 bg-neutral-950 border border-white/10 rounded-xl px-3 text-sm font-black text-white placeholder:text-neutral-700"
                                                        />
                                                        <Input
                                                            {...register(`schedule.${activeDayIndex}.exercises.${exIndex}.sets.${setIndex}.restSeconds`)}
                                                            type="number"
                                                            placeholder="Seg"
                                                            className="h-10 flex-1 bg-neutral-950 border border-white/10 rounded-xl px-3 text-sm font-black text-white placeholder:text-neutral-700"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const updated = [...schedule];
                                                    updated[activeDayIndex].exercises[exIndex].sets.push({ type: "working", reps: "10", rpeTarget: 8, restSeconds: 60 });
                                                    setValue("schedule", updated);
                                                }}
                                                className="h-10 text-neutral-500 hover:text-white text-xs font-black uppercase"
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Set
                                            </Button>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setIsVariantMode(true);
                                                    openExerciseSelector(activeDayIndex, exIndex);
                                                }}
                                                className="text-[10px] font-black uppercase tracking-widest border-white/20 text-neutral-400 hover:text-white hover:border-white/40 rounded-xl"
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Variante
                                            </Button>
                                            {(exercise.variantIds || []).map((variantId: string) => {
                                                const variantEx = availableExercises.find(ex => ex.id === variantId);
                                                return (
                                                    <div key={variantId} className="flex items-center gap-1 px-2 py-1 bg-neutral-950 rounded-lg border border-white/10">
                                                        <span className="text-[10px] font-black text-neutral-400 uppercase">
                                                            {variantEx?.name || "Variante"}
                                                        </span>
                                                        <button
                                                            onClick={() => removeVariant(activeDayIndex, exIndex, variantId)}
                                                            className="text-neutral-600 hover:text-red-500"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <Input
                                            {...register(`schedule.${activeDayIndex}.exercises.${exIndex}.notes`)}
                                            placeholder="Notas adicionales..."
                                            className="h-10 bg-neutral-950/50 border border-white/5 rounded-xl px-4 text-xs text-neutral-400 placeholder:text-neutral-700"
                                        />
                                    </ClientMotionDiv>
                                ))}
                            </div>

                            <div className="flex justify-between">
                                <Button
                                    onClick={prevStep}
                                    variant="ghost"
                                    className="h-14 px-8 text-neutral-500 font-black uppercase tracking-widest rounded-2xl hover:text-white transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-2" />
                                    Atrás
                                </Button>
                                <Button
                                    onClick={nextStep}
                                    className="h-14 px-8 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all"
                                >
                                    Siguiente
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 pb-24"
                        >
                            <div>
                                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Resumen de la Rutina</h2>
                                <div className="bg-neutral-900/30 border border-white/5 rounded-3xl p-6 space-y-6">
                                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                                        <div>
                                            <h3 className="text-xl font-black text-white uppercase italic">{formData.name}</h3>
                                            <p className="text-sm text-neutral-500 mt-1">{formData.description || "Sin descripción"}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{formData.type === "weekly" ? "Semanal" : "Diaria"}</span>
                                        </div>
                                    </div>

                                    {schedule.map((day: any, dayIndex: number) => (
                                        <div key={dayIndex} className="space-y-3">
                                            <h4 className="text-sm font-black text-red-500 uppercase tracking-widest">{day.name}</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {day.exercises?.map((ex: any, exIndex: number) => (
                                                    <div key={exIndex} className="flex items-center gap-2 text-sm">
                                                        <div className="h-6 w-6 rounded-lg bg-neutral-950 border border-white/5 flex items-center justify-center text-[10px] font-black text-neutral-500">
                                                            {exIndex + 1}
                                                        </div>
                                                        <span className="text-neutral-300 font-bold">{ex.exerciseName}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <RoutineSafetyCheck routine={formData as any} athleteId={athleteId} />

                            <div className="flex justify-between">
                                <Button
                                    onClick={prevStep}
                                    variant="ghost"
                                    className="h-14 px-8 text-neutral-500 font-black uppercase tracking-widest rounded-2xl hover:text-white transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 mr-2" />
                                    Atrás
                                </Button>
                                <Button
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={isSaving}
                                    className="h-14 px-8 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 mr-2" />
                                            {isEditing ? "Actualizar" : "Crear"} Rutina
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <ExerciseSelector
                open={selectorOpen}
                onOpenChange={setSelectorOpen}
                onSelect={handleExerciseSelect}
                availableExercises={availableExercises}
                title={isVariantMode ? "Añadir Variante" : "Seleccionar Ejercicio"}
            />
        </div>
    );
}