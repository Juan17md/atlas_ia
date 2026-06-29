"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { OnboardingInputSchema } from "@/lib/schemas";
import { completeOnboarding } from "@/actions/auth-actions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { User, Target, HeartPulse, Ruler, ChevronRight, ChevronLeft, Sparkles, Check, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingProgress } from "./onboarding-progress";
import { cn } from "@/lib/utils";

type Step = "bio" | "goals" | "health" | "measurements";

const steps = [
    { id: "bio" as Step, label: "Biometría", icon: User },
    { id: "goals" as Step, label: "Objetivos", icon: Target },
    { id: "health" as Step, label: "Salud", icon: HeartPulse },
    { id: "measurements" as Step, label: "Medidas", icon: Ruler },
];

export function OnboardingWizard() {
    const [currentStep, setCurrentStep] = useState<Step>("bio");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { update } = useSession();

    const form = useForm<z.infer<typeof OnboardingInputSchema>>({
        resolver: zodResolver(OnboardingInputSchema) as any,
        defaultValues: {
            age: 25,
            gender: "male",
            weight: 70,
            height: 170,
            experienceLevel: "beginner",
            goal: "hypertrophy",
            availableDays: 5,
            injuries: [],
            medicalConditions: [],
            measurements: {},
        },
    });

    const { register, handleSubmit, setValue, trigger, control, formState: { errors } } = form;

    const gender = useWatch({ control, name: "gender" });
    const experienceLevel = useWatch({ control, name: "experienceLevel" });
    const goal = useWatch({ control, name: "goal" });
    const availableDays = useWatch({ control, name: "availableDays" });
    const injuries = useWatch({ control, name: "injuries" });
    const medicalConditions = useWatch({ control, name: "medicalConditions" });

    const nextStep = async () => {
        if (currentStep === "bio") {
            const valid = await trigger(["age", "weight", "height", "gender"]);
            if (valid) setCurrentStep("goals");
        } else if (currentStep === "goals") {
            const valid = await trigger(["experienceLevel", "goal", "availableDays"]);
            if (valid) setCurrentStep("health");
        } else if (currentStep === "health") {
            const valid = await trigger(["injuries", "medicalConditions"]);
            if (valid) setCurrentStep("measurements");
        }
    };

    const prevStep = () => {
        if (currentStep === "goals") setCurrentStep("bio");
        if (currentStep === "health") setCurrentStep("goals");
        if (currentStep === "measurements") setCurrentStep("health");
    };

    const onSubmit = async (data: z.infer<typeof OnboardingInputSchema>) => {
        if (currentStep !== "measurements") {
            nextStep();
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await completeOnboarding(data);
            if (result.success) {
                toast.success("Perfil configurado exitosamente");
                await update({ onboardingCompleted: true });
                router.push("/dashboard");
                router.refresh();
            } else {
                toast.error(result.error || "Error al guardar datos");
            }
        } catch {
            toast.error("Error al completar onboarding");
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasInjuries = injuries && injuries.length > 0;
    const hasConditions = medicalConditions && medicalConditions.length > 0;

    return (
        <div className="w-full max-w-4xl mx-auto">
            <OnboardingProgress currentStep={currentStep} />

            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="relative min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {currentStep === "bio" && (
                            <motion.div key="bio" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">
                                <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                                            <User className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black uppercase tracking-wider text-sm">Datos Biométricos</h3>
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Tu perfil físico base</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Edad</Label>
                                            <Input type="number" {...register("age", { valueAsNumber: true })} className="h-12 rounded-xl bg-black/40 border-white/5 text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Altura (cm)</Label>
                                            <Input type="number" {...register("height", { valueAsNumber: true })} className="h-12 rounded-xl bg-black/40 border-white/5 text-white" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Peso (kg)</Label>
                                            <Input type="number" step="0.1" {...register("weight", { valueAsNumber: true })} className="h-12 rounded-xl bg-black/40 border-white/5 text-white" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Género</Label>
                                            <Select value={gender} onValueChange={(v) => setValue("gender", v as any)}>
                                                <SelectTrigger className="h-12 rounded-xl bg-black/40 border-white/5 text-white capitalize">
                                                    <SelectValue placeholder="Seleccionar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Masculino</SelectItem>
                                                    <SelectItem value="female">Femenino</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === "goals" && (
                            <motion.div key="goals" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">
                                <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                                            <Target className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black uppercase tracking-wider text-sm">Objetivos de Entrenamiento</h3>
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Define tu meta y experiencia</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Nivel de experiencia</Label>
                                        <Select value={experienceLevel} onValueChange={(v) => setValue("experienceLevel", v as any)}>
                                            <SelectTrigger className="h-12 rounded-xl bg-black/40 border-white/5 text-white capitalize">
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="beginner">Principiante</SelectItem>
                                                <SelectItem value="intermediate">Intermedio</SelectItem>
                                                <SelectItem value="advanced">Avanzado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Objetivo principal</Label>
                                        <Select value={goal} onValueChange={(v) => setValue("goal", v as any)}>
                                            <SelectTrigger className="h-12 rounded-xl bg-black/40 border-white/5 text-white capitalize">
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="hypertrophy">Hipertrofia</SelectItem>
                                                <SelectItem value="strength">Fuerza</SelectItem>
                                                <SelectItem value="endurance">Resistencia</SelectItem>
                                                <SelectItem value="fat-loss">Pérdida de Grasa</SelectItem>
                                                <SelectItem value="general">Mantenimiento</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Días disponibles por semana</Label>
                                        <Select value={String(availableDays)} onValueChange={(v) => setValue("availableDays", parseInt(v))}>
                                            <SelectTrigger className="h-12 rounded-xl bg-black/40 border-white/5 text-white">
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[2, 3, 4, 5, 6, 7].map((d) => (
                                                    <SelectItem key={d} value={String(d)}>{d} días</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === "health" && (
                            <motion.div key="health" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">
                                <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                                            <HeartPulse className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black uppercase tracking-wider text-sm">Salud y Lesiones</h3>
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Información clínica relevante</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">¿Tienes alguna lesión?</Label>
                                        <div className="flex items-center gap-4">
                                            {[{ value: true, label: "Sí" }, { value: false, label: "No" }].map((opt) => (
                                                <Button
                                                    key={String(opt.value)}
                                                    type="button"
                                                    variant={hasInjuries === opt.value ? "default" : "outline"}
                                                    onClick={() => setValue("injuries", opt.value ? [""] : [])}
                                                    className="flex-1 h-12 rounded-xl"
                                                >
                                                    {opt.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {hasInjuries && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Describe tus lesiones</Label>
                                                <Input {...register("injuries.0")} placeholder="Ej: Lumbalgia, tendinitis..." className="h-12 rounded-xl bg-black/40 border-white/5 text-white mt-2" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">¿Condiciones médicas?</Label>
                                        <div className="flex items-center gap-4">
                                            {[{ value: true, label: "Sí" }, { value: false, label: "No" }].map((opt) => (
                                                <Button
                                                    key={String(opt.value)}
                                                    type="button"
                                                    variant={hasConditions === opt.value ? "default" : "outline"}
                                                    onClick={() => setValue("medicalConditions", opt.value ? [""] : [])}
                                                    className="flex-1 h-12 rounded-xl"
                                                >
                                                    {opt.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {hasConditions && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Describe tus condiciones</Label>
                                                <Input {...register("medicalConditions.0")} placeholder="Ej: Asma, diabetes..." className="h-12 rounded-xl bg-black/40 border-white/5 text-white mt-2" />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === "measurements" && (
                            <motion.div key="measurements" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">
                                <div className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-8 space-y-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                                            <Ruler className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-black uppercase tracking-wider text-sm">Medidas Corporales</h3>
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Opcional, puedes saltarlo</p>
                                        </div>
                                    </div>
                                    <div className="text-neutral-400 text-xs font-medium leading-relaxed text-center">Puedes completar tus medidas más tarde desde el perfil.</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center justify-between mt-8">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={prevStep}
                        disabled={currentStep === "bio" || isSubmitting}
                        className="h-14 rounded-2xl text-neutral-500 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] px-6 border border-white/5"
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" /> Atrás
                    </Button>

                    {currentStep === "measurements" ? (
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px] px-8"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 animate-spin" /> Configurando...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Check className="w-4 h-4" /> Completar
                                </span>
                            )}
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={nextStep}
                            className="h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-[10px] px-8"
                        >
                            <span className="flex items-center gap-2">
                                Siguiente <ChevronRight className="w-4 h-4" />
                            </span>
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
}
