"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Zap } from "lucide-react";
import { useWorkoutLogger } from "./workout-logger-context";
import { cn } from "@/lib/utils";

export function WorkoutPerception() {
    const { sessionRpe, setSessionRpe, sessionNotes, setSessionNotes } = useWorkoutLogger();

    const getRpeColor = (value: number) => {
        if (value <= 4) return "text-green-500";
        if (value <= 7) return "text-yellow-500";
        return "text-red-500";
    };

    const getRpeLabel = (value: number) => {
        if (value <= 2) return "Muy Fácil";
        if (value <= 4) return "Suave";
        if (value <= 6) return "Moderado";
        if (value <= 8) return "Duro";
        if (value <= 9) return "Muy Duro";
        return "Máximo Esfuerzo";
    };

    return (
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-4 sm:p-6 space-y-5">
            <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                Percepción de la Sesión
            </div>

            {/* Session RPE */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <Label className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                        Esfuerzo Global (RPE)
                    </Label>
                    <span className={cn("text-3xl font-black tabular-nums transition-colors", getRpeColor(sessionRpe))}>
                        {sessionRpe}
                        <span className="text-sm text-neutral-600 font-bold">/10</span>
                    </span>
                </div>

                <Slider
                    value={[sessionRpe]}
                    onValueChange={(vals) => setSessionRpe(vals[0])}
                    max={10}
                    min={1}
                    step={1}
                    className="py-4 cursor-pointer"
                />

                <p className="text-center text-sm font-medium text-neutral-400 bg-neutral-950 py-3 px-2 rounded-xl border border-neutral-800">
                    {getRpeLabel(sessionRpe)}
                </p>
            </div>

            {/* General Notes */}
            <div className="space-y-2">
                <Label className="text-sm font-bold uppercase tracking-wider text-neutral-300">
                    Notas de Sesión (Opcional)
                </Label>
                <Textarea
                    placeholder="¿Cómo te sentiste? ¿Algo a destacar?"
                    className="bg-neutral-950 border-neutral-800 focus:border-neutral-700 min-h-[80px] resize-none rounded-xl text-sm"
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                />
            </div>
        </div>
    );
}
