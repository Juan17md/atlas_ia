"use client";

import { useState, ReactNode, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { logBodyMeasurements, updateBodyMeasurement } from "@/actions/measurement-actions";
import { LoaderPremium } from "@/components/ui/loader-premium";

const LogSchema = z.object({
    date: z.string(),
    weight: z.coerce.number().optional(),
    chest: z.coerce.number().optional(),
    waist: z.coerce.number().optional(),
    hips: z.coerce.number().optional(),
    shoulders: z.coerce.number().optional(),
    neck: z.coerce.number().optional(),
    glutes: z.coerce.number().optional(),
    abdomen: z.coerce.number().optional(),

    bicepsLeft: z.coerce.number().optional(),
    bicepsRight: z.coerce.number().optional(),
    forearmsLeft: z.coerce.number().optional(),
    forearmsRight: z.coerce.number().optional(),
    quadsLeft: z.coerce.number().optional(),
    quadsRight: z.coerce.number().optional(),
    calvesLeft: z.coerce.number().optional(),
    calvesRight: z.coerce.number().optional(),

    notes: z.string().optional(),
});

interface LogMeasurementDialogProps {
    onLogSuccess?: () => void;
    children?: ReactNode;
    initialData?: Record<string, any>;
    initialWeight?: number;
    initialDate?: string;
    initialNotes?: string;
    targetUserId?: string;
    isEdit?: boolean;
    measurementId?: string;
}

export function LogMeasurementDialog({ 
    onLogSuccess, 
    children, 
    initialData, 
    initialWeight, 
    initialDate,
    initialNotes,
    targetUserId,
    isEdit = false,
    measurementId
}: LogMeasurementDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof LogSchema>>({
        resolver: zodResolver(LogSchema) as any,
        defaultValues: {
            date: initialDate || new Date().toISOString().split('T')[0],
            weight: initialWeight,
            notes: initialNotes || "",
            ...initialData
        }
    });

    // Actualizar valores del formulario cuando se abre el diálogo para asegurar datos frescos
    useEffect(() => {
        if (open) {
            form.reset({
                date: initialDate || new Date().toISOString().split('T')[0],
                weight: initialWeight,
                notes: initialNotes || "",
                ...initialData,
            });
        }
    }, [open, initialData, initialWeight, initialDate, initialNotes, form]);

    const onSubmit = async (data: z.infer<typeof LogSchema>) => {
        setIsSubmitting(true);
        try {
            const result = isEdit && measurementId 
                ? await updateBodyMeasurement(measurementId, targetUserId || "", data)
                : await logBodyMeasurements(data, targetUserId);

            if (result.success) {
                toast.success(isEdit ? "Registro actualizado" : "Medidas registradas correctamente");
                setOpen(false);
                if (onLogSuccess) onLogSuccess();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Error al procesar la solicitud");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Componente interno para campos de medida con incrementos/decrementos
    const MeasurementField = ({ 
        name, 
        label, 
        placeholder = "0", 
        suffix = "cm", 
        step = 0.5,
        className = ""
    }: { 
        name: keyof z.infer<typeof LogSchema>, 
        label?: string, 
        placeholder?: string, 
        suffix?: string, 
        step?: number,
        className?: string
    }) => {
        const value = form.watch(name);
        
        const adjust = (amount: number) => {
            const current = parseFloat(String(value || 0).replace(",", "."));
            const next = Math.round((current + amount) * 10) / 10;
            form.setValue(name, next.toString() as any, { shouldDirty: true, shouldValidate: true });
        };

        return (
            <div className={`space-y-2 ${className}`}>
                {label && <Label className="text-xs font-medium text-neutral-400 pl-1 uppercase">{label}</Label>}
                <div className="relative group">
                    <button 
                        type="button"
                        onClick={() => adjust(-step)}
                        className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-neutral-600 hover:text-red-500 hover:bg-white/5 rounded-lg transition-all z-20"
                    >
                        <Minus className="w-3 h-3" />
                    </button>
                    
                    <Input
                        type="text"
                        inputMode="decimal"
                        {...form.register(name, { 
                            onChange: (e) => { e.target.value = e.target.value.replace(",", "."); } 
                        })}
                        className="bg-neutral-950 border-white/5 focus:border-red-500/50 h-14 text-sm text-center text-white placeholder:text-neutral-700 rounded-xl px-10 transition-all group-hover:border-white/10"
                        placeholder={placeholder}
                    />

                    <button 
                        type="button"
                        onClick={() => adjust(step)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-neutral-600 hover:text-red-500 hover:bg-white/5 rounded-lg transition-all z-20"
                    >
                        <Plus className="w-3 h-3" />
                    </button>

                    {suffix && (
                        <span className="absolute right-10 top-1/2 -translate-y-1/2 text-[8px] font-black text-neutral-700 uppercase tracking-widest pointer-events-none group-hover:text-neutral-600 transition-colors">
                            {suffix}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children ? children : (
                    <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 w-full md:w-auto">
                        <Plus className="w-4 h-4" /> Registrar Medidas
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Editar Registro de Medidas" : "Registrar Progreso Corporal"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pt-4 overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-neutral-800">

                    {/* General */}
                    <div className="bg-neutral-950/30 p-5 rounded-2xl border border-neutral-800/50 space-y-5">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest pl-1">Fecha</Label>
                                <Input type="date" {...form.register("date")} className="bg-neutral-950 border-white/5 focus:border-red-500/50 h-14 text-sm text-white placeholder:text-neutral-500 rounded-xl px-4" />
                            </div>
                            <MeasurementField 
                                name="weight" 
                                label="Peso" 
                                suffix="kg" 
                                step={0.1} 
                                placeholder="0.0" 
                            />
                        </div>
                    </div>

                    {/* Torso */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 pb-2 border-b border-neutral-800">
                            <div className="w-1 h-5 bg-linear-to-b from-red-500 to-red-800 rounded-full"></div>
                            <h4 className="text-base font-bold text-white uppercase tracking-wider">Torso</h4>
                            <span className="text-xs text-neutral-500 font-normal ml-auto">En centímetros</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                            <MeasurementField name="neck" label="Cuello" />
                            <MeasurementField name="chest" label="Pecho / Espalda" />
                            <MeasurementField name="shoulders" label="Hombros" />
                            <MeasurementField name="waist" label="Cintura" />
                            <MeasurementField name="hips" label="Cadera" />
                            <MeasurementField name="glutes" label="Glúteos" />
                            <MeasurementField name="abdomen" label="Abdomen" className="col-span-1" />
                        </div>
                    </div>

                    {/* Extremidades */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 pb-2 border-b border-neutral-800">
                            <div className="w-1 h-5 bg-linear-to-b from-red-500 to-red-800 rounded-full"></div>
                            <h4 className="text-base font-bold text-white uppercase tracking-wider">Extremidades</h4>
                            <span className="text-xs text-neutral-500 font-normal ml-auto">Izq / Der (cm)</span>
                        </div>

                        <div className="space-y-1">
                            <div className="grid grid-cols-12 gap-4 text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-3 text-center px-1">
                                <div className="col-span-4 text-left">Zona Muscular</div>
                                <div className="col-span-4">Izquierda</div>
                                <div className="col-span-4">Derecha</div>
                            </div>

                            <div className="space-y-3">
                                {/* Row Biceps */}
                                <div className="grid grid-cols-12 gap-4 items-center group hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                                    <Label className="col-span-4 text-sm font-bold text-neutral-300 uppercase tracking-wide">Bíceps</Label>
                                    <MeasurementField name="bicepsLeft" className="col-span-4" label="" />
                                    <MeasurementField name="bicepsRight" className="col-span-4" label="" />
                                </div>
                                <div className="grid grid-cols-12 gap-4 items-center group hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                                    <Label className="col-span-4 text-sm font-bold text-neutral-300 uppercase tracking-wide">Antebrazos</Label>
                                    <MeasurementField name="forearmsLeft" className="col-span-4" label="" />
                                    <MeasurementField name="forearmsRight" className="col-span-4" label="" />
                                </div>
                                <div className="grid grid-cols-12 gap-4 items-center group hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                                    <Label className="col-span-4 text-sm font-bold text-neutral-300 uppercase tracking-wide">Cuádriceps</Label>
                                    <MeasurementField name="quadsLeft" className="col-span-4" label="" />
                                    <MeasurementField name="quadsRight" className="col-span-4" label="" />
                                </div>
                                <div className="grid grid-cols-12 gap-4 items-center group hover:bg-white/5 p-2 rounded-lg transition-colors -mx-2">
                                    <Label className="col-span-4 text-sm font-bold text-neutral-300 uppercase tracking-wide">Pantorrillas</Label>
                                    <MeasurementField name="calvesLeft" className="col-span-4" label="" />
                                    <MeasurementField name="calvesRight" className="col-span-4" label="" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-neutral-800">
                        <Label className="text-xs font-bold text-neutral-500 uppercase">Notas Adicionales</Label>
                        <Input {...form.register("notes")} className="bg-neutral-950 border-white/5 focus:border-red-500/50 h-14 rounded-xl text-sm text-white placeholder:text-neutral-700" placeholder="Ej: En ayunas, post-entreno..." />
                    </div>

                    <div className="flex justify-center pt-4 pb-2">
                        <Button type="submit" disabled={isSubmitting} className="bg-white text-black hover:bg-neutral-300 w-full md:w-auto font-black rounded-2xl px-12 h-14 text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-white/10 hover:scale-105 transition-all">
                            {isSubmitting ? <LoaderPremium size="sm" /> : (isEdit ? "Actualizar Registro" : "Guardar Registro")}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
