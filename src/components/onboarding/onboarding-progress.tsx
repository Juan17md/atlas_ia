"use client";

import { ChevronRight, ChevronLeft, Check, User, Target, HeartPulse, Ruler, Lock, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "bio" | "goals" | "health" | "measurements" | "security";

interface OnboardingProgressProps {
    currentStep: Step;
    isGoogleUser: boolean;
}

const steps: { id: Step; label: string; icon: LucideIcon }[] = [
    { id: "bio", label: "Biometría", icon: User },
    { id: "goals", label: "Objetivos", icon: Target },
    { id: "health", label: "Salud", icon: HeartPulse },
    { id: "measurements", label: "Medidas", icon: Ruler },
    { id: "security", label: "Seguridad", icon: Lock },
];

export function OnboardingProgress({ currentStep, isGoogleUser }: OnboardingProgressProps) {
    const activeSteps = isGoogleUser
        ? steps
        : steps.filter((s) => s.id !== "security");

    const stepIndex = activeSteps.findIndex(s => s.id === currentStep);

    return (
        <div className="mb-8">
            <div className="flex justify-between mb-2">
                {steps.map((step) => {
                    const thisIndex = activeSteps.findIndex(s => s.id === step.id);
                    if (thisIndex === -1) return null;
                    
                    const isCompleted = thisIndex < stepIndex;
                    const isActive = step.id === currentStep;

                    return (
                        <div key={step.id} className={cn(
                            "flex flex-col items-center gap-2 relative z-10 w-full",
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
        </div>
    );
}