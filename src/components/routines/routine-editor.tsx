"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { createRoutine, updateRoutine, generateRoutineWithAI } from "@/actions/routine-actions";
import { generateRoutineDescription } from "@/actions/ai-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Wand2, Sparkles, Save, ArrowLeft, Check, ChevronsUpDown, Dumbbell, CalendarDays, Clock, Copy, Activity, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
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

// --- INTERFACES ---

interface ExerciseSet {
    type?: string;
    reps?: string | number;
    rpeTarget?: number;
    restSeconds?: number;
}

interface ScheduleExercise {
    exerciseId?: string;
    exerciseName: string;
    notes?: string;
    sets: ExerciseSet[];
    order?: number;
    variantIds?: string[];
}

interface ScheduleDay {
    name: string;
    exercises: ScheduleExercise[];
}

interface AIRoutine {
    name: string;
    description?: string;
    type?: string;
    schedule: ScheduleDay[];
}

interface RoutineFormData {
    id?: string;
    name: string;
    description?: string;
    type: string;
    schedule: ScheduleDay[];
}

interface AvailableExercise {
    id: string;
    name: string;
}

// --- Constantes ---
const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// --- AI Generator Component ---
function AIGenerator({ onGenerate, currentType }: { onGenerate: (routine: AIRoutine) => void, currentType: "weekly" | "daily" }) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [criteria, setCriteria] = useState({
        goal: "hypertrophy",
        daysPerWeek: 3,
        experienceLevel: "intermediate",
        injuries: "",
        focus: "",
        userPrompt: ""
    });

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const injuriesArray = criteria.injuries.split(",").map(s => s.trim()).filter(Boolean);
            const res = await generateRoutineWithAI({
                athleteId: "generic",
                goal: criteria.goal,
                daysPerWeek: Number(criteria.daysPerWeek),
                experienceLevel: criteria.experienceLevel,
                injuries: injuriesArray,
                focus: criteria.focus,
                routineType: currentType,
                userPrompt: criteria.userPrompt
            });

            if (res.success && res.routine) {
                onGenerate(res.routine);
                setOpen(false);
                toast.success("¡Protocolo generado por IA!");
            } else {
                toast.error(res.error || "Error al generar");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="relative h-12 px-8 rounded-full border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10 hover:border-red-500 hover:text-white font-black uppercase italic tracking-widest text-[10px] transition-all overflow-hidden group">
                    <div className="absolute inset-0 bg-linear-to-r from-red-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Sparkles className="w-4 h-4 mr-2 relative z-10" />
                    <span className="relative z-10 hidden sm:inline">Activar Generador IA</span>
                    <span className="relative z-10 sm:hidden">IA</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/95 backdrop-blur-3xl border border-white/10 text-white sm:max-w-[550px] p-0 rounded-4xl overflow-hidden shadow-[0_0_100px_-20px_rgba(239,68,68,0.2)]">
                <div className="absolute inset-0 bg-linear-to-b from-red-600/3 to-transparent pointer-events-none" />
                <div className="p-8 md:p-10 relative z-10">
                    <DialogHeader className="mb-10 text-center md:text-left">
                        <DialogTitle className="flex items-center justify-center md:justify-start gap-4 text-3xl font-black uppercase italic tracking-tighter leading-none">
                            <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center border border-red-600/20 shadow-xl">
                                <Wand2 className="w-6 h-6 text-red-500" />
                            </div>
                            <span>Inteligencia <span className="text-neutral-500">Generativa</span></span>
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mt-4 italic">
                            Configuración Técnica de Parámetros de Entrenamiento
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-6 text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">
                            <div className="space-y-3">
                                <Label className="ml-1 opacity-70">Objetivo Estratégico</Label>
                                <Select value={criteria.goal} onValueChange={(v) => setCriteria({ ...criteria, goal: v })}>
                                    <SelectTrigger className="bg-neutral-900/50 border border-white/5 rounded-2xl h-12 text-xs font-bold text-white transition-all focus:ring-1 focus:ring-red-500/50 hover:bg-neutral-900 uppercase">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-white/5 text-white rounded-2xl shadow-2xl">
                                        <SelectItem value="hypertrophy" className="font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl focus:bg-white focus:text-black italic">Hipertrofia</SelectItem>
                                        <SelectItem value="strength" className="font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl focus:bg-white focus:text-black italic">Fuerza</SelectItem>
                                        <SelectItem value="weight_loss" className="font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl focus:bg-white focus:text-black italic">Pérdida Peso</SelectItem>
                                        <SelectItem value="endurance" className="font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl focus:bg-white focus:text-black italic">Resistencia</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <Label className="ml-1 opacity-70">Frecuencia (D/S)</Label>
                                <Input
                                    type="number"
                                    min={1} max={7}
                                    value={criteria.daysPerWeek}
                                    onChange={(e) => setCriteria({ ...criteria, daysPerWeek: Number(e.target.value) })}
                                    className="bg-neutral-900/50 border border-white/5 rounded-2xl h-12 text-xs font-bold text-white transition-all focus:ring-1 focus:ring-red-500/50 text-center"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1 italic opacity-70">Nivel de Competencia</Label>
                            <Select value={criteria.experienceLevel} onValueChange={(v) => setCriteria({ ...criteria, experienceLevel: v })}>
                                <SelectTrigger className="bg-neutral-900/50 border border-white/5 rounded-2xl h-12 text-xs font-bold text-white transition-all focus:ring-1 focus:ring-red-500/50 hover:bg-neutral-900 uppercase">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-white/5 text-white rounded-2xl shadow-2xl">
                                    <SelectItem value="beginner" className="font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl focus:bg-white focus:text-black italic">Principiante</SelectItem>
                                    <SelectItem value="intermediate" className="font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl focus:bg-white focus:text-black italic">Intermedio</SelectItem>
                                    <SelectItem value="advanced" className="font-bold uppercase tracking-widest text-[10px] py-3 rounded-xl focus:bg-white focus:text-black italic">Avanzado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1 italic opacity-70">Restricciones Físicas</Label>
                            <div className="relative">
                                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600" />
                                <Input
                                    placeholder="LESIONES O LIMITACIONES..."
                                    value={criteria.injuries}
                                    onChange={(e) => setCriteria({ ...criteria, injuries: e.target.value })}
                                    className="bg-neutral-900/50 border border-white/5 rounded-2xl h-12 pl-12 pr-4 text-[10px] font-black text-white transition-all focus:ring-1 focus:ring-red-500/50 uppercase placeholder:text-neutral-700 italic tracking-widest"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 ml-1 italic opacity-70">Prompt de Misión (Opcional)</Label>
                            <Textarea
                                placeholder="DESCRIBE TU ENFOQUE PERSONALIZADO..."
                                value={criteria.userPrompt}
                                onChange={(e) => setCriteria({ ...criteria, userPrompt: e.target.value })}
                                className="bg-neutral-900/50 border border-white/5 rounded-4xl min-h-[120px] p-6 text-[10px] font-black text-white focus:ring-1 focus:ring-red-500/50 transition-all resize-none uppercase placeholder:text-neutral-700 italic tracking-widest leading-relaxed"
                            />
                        </div>

                        <Button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="w-full h-16 bg-white text-black hover:bg-neutral-200 font-black uppercase italic tracking-widest text-[10px] rounded-2xl shadow-2xl transition-all shadow-white/5 hover:-translate-y-1"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-3" /> : <Sparkles className="w-5 h-5 mr-3" />}
                            Iniciar Generación de Datos
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- Routine Importer Component ---
function RoutineImporter({ routines = [], onImport }: { routines: any[], onImport: (routine: any) => void }) {
    const [open, setOpen] = useState(false);

    // Deduplicar rutinas por ID para evitar el error "Children with the same key"
    const uniqueRoutines = Array.from(new Map(routines.map(r => [r.id, r])).values());

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10 gap-2 transition-all rounded-full px-4 sm:px-6 h-12 text-xs font-bold tracking-wide">
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">IMPORTAR</span>
                    <span className="sm:hidden">IMPORTAR</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[450px] p-0 overflow-hidden rounded-2xl">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter">Copiar de Existente</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Selecciona una rutina para copiar su estructura y ejercicios.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-4">
                    <Command className="bg-transparent text-white">
                        <CommandInput placeholder="Buscar rutina..." className="border-none focus:ring-0 text-white" />
                        <CommandList className="max-h-[300px] mt-2">
                            <CommandEmpty className="py-4 text-center text-neutral-500">No se encontraron rutinas.</CommandEmpty>
                            <CommandGroup>
                                {uniqueRoutines.map((r) => (
                                    <CommandItem
                                        key={r.id}
                                        onSelect={() => {
                                            onImport(r);
                                            setOpen(false);
                                            toast.success(`Datos importados de: ${r.name}`);
                                        }}
                                        className="hover:bg-white/5 cursor-pointer rounded-lg p-3 aria-selected:bg-white/10"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-bold text-red-500 text-sm uppercase">{r.name}</span>
                                            <span className="text-xs text-neutral-400 line-clamp-1">{r.description || "Sin descripción"}</span>
                                            <div className="flex gap-2 mt-1">
                                                <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
                                                    {r.type === 'daily' ? '1 Día' : `${r.schedule?.length || 0} Días`}
                                                </span>
                                                <span className="text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
                                                    {r.schedule?.reduce((acc: number, d: any) => acc + (d.exercises?.length || 0), 0)} Ejercicios
                                                </span>
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- Main Editor Component ---

// Tipos para props - Usamos tipos amplios debido a la naturaleza dinámica del editor
// TODO: Tipar estrictamente cuando se refactorice el manejo de formularios
interface RoutineEditorProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialData?: any;
    isEditing?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    availableExercises?: any[];
    athleteId?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    availableRoutines?: any[];
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
                { name: "Día 1", exercises: [] }
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

    // --- LOGICA DE PERSISTENCIA (LocalStorage) ---

    // Cargar borrador al montar (solo si no estamos editando una existente)
    useEffect(() => {
        if (!isEditing) {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                try {
                    const parsedDraft = JSON.parse(savedDraft);
                    // Solo restaurar si tiene contenido (nombre o al menos un ejercicio)
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
                                        schedule: [{ name: "Día 1", exercises: [] }]
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

    // Guardar automáticamente al cambiar
    useEffect(() => {
        if (!isEditing) {
            // Guardamos con un pequeño retraso para no saturar el localStorage
            const timer = setTimeout(() => {
                localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [formData, isEditing]);

    const addExerciseToDay = (dayIndex: number, insertAt?: number) => {
        const currentExercises = Array.isArray(schedule[dayIndex]?.exercises) ? schedule[dayIndex].exercises : [];
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

    const updateDayExercises = (dayIndex: number, exercises: any[]) => {
        const updatedSchedule = [...schedule];
        if (updatedSchedule[dayIndex]) {
            updatedSchedule[dayIndex].exercises = exercises;
            setValue("schedule", updatedSchedule);
        }
    };

    const updateExerciseField = (dayIndex: number, exIndex: number, field: string, value: string | any[]) => {
        const updatedSchedule = [...schedule];
        if (updatedSchedule[dayIndex] && updatedSchedule[dayIndex].exercises[exIndex]) {
            if (field === 'exerciseName') {
                const found = (availableExercises as any[]).find(ex => ex.name === value);
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
            const res = await generateRoutineDescription(schedule);
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
                ? await updateRoutine(initialData.id, data as unknown as Parameters<typeof updateRoutine>[1])
                : await createRoutine(data as unknown as Parameters<typeof createRoutine>[0]);

            if (res.success) {
                toast.success(isEditing ? "Rutina actualizada" : "Rutina creada");

                // Limpiar borrador al guardar con éxito
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

    // Helper for Exercise Selector Modal (Mobile Optimized)
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
                // Agregar variante
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
                // Seleccionar ejercicio principal
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

    // Corregir error de tipo en handleVariantSelect
    const removeVariant = (dayIndex: number, exIndex: number, variantId: string) => {
        const updatedSchedule = [...schedule];
        const currentVariants = updatedSchedule[dayIndex].exercises[exIndex].variantIds || [];
        updatedSchedule[dayIndex].exercises[exIndex].variantIds = currentVariants.filter((id: string) => id !== variantId);
        setValue("schedule", updatedSchedule);
    };

    const [isVariantMode, setIsVariantMode] = useState(false);

    // Wizard Logic
    const totalSteps = routineType === "daily" ? 3 : 4;
    
    const nextStep = () => {
        if (step === 1 && !formData.name) {
            toast.error("El nombre de la rutina es obligatorio");
            return;
        }
        let next = step + 1;
        if (routineType === "daily" && next === 2) next = 3; // Saltamos el calendario si es diaria
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
            {/* Ambient Lighting */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px] -z-10 animate-pulse pointer-events-none" />

            {/* Header / Editor Toolbar */}
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
                                Paso {step} de {totalSteps}
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

                {/* Progress Bar */}
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
                            {/* Step 1: Metadata (Extracting from existing column) */}
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
                                        <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">Tipo de Rutina</Label>
                                        <div className="grid grid-cols-2 gap-3 p-1.5 bg-neutral-950/80 rounded-2xl border border-white/5">
                                            <button
                                                type="button"
                                                onClick={() => setValue("type", "weekly")}
                                                className={cn(
                                                    "flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all",
                                                    routineType === "weekly" ? "bg-white text-black shadow-xl" : "text-neutral-600 hover:text-neutral-400"
                                                )}
                                            >
                                                <CalendarDays className="w-4 h-4" /> Semanal
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setValue("type", "daily");
                                                    if (schedule.length > 1) setValue("schedule", [schedule[0]]);
                                                    setActiveDayIndex(0);
                                                }}
                                                className={cn(
                                                    "flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase italic tracking-widest transition-all",
                                                    routineType === "daily" ? "bg-white text-black shadow-xl" : "text-neutral-600 hover:text-neutral-400"
                                                )}
                                            >
                                                <Clock className="w-4 h-4" /> Diario
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-1">
                                            <Label className="ml-1 text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">Resumen Estratégico</Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={handleGenerateDescription}
                                                disabled={isGeneratingDescription}
                                                className="h-8 px-4 bg-red-500/10 text-red-500 hover:bg-white hover:text-black rounded-full text-[9px] font-black uppercase italic tracking-widest transition-all border border-red-500/20"
                                            >
                                                <Sparkles className="w-3 h-3 mr-2" /> Generar con IA
                                            </Button>
                                        </div>
                                        <Textarea
                                            {...register("description")}
                                            placeholder="DESCRIBE TU ENFOQUE PERSONALIZADO..."
                                            className="bg-neutral-950/50 border border-white/5 rounded-3xl min-h-[160px] p-6 text-[10px] font-black text-white placeholder:text-neutral-800 transition-all focus-visible:ring-1 focus-visible:ring-red-500/40 resize-none uppercase italic leading-relaxed tracking-widest shadow-inner overflow-y-auto"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && routineType === "weekly" && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 pb-24"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Estructura Semanal</h2>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Selecciona los días de entrenamiento</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {dayFields.map((field, index) => (
                                        <div
                                            key={field.id}
                                            className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex justify-between items-center group hover:bg-neutral-900/60 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-neutral-950 border border-white/10 flex items-center justify-center text-xs font-black text-neutral-500 group-hover:text-red-500 transition-colors">
                                                    {String(index + 1).padStart(2, '0')}
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-neutral-700 italic">{WEEKDAYS[index] || "DÍA"}</p>
                                                    <input 
                                                        value={schedule[index]?.name || ""}
                                                        onChange={(e) => {
                                                            const newSched = [...schedule];
                                                            newSched[index].name = e.target.value;
                                                            setValue("schedule", newSched);
                                                        }}
                                                        className="bg-transparent border-none p-0 text-sm font-black text-white focus:ring-0 uppercase italic tracking-widest w-full"
                                                        placeholder="Nombre del día..."
                                                    />
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-neutral-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl"
                                                onClick={() => removeDay(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    
                                    {dayFields.length < 7 && (
                                        <Button
                                            variant="outline"
                                            className="h-full min-h-[80px] border-dashed border-white/5 bg-transparent rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all text-neutral-600 hover:text-white"
                                            onClick={() => appendDay({ name: WEEKDAYS[dayFields.length] || `Día ${dayFields.length + 1}`, exercises: [] })}
                                        >
                                            <Plus className="w-5 h-5" />
                                            <span className="text-[9px] font-black uppercase tracking-widest">Añadir Día</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 pb-32"
                        >
                            {/* Day Navigation Tabs for Weekly */}
                            {routineType === "weekly" && (
                                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sticky top-0 bg-black/50 backdrop-blur-md z-10 py-4">
                                    {schedule.map((day: ScheduleDay, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActiveDayIndex(idx)}
                                            className={cn(
                                                "px-6 py-3 rounded-full text-[10px] font-black uppercase italic tracking-widest transition-all whitespace-nowrap border shrink-0",
                                                activeDayIndex === idx 
                                                    ? "bg-white text-black border-white shadow-xl shadow-white/5" 
                                                    : "bg-neutral-900/50 text-neutral-500 border-white/5 hover:bg-neutral-800"
                                            )}
                                        >
                                            {day.name || `Día ${idx + 1}`}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Exercises for Active Day */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Ejercicios</h2>
                                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Día: {schedule[activeDayIndex]?.name}</p>
                                    </div>
                                    <Button
                                        onClick={() => addExerciseToDay(activeDayIndex)}
                                        className="h-10 bg-white text-black hover:bg-neutral-200 font-black uppercase italic tracking-widest text-[9px] rounded-xl px-6"
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Añadir
                                    </Button>
                                </div>

                                {schedule[activeDayIndex]?.exercises?.length === 0 ? (
                                    <div className="py-20 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center opacity-40 gap-4">
                                        <Dumbbell className="w-12 h-12 text-neutral-600" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white italic">No hay ejercicios aún</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {schedule[activeDayIndex]?.exercises?.map((exercise: ScheduleExercise, exIdx: number) => (
                                            <div 
                                                key={exIdx} 
                                                className="bg-neutral-950 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative"
                                            >
                                                {/* Card Header Compact */}
                                                <div className="p-4 bg-white/2 border-b border-white/5 flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 rounded-xl bg-black border border-white/5 flex items-center justify-center text-[10px] font-black text-red-500 shadow-inner">
                                                            {String(exIdx + 1).padStart(2, '0')}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            className="text-xs font-black text-white hover:bg-white/5 p-0 h-auto justify-start uppercase italic tracking-widest truncate max-w-[180px]"
                                                            onClick={() => openExerciseSelector(activeDayIndex, exIdx)}
                                                        >
                                                            {exercise.exerciseName || "SELECCIONAR..."}
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-neutral-700 hover:text-white"
                                                            onClick={() => {
                                                                if (exIdx > 0) {
                                                                    const newExs = [...schedule[activeDayIndex].exercises];
                                                                    [newExs[exIdx - 1], newExs[exIdx]] = [newExs[exIdx], newExs[exIdx - 1]];
                                                                    updateDayExercises(activeDayIndex, newExs);
                                                                }
                                                            }}
                                                            disabled={exIdx === 0}
                                                        >
                                                            <ChevronUp className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-neutral-700 hover:text-white"
                                                            onClick={() => {
                                                                if (exIdx < schedule[activeDayIndex].exercises.length - 1) {
                                                                    const newExs = [...schedule[activeDayIndex].exercises];
                                                                    [newExs[exIdx], newExs[exIdx + 1]] = [newExs[exIdx + 1], newExs[exIdx]];
                                                                    updateDayExercises(activeDayIndex, newExs);
                                                                }
                                                            }}
                                                            disabled={exIdx === schedule[activeDayIndex].exercises.length - 1}
                                                        >
                                                            <ChevronDown className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-neutral-700 hover:text-red-500"
                                                            onClick={() => removeExercise(activeDayIndex, exIdx)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Compact Sets List */}
                                                <div className="p-4 space-y-3">
                                                    {exercise.sets?.map((set, sIdx) => (
                                                        <div key={sIdx} className="grid grid-cols-12 gap-2 items-center">
                                                            <div className="col-span-1 text-[8px] font-black text-neutral-700 text-center">{sIdx + 1}</div>
                                                            <div className="col-span-4">
                                                                <Select
                                                                    value={set.type}
                                                                    onValueChange={(v) => {
                                                                        const newSets = [...exercise.sets];
                                                                        newSets[sIdx].type = v;
                                                                        updateExerciseField(activeDayIndex, exIdx, "sets", newSets);
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-9 text-[9px] font-black uppercase italic bg-black border-white/5 text-white rounded-lg px-2">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                                                        <SelectItem value="warmup" className="text-[9px] font-black uppercase italic">Calent.</SelectItem>
                                                                        <SelectItem value="working" className="text-[9px] font-black uppercase italic">Efect.</SelectItem>
                                                                        <SelectItem value="failure" className="text-[9px] font-black uppercase italic">Fallo</SelectItem>
                                                                        <SelectItem value="drop" className="text-[9px] font-black uppercase italic">Drop</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="col-span-3">
                                                                <Input
                                                                    value={set.reps}
                                                                    onChange={(e) => {
                                                                        const newSets = [...exercise.sets];
                                                                        newSets[sIdx].reps = e.target.value;
                                                                        updateExerciseField(activeDayIndex, exIdx, "sets", newSets);
                                                                    }}
                                                                    placeholder="Reps"
                                                                    className="h-9 text-[10px] font-black italic bg-black border-white/5 text-center text-white rounded-lg px-0"
                                                                />
                                                            </div>
                                                            <div className="col-span-2">
                                                                <Input
                                                                    type="number"
                                                                    value={set.rpeTarget}
                                                                    onChange={(e) => {
                                                                        const newSets = [...exercise.sets];
                                                                        newSets[sIdx].rpeTarget = Number(e.target.value);
                                                                        updateExerciseField(activeDayIndex, exIdx, "sets", newSets);
                                                                    }}
                                                                    placeholder="RPE"
                                                                    className="h-9 text-[10px] font-black italic bg-black border-white/5 text-center text-white rounded-lg px-0"
                                                                />
                                                            </div>
                                                            <div className="col-span-2 flex justify-end">
                                                                <button 
                                                                    onClick={() => {
                                                                        const newSets = [...exercise.sets];
                                                                        newSets.splice(sIdx, 1);
                                                                        updateExerciseField(activeDayIndex, exIdx, "sets", newSets);
                                                                    }}
                                                                    className="text-neutral-700 hover:text-red-500 transition-colors"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            const newSets = [...exercise.sets, { type: "working", reps: "8-12", rpeTarget: 8, restSeconds: 90 }];
                                                            updateExerciseField(activeDayIndex, exIdx, "sets", newSets);
                                                        }}
                                                        className="w-full h-8 text-[8px] font-black uppercase italic text-neutral-600 hover:text-white hover:bg-white/5 border border-dashed border-white/5 rounded-xl mt-2"
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" /> Añadir Serie
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8 pb-32"
                        >
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Auditoría Final</h2>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Revisión de seguridad y balance</p>
                                </div>

                                <RoutineSafetyCheck routine={watch()} athleteId={athleteId} />

                                <div className="bg-neutral-900/30 backdrop-blur-3xl border border-white/5 rounded-4xl p-8 space-y-6">
                                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest italic">Rutina</span>
                                        <span className="text-sm font-black text-white uppercase italic">{watch("name")}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest italic">Días Activos</span>
                                        <span className="text-sm font-black text-neutral-500 uppercase italic">{schedule.length} Días</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest italic">Total Ejercicios</span>
                                        <span className="text-sm font-black text-red-500 uppercase italic">
                                            {schedule.reduce((acc: number, curr: ScheduleDay) => acc + (curr.exercises?.length || 0), 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Sticky Navigation Footer */}
            <div className="fixed bottom-0 inset-x-0 bg-black/80 backdrop-blur-3xl border-t border-white/5 p-4 z-40 md:relative md:bg-transparent md:border-none md:p-10">
                <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        disabled={step === 1}
                        className={cn(
                            "h-14 px-8 rounded-2xl font-black uppercase italic tracking-widest text-[10px] border border-white/5 text-neutral-500 hover:text-white transition-all",
                            step === 1 && "opacity-0 pointer-events-none"
                        )}
                    >
                        <ChevronLeft className="w-5 h-5 mr-3" /> Atrás
                    </Button>
                    
                    {step < totalSteps ? (
                        <Button
                            onClick={nextStep}
                            className="h-14 px-10 bg-white text-black hover:bg-neutral-200 font-black uppercase italic tracking-widest text-[10px] rounded-2xl shadow-xl shadow-white/5 transition-all hover:-translate-y-1"
                        >
                            Siguiente <ChevronRight className="w-5 h-5 ml-3" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit(onSubmit)}
                            disabled={isSaving}
                            className="h-14 px-12 bg-red-600 text-white hover:bg-red-700 font-black uppercase italic tracking-widest text-[10px] rounded-2xl shadow-xl shadow-red-600/20 transition-all hover:-translate-y-1 active:scale-95"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-3" />
                            ) : (
                                <Save className="w-4 h-4 mr-3" />
                            )}
                            Finalizar Rutina
                        </Button>
                    )}
                </div>
            </div>

            <ExerciseSelector
                open={selectorOpen}
                onOpenChange={(op) => {
                    setSelectorOpen(op);
                    if (!op) setIsVariantMode(false);
                }}
                onSelect={handleExerciseSelect}
                availableExercises={sortedExercises}
                isVariantSelector={isVariantMode}
                title={isVariantMode ? "VARIANTE" : "EJERCICIO"}
            />
        </div>
    );
}
