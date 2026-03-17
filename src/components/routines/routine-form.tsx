"use client";

import { useForm, useFieldArray, Control, UseFormRegister, FieldValues, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RoutineSchema } from "@/lib/schemas";
import { createRoutine } from "@/actions/routine-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Asumimos shadcn textarea o usamos input
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { ExerciseSelector } from "./exercise-selector";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AIGeneratorDialog } from "@/components/routines/ai-generator-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Modificar schema para formulario local si es necesario, 
// o usar RoutineSchema.omit(...) como base.
const FormSchema = RoutineSchema.omit({
    id: true,
    coachId: true,
    createdAt: true,
    updatedAt: true
});

type FormValues = z.infer<typeof FormSchema>;

// Tipos para los ejercicios del formulario
interface ExerciseField {
    id: string;
    exerciseName: string;
    exerciseId?: string;
    order: number;
    sets: Array<{ type: string; reps: string; rpeTarget?: number; restSeconds?: number }>;
}

// Subcomponente para manejar lógica de ejercicios dentro de un día
// TODO: Tipar correctamente cuando se refactorice el formulario
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DayExercises({ dayIndex, control, register }: { dayIndex: number; control: any; register: any }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `schedule.${dayIndex}.exercises`
    });

    const [selectorOpen, setSelectorOpen] = useState(false);

    return (
        <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Ejercicios del día</h4>
                <div className="w-[250px]">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setSelectorOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Añadir Ejercicio
                    </Button>
                    <ExerciseSelector
                        open={selectorOpen}
                        onOpenChange={setSelectorOpen}
                        availableExercises={[]}
                        onSelect={(exercise) => {
                            append({
                                exerciseId: exercise.id,
                                exerciseName: exercise.name,
                                order: fields.length,
                                sets: [{ type: "working", reps: "10", restSeconds: 60 }]
                            });
                        }}
                    />
                </div>
            </div>

            {fields.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                    Agrega ejercicios usando el buscador.
                </div>
            )}

            <div className="space-y-4">
                {fields.map((item, index) => (
                    <div key={item.id} className="border rounded-md p-3 bg-card/50">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">{index + 1}</Badge>
                                <span className="font-semibold">{(item as ExerciseField).exerciseName}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>

                        {/* Aquí iría la gestión de Series (Sets) usando otro useFieldArray anidado */}
                        {/* Simplificación MVP: Input para sets en texto plano o fijo */}
                        {/* Para hacerlo bien, necesitamos otro componente anidado 'ExerciseSets' */}
                        <ExerciseSets
                            nestIndex={`schedule.${dayIndex}.exercises.${index}.sets`}
                            control={control}
                            register={register}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ExerciseSets({ nestIndex, control, register }: { nestIndex: string; control: any; register: any }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: nestIndex
    });

    return (
        <div className="pl-4 border-l-2 border-muted ml-1 space-y-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground mb-1">
                <div className="col-span-3">Tipo</div>
                <div className="col-span-3">Reps</div>
                <div className="col-span-3">RPE</div>
                <div className="col-span-2">Descanso (s)</div>
                <div className="col-span-1"></div>
            </div>
            {fields.map((item, k) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-3">
                        <select {...register(`${nestIndex}.${k}.type`)} className="w-full text-sm md:text-xs h-14 md:h-10 px-2 border border-white/10 rounded-xl bg-neutral-900 focus:ring-1 focus:ring-red-500">
                            <option value="warmup">Calentamiento</option>
                            <option value="working">Efectiva</option>
                            <option value="failure">Fallo</option>
                            <option value="drop">Drop Set</option>
                        </select>
                    </div>
                    <div className="col-span-3">
                        <Input inputMode="numeric" {...register(`${nestIndex}.${k}.reps`)} className="h-14 md:h-10 text-sm md:text-xs text-center rounded-xl bg-neutral-900 border-white/10" placeholder="10" />
                    </div>
                    <div className="col-span-3">
                        <Controller
                            control={control}
                            name={`${nestIndex}.${k}.rpeTarget`}
                            render={({ field }) => (
                                <Select
                                    onValueChange={(val) => field.onChange(Number(val))}
                                    value={field.value?.toString()}
                                >
                                    <SelectTrigger className="h-14 md:h-10 text-sm md:text-xs w-full [&>svg]:hidden px-1 justify-center text-center rounded-xl bg-neutral-900 border-white/10">
                                        <SelectValue placeholder="8" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white min-w-[60px] rounded-2xl">
                                        {[10, 9, 8, 7, 6, 5].map((val) => (
                                            <SelectItem key={val} value={val.toString()} className="justify-center focus:bg-red-600 focus:text-white py-3">
                                                {val}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>
                    <div className="col-span-2">
                        <Input inputMode="numeric" {...register(`${nestIndex}.${k}.restSeconds`, { valueAsNumber: true })} className="h-14 md:h-10 text-sm md:text-xs text-center rounded-xl bg-neutral-900 border-white/10" placeholder="60" type="number" />
                    </div>
                    <div className="col-span-1 text-right flex items-center justify-end">
                        <Button variant="ghost" size="icon" className="h-14 w-10 md:h-10 hover:bg-red-500/20 hover:text-red-500 rounded-xl" onClick={() => remove(k)}>
                            <Trash2 className="h-4 w-4 md:h-3 md:w-3" />
                        </Button>
                    </div>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                className="w-full h-14 md:h-12 text-sm border-dashed border-white/20 hover:border-white/40 hover:bg-white/5 rounded-xl mt-4 text-neutral-400 font-bold tracking-widest uppercase transition-all"
                onClick={() => append({ type: "working", reps: "10-12", rpeTarget: 8, restSeconds: 60 })}
            >
                <Plus className="h-4 w-4 mr-2" /> Añadir Serie
            </Button>
        </div>
    )
}


export function RoutineForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, control, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(FormSchema) as any,
        defaultValues: {
            name: "",
            description: "",
            active: true,
            athleteId: "generic", // TODO: Selector de atleta real
            schedule: [
                { name: "Día 1", exercises: [] }
            ]
        }
    });

    const { fields: dayFields, append: appendDay, remove: removeDay, replace: replaceDay } = useFieldArray({
        control,
        name: "schedule"
    });

    const onSubmit = async (data: FormValues) => {
        setIsSubmitting(true);
        try {
            const result = await createRoutine(data as unknown as Parameters<typeof createRoutine>[0]);
            if (result.success) {
                toast.success("Rutina creada exitosamente");
                router.push("/routines");
                router.refresh();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error inesperado");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-1">Nombre de Rutina</Label>
                    <Input id="name" {...register("name")} placeholder="Ej: Hipertrofia 4 Días" className="h-14 rounded-2xl bg-neutral-900 border-white/5 text-base" />
                    {errors.name && <p className="text-[10px] uppercase font-black tracking-widest text-red-500 ml-1">{errors.name.message}</p>}
                </div>
                <div className="space-y-3">
                    <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-neutral-400 ml-1">Descripción</Label>
                    <Input id="description" {...register("description")} placeholder="Objetivo principal..." className="h-14 rounded-2xl bg-neutral-900 border-white/5 text-base" />
                </div>
                {/* TODO: Selector de Atleta aquí */}
                <input type="hidden" {...register("athleteId")} value="temp-id" />
            </div>

            <Separator />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Planificación Semanal</h3>
                    <div className="flex gap-2">
                        <AIGeneratorDialog onGenerate={(schedule) => {
                            // Reemplazamos todos los fields con la data generada (con IDs nuevos para keys de react)
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const scheduleWithIds = schedule.map((day: any) => ({
                                ...day,
                                id: crypto.randomUUID(),
                                // Asegurar que exercises tengan estructura correcta si faltara algo
                            }));
                            // replace(scheduleWithIds); // replace no está expuesto por este destructuring, usaremos setValue o modificamos el hook
                            // Como no extrajimos 'replace' de useFieldArray, podemos usar setValue del form
                            // Pero mejor extraigamos replace arriba
                            replaceDay(scheduleWithIds);
                        }} />
                        <Button type="button" onClick={() => appendDay({ id: crypto.randomUUID(), name: `Día ${dayFields.length + 1}`, exercises: [] })} variant="secondary" className="h-12 rounded-xl text-xs font-black uppercase tracking-widest">
                            <Plus className="mr-2 h-4 w-4" /> Añadir Día
                        </Button>
                    </div>
                </div>

                <Accordion type="multiple" className="w-full" defaultValue={dayFields.map(d => d.id)}>
                    {dayFields.map((field, index) => (
                        <AccordionItem key={field.id} value={field.id}>
                            <AccordionTrigger className="hover://no-underline px-4 bg-muted/20 rounded-t-md">
                                <div className="flex items-center gap-4 w-full">
                                    <span className="font-semibold">Día {index + 1}</span>
                                    <Input
                                        {...register(`schedule.${index}.name`)}
                                        className="h-12 md:h-10 w-[200px] bg-neutral-900 border-white/10 rounded-xl"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="ml-auto mr-4 flex items-center" onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => removeDay(index)}
                                        >
                                            Eliminar Día
                                        </Button>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 border border-t-0 rounded-b-md">
                                <DayExercises dayIndex={index} control={control as Control<FormValues>} register={register} />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>

            <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="ghost" onClick={() => router.back()} className="h-14 rounded-2xl hover:bg-white/5 font-black uppercase tracking-widest text-xs px-6">Cancelar</Button>
                <Button type="submit" disabled={isSubmitting} className="h-14 rounded-2xl font-black uppercase tracking-widest text-xs px-8 bg-white text-black hover:bg-neutral-200">
                    {isSubmitting ? "Guardando..." : "Crear Rutina"}
                </Button>
            </div>
        </form>
    );
}
