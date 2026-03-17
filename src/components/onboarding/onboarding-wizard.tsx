"use client";

import { useState } from "react";
import { useForm, Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { OnboardingInputSchema } from "@/lib/schemas";
import { completeOnboarding } from "@/actions/auth-actions";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, Activity, HeartPulse, User, Ruler, Target, Lock, LogOut, Eye, EyeOff, ShieldCheck, type LucideIcon } from "lucide-react";
import { LoaderPremium } from "@/components/ui/loader-premium";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Step = "bio" | "goals" | "health" | "measurements" | "security";

const steps: { id: Step; label: string; icon: LucideIcon }[] = [
    { id: "bio", label: "Biometría", icon: User },
    { id: "goals", label: "Objetivos", icon: Target },
    { id: "health", label: "Salud", icon: HeartPulse },
    { id: "measurements", label: "Medidas", icon: Ruler },
    { id: "security", label: "Seguridad", icon: Lock },
];

// Props del componente - recibe el proveedor de autenticación para decidir si la contraseña es obligatoria
interface OnboardingWizardProps {
    authProvider: "google" | "password";
}

export function OnboardingWizard({ authProvider }: OnboardingWizardProps) {
    // Si el usuario entró con email/password ya tiene contraseña → no necesita el paso de seguridad
    const isGoogleUser = authProvider === "google";
    const activeSteps = isGoogleUser
        ? steps
        : steps.filter((s) => s.id !== "security");

    const [currentStep, setCurrentStep] = useState<Step>("bio");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();
    const { data: session, update } = useSession();

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
            password: "",
            confirmPassword: "",
        },
    });

    const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = form;
    const formData = watch();

    const nextStep = async () => {
        let isValid = false;

        // Validar paso actual antes de avanzar
        if (currentStep === "bio") {
            isValid = await trigger(["age", "weight", "height", "gender"]);
            if (isValid) setCurrentStep("goals");
        } else if (currentStep === "goals") {
            isValid = await trigger(["experienceLevel", "goal", "availableDays"]);
            if (isValid) setCurrentStep("health");
        } else if (currentStep === "health") {
            isValid = await trigger(["injuries", "medicalConditions"]);
            if (isValid) setCurrentStep("measurements");
        } else if (currentStep === "measurements") {
            isValid = await trigger(["measurements"]);
            // Si es usuario Google, avanzar a seguridad; si no, el formulario se envía directamente
            if (isValid) {
                if (isGoogleUser) {
                    setCurrentStep("security");
                }
                // Si no es Google, el botón ya será "submit" → se maneja en el form
            }
        }
    };

    const prevStep = () => {
        if (currentStep === "goals") setCurrentStep("bio");
        if (currentStep === "health") setCurrentStep("goals");
        if (currentStep === "measurements") setCurrentStep("health");
        if (currentStep === "security") setCurrentStep("measurements");
    };

    const onSubmit = async (data: z.infer<typeof OnboardingInputSchema>) => {
        // Prevención de submit implícito al pulsar Enter en pasos intermedios
        const isFinalStep = (isGoogleUser && currentStep === "security") || (!isGoogleUser && currentStep === "measurements");
        
        if (!isFinalStep) {
            // Avanzar de paso si se pulsa Enter y la validación general pasa
            nextStep();
            return;
        }

        // Validación adicional: si es usuario Google, la contraseña es OBLIGATORIA
        if (isGoogleUser) {
            if (!data.password || data.password.length < 6) {
                form.setError("password", {
                    type: "manual",
                    message: "Debes crear una contraseña de al menos 6 caracteres para acceder desde cualquier dispositivo.",
                });
                // Asegurar que estamos en el paso de seguridad
                if (currentStep !== "security") setCurrentStep("security");
                return;
            }
            if (data.password !== data.confirmPassword) {
                form.setError("confirmPassword", {
                    type: "manual",
                    message: "Las contraseñas no coinciden.",
                });
                if (currentStep !== "security") setCurrentStep("security");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const result = await completeOnboarding(data);
            if (result.success) {
                // Actualizar sesión del lado del cliente
                await update({ onboardingCompleted: true });

                toast.success("¡Perfil completado con éxito!");
                router.refresh();
                router.push("/"); // Redirigir al Dashboard
            } else {
                toast.error(result.error || "Hubo un error al guardar los datos.");
            }
        } catch (error) {
            toast.error("Error inesperado.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Body Map Helper for Injuries (Simplificado)
    const toggleInjury = (injury: string) => {
        const currentInjuries = formData.injuries || [];
        if (currentInjuries.includes(injury)) {
            setValue("injuries", currentInjuries.filter((i) => i !== injury));
        } else {
            setValue("injuries", [...currentInjuries, injury]);
        }
    };

    return (
        <div className="w-full max-w-3xl mx-auto space-y-6">
            {/* Header con Identidad y Salida */}
            <div className="flex justify-between items-center gap-4 px-1 md:px-0">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-red-600/10 shrink-0 flex items-center justify-center border border-red-500/20 glass">
                        <User className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[8px] md:text-[10px] text-neutral-500 uppercase font-black tracking-widest leading-none mb-1">Registro de Usuario</span>
                        <span className="text-xs md:text-sm font-bold text-white leading-none truncate block">{session?.user?.email || "Cargando..."}</span>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-xl px-2 md:px-4 h-8 md:h-10 border border-neutral-800 shrink-0"
                >
                    <LogOut className="w-3.5 h-3.5 mr-1 md:mr-2" />
                    <span className="text-[10px] md:text-sm font-bold uppercase">Salir</span>
                </Button>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between mb-2">
                    {steps.map((step, index) => {
                        const stepIndex = activeSteps.findIndex(s => s.id === currentStep);
                        const thisIndex = activeSteps.findIndex(s => s.id === step.id);
                        // Si este paso no está en los pasos activos, no renderizar
                        if (thisIndex === -1) return null;
                        const isCompleted = thisIndex < stepIndex;
                        const isActive = step.id === currentStep;

                        return (
                            <div key={step.id} className={cn("flex flex-col items-center gap-2 relative z-10 w-full",
                                thisIndex === 0 ? "items-start" : thisIndex === activeSteps.length - 1 ? "items-end" : "items-center"
                            )}>
                                <div className={cn(
                                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                    isActive ? "bg-red-600 border-red-600 text-white scale-110" :
                                        isCompleted ? "bg-neutral-800 border-red-600 text-red-500" : "bg-black border-neutral-800 text-neutral-600"
                                )}>
                                    {isCompleted ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : <step.icon className="w-4 h-4 md:w-5 md:h-5" />}
                                </div>
                                <span className={cn("text-xs font-bold uppercase tracking-wider hidden md:block", isActive ? "text-white" : "text-neutral-500")}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
                {/* Progress Line Background would go here if needed */}
            </div>

            <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-xl overflow-hidden rounded-3xl md:rounded-4xl">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="p-5 md:p-12 min-h-[450px] md:min-h-[500px] flex flex-col">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 space-y-6 md:space-y-8"
                            >
                                {/* STEP 1: BIO */}
                                {currentStep === "bio" && (
                                    <div className="space-y-4 md:space-y-6">
                                        <div className="text-center mb-6 md:mb-8">
                                            <h2 className="text-xl md:text-3xl font-black text-white mb-1 md:mb-2 text-balance leading-tight">Comencemos por lo básico</h2>
                                            <p className="text-xs md:text-base text-neutral-400">Estos datos nos ayudan a calcular tus necesidades calóricas.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label className="uppercase text-xs font-bold text-neutral-500">Edad</Label>
                                                <Input
                                                    type="number"
                                                    inputMode="numeric"
                                                    {...register("age")}
                                                    className="bg-black/50 border-neutral-800 h-[52px] rounded-xl text-lg text-white focus:ring-red-500/50"
                                                />
                                                {errors.age && <p className="text-red-500 text-xs">{errors.age.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="uppercase text-xs font-bold text-neutral-500">Género</Label>
                                                <Select onValueChange={(v: string) => setValue("gender", v as "male" | "female")} defaultValue={formData.gender}>
                                                    <SelectTrigger className="bg-black/50 border-neutral-800 h-[52px] rounded-xl text-white">
                                                        <SelectValue placeholder="Selecciona" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                                        <SelectItem value="male">Hombre</SelectItem>
                                                        <SelectItem value="female">Mujer</SelectItem>

                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="uppercase text-xs font-bold text-neutral-500">Peso (kg)</Label>
                                                <Input
                                                    type="number"
                                                    inputMode="decimal"
                                                    {...register("weight")}
                                                    className="bg-black/50 border-neutral-800 h-[52px] rounded-xl text-lg text-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="uppercase text-xs font-bold text-neutral-500">Altura (cm)</Label>
                                                <Input
                                                    type="number"
                                                    inputMode="decimal"
                                                    {...register("height")}
                                                    className="bg-black/50 border-neutral-800 h-[52px] rounded-xl text-lg text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: GOALS & XP */}
                                {currentStep === "goals" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <h2 className="text-3xl font-black text-white mb-2">Tu Experiencia y Metas</h2>
                                            <p className="text-neutral-400">Personalizaremos la intensidad y el volumen según esto.</p>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <Label className="uppercase text-xs font-bold text-neutral-500">Nivel de Experiencia</Label>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {['beginner', 'intermediate', 'advanced'].map((level) => (
                                                        <div
                                                            key={level}
                                                            onClick={() => setValue("experienceLevel", level as "beginner" | "intermediate" | "advanced")}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all hover:bg-neutral-800",
                                                                formData.experienceLevel === level
                                                                    ? "border-red-600 bg-red-600/10 text-white"
                                                                    : "border-neutral-800 bg-black/40 text-neutral-400"
                                                            )}
                                                        >
                                                            <span className="capitalize font-bold text-lg mb-1">
                                                                {level === 'beginner' ? 'Principiante' : level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                                                            </span>
                                                            <span className="text-xs text-center opacity-70 font-normal">
                                                                {level === 'beginner' ? '< 6 meses entrenando' : level === 'intermediate' ? '6 meses - 2 años' : '> 2 años constancia'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="uppercase text-xs font-bold text-neutral-500">Objetivo Principal</Label>
                                                <Select onValueChange={(v: string) => setValue("goal", v)} defaultValue={formData.goal}>
                                                    <SelectTrigger className="bg-black/50 border-neutral-800 h-[52px] rounded-xl text-white text-md">
                                                        <SelectValue placeholder="Selecciona tu meta" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
                                                        <SelectItem value="hypertrophy">Hipertrofia (Ganar Músculo)</SelectItem>
                                                        <SelectItem value="strength">Fuerza Pura</SelectItem>
                                                        <SelectItem value="weight_loss">Pérdida de Peso / Definición</SelectItem>
                                                        <SelectItem value="endurance">Resistencia Condicional</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="uppercase text-xs font-bold text-neutral-500 flex justify-between">
                                                    <span>Días Disponibles por Semana</span>
                                                    <span className="text-red-500 text-lg font-black">{formData.availableDays} días</span>
                                                </Label>
                                                <input
                                                    type="range"
                                                    min="1"
                                                    max="7"
                                                    step="1"
                                                    value={formData.availableDays || 5}
                                                    onChange={(e) => setValue("availableDays", parseInt(e.target.value))}
                                                    className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-red-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: HEALTH */}
                                {currentStep === "health" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <h2 className="text-3xl font-black text-white mb-2">Perfil de Salud</h2>
                                            <p className="text-neutral-400">Crucial para que la IA prevenga ejercicios peligrosos.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="uppercase text-xs font-bold text-neutral-500">Lesiones / Molestias Activas</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {[
                                                    "Hombros", "Rodillas", "Espalda Baja", "Espalda Alta",
                                                    "Muñecas", "Codos", "Tobillos", "Cadera", "Cuello"
                                                ].map((part) => {
                                                    const isSelected = formData.injuries?.includes(part);
                                                    return (
                                                        <div
                                                            key={part}
                                                            onClick={() => toggleInjury(part)}
                                                            className={cn(
                                                                "p-3 rounded-xl border border-neutral-800 cursor-pointer text-center text-sm font-medium transition-all",
                                                                isSelected
                                                                    ? "bg-red-900/40 border-red-500 text-white"
                                                                    : "bg-black/40 text-neutral-400 hover:bg-neutral-800"
                                                            )}
                                                        >
                                                            {part}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="mt-4">
                                                <Label className="uppercase text-xs font-bold text-neutral-500 mb-2 block">Otras condiciones médicas (Opcional)</Label>
                                                <Input
                                                    placeholder="Ej: Asma, Hipertensión..."
                                                    className="bg-black/50 border-neutral-800 h-[52px] rounded-xl text-white"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const val = (e.currentTarget as HTMLInputElement).value;
                                                            if (val) {
                                                                setValue("medicalConditions", [...(formData.medicalConditions || []), val]);
                                                                (e.currentTarget as HTMLInputElement).value = "";
                                                            }
                                                        }
                                                    }}
                                                />
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {formData.medicalConditions?.map((cond, i) => (
                                                        <span key={i} className="bg-neutral-800 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
                                                            {cond}
                                                            <button
                                                                type="button"
                                                                onClick={() => setValue("medicalConditions", formData.medicalConditions?.filter((_, idx) => idx !== i) || [])}
                                                                className="hover:text-red-500"
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 4: MEASUREMENTS */}
                                {currentStep === "measurements" && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-8">
                                            <h2 className="text-3xl font-black text-white mb-2">Medidas Iniciales</h2>
                                            <p className="text-neutral-400">Opcional. Registra tus medidas base para ver tu progreso real.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {[
                                                { id: "measurements.neck", label: "Cuello" },
                                                { id: "measurements.shoulders", label: "Hombros" },
                                                { id: "measurements.chest", label: "Pecho" },
                                                { id: "measurements.waist", label: "Cintura" },
                                                { id: "measurements.hips", label: "Cadera" },
                                                { id: "measurements.glutes", label: "Glúteos" },

                                                { id: "measurements.bicepsLeft", label: "Bíceps Izq." },
                                                { id: "measurements.bicepsRight", label: "Bíceps Der." },

                                                { id: "measurements.forearmsLeft", label: "Antebrazo Izq." },
                                                { id: "measurements.forearmsRight", label: "Antebrazo Der." },

                                                { id: "measurements.quadsLeft", label: "Cuádriceps Izq." },
                                                { id: "measurements.quadsRight", label: "Cuádriceps Der." },

                                                { id: "measurements.calvesLeft", label: "Pantorrilla Izq." },
                                                { id: "measurements.calvesRight", label: "Pantorrilla Der." },
                                            ].map((m) => (
                                                <div key={m.id} className="space-y-2">
                                                    <Label className="uppercase text-xs font-bold text-neutral-500">{m.label} (cm)</Label>
                                                    <Input
                                                        type="number"
                                                        inputMode="decimal"
                                                        {...register(m.id as Path<z.infer<typeof OnboardingInputSchema>>)}
                                                        placeholder="0"
                                                        className="bg-black/50 border-neutral-800 h-[52px] rounded-xl text-white"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 5: SECURITY - Solo visible para usuarios Google */}
                                {currentStep === "security" && isGoogleUser && (
                                    <div className="space-y-4 md:space-y-6">
                                        <div className="text-center mb-4 md:mb-8">
                                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3 md:mb-4">
                                                <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
                                            </div>
                                            <h2 className="text-xl md:text-3xl font-black text-white mb-1 md:mb-2 leading-tight">Seguridad de la Cuenta</h2>
                                            <p className="text-[11px] md:text-base text-neutral-400 px-2">
                                                Crea una contraseña para acceder con <span className="text-white font-semibold break-all">{session?.user?.email}</span> desde cualquier dispositivo.
                                            </p>
                                        </div>

                                        <div className="space-y-4 md:space-y-5 max-w-md mx-auto">
                                            {/* Contraseña */}
                                            <div className="space-y-2">
                                                <Label className="uppercase text-xs font-bold text-neutral-500">Contraseña <span className="text-red-500">*</span></Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        {...register("password")}
                                                        placeholder="Mínimo 6 caracteres"
                                                        className="pl-10 pr-10 bg-black/50 border-neutral-800 h-[52px] rounded-xl text-white focus:ring-red-500/50"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                                {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
                                            </div>

                                            {/* Confirmar Contraseña */}
                                            <div className="space-y-2">
                                                <Label className="uppercase text-xs font-bold text-neutral-500">Confirmar Contraseña <span className="text-red-500">*</span></Label>
                                                <div className="relative">
                                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                                                    <Input
                                                        type={showConfirm ? "text" : "password"}
                                                        {...register("confirmPassword")}
                                                        placeholder="Repite tu contraseña"
                                                        className="pl-10 pr-10 bg-black/50 border-neutral-800 h-[52px] rounded-xl text-white focus:ring-red-500/50"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirm(!showConfirm)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                                                    >
                                                        {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                    </button>
                                                </div>
                                                {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
                                            </div>

                                            {/* Nota informativa */}
                                            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-3 md:p-4 mt-2 md:mt-4">
                                                <p className="text-[10px] md:text-[11px] text-neutral-400 leading-relaxed text-balance md:text-left text-center">
                                                    <span className="text-red-500 font-bold block md:inline mb-1 md:mb-0 md:mr-1">¿Por qué es obligatoria?</span>
                                                    Al ser de Google, tu cuenta no tiene contraseña. Esto te permite acceder con email y contraseña además del botón de Google.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* Footer Controls */}
                        <div className="mt-auto pt-8 flex justify-between items-center border-t border-neutral-800/50">
                            {currentStep !== "bio" ? (
                                <Button
                                    type="button"
                                    onClick={prevStep}
                                    variant="ghost"
                                    className="text-neutral-400 hover:text-white"
                                >
                                    <ChevronLeft className="w-4 h-4 mr-2" /> Atrás
                                </Button>
                            ) : (
                                <div></div> // Spacer
                            )}

                            {/* Determinar si es el último paso: para Google → security, para password → measurements */}
                            {((currentStep === "security" && isGoogleUser) || (currentStep === "measurements" && !isGoogleUser)) ? (
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6 md:px-10 h-11 md:h-14 font-black uppercase tracking-widest text-xs md:text-sm shadow-lg shadow-red-900/30 hover:scale-105 active:scale-95 transition-all"
                                >
                                    {isSubmitting ? <LoaderPremium size="sm" /> : <Check className="w-4 h-4 mr-2" />}
                                    Finalizar Setup
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="bg-white text-black hover:bg-neutral-100 rounded-full px-6 md:px-10 h-11 md:h-14 font-black uppercase tracking-widest text-xs md:text-sm shadow-xl shadow-white/5 hover:scale-105 active:scale-95 transition-all flex items-center group"
                                >
                                    <span>Siguiente</span>
                                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 ml-1.5 md:ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}

