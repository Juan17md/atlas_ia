"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { ChevronLeft, Dumbbell, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkoutLogger } from "./workout-logger-context";
import { fechaLocalAString } from "@/lib/fecha-utils";

interface SessionHeaderProps {
    onBack?: () => void;
    disableRoutineName?: boolean;
}

export function SessionHeader({ onBack, disableRoutineName }: SessionHeaderProps) {
    const router = useRouter();
    const { 
        routineName, setRoutineName, 
        date, setDate, 
        handleMarkRestWithConfirm, 
        isSubmitting, isLoadingLog 
    } = useWorkoutLogger();

    return (
        <div className="space-y-6">
            {/* Header Title */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onBack ? onBack() : router.back()}
                    className="h-10 w-10 rounded-xl bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 shrink-0"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        Registrar Entrenamiento
                    </h1>
                    <p className="text-xs sm:text-sm text-neutral-500">
                        Historial retroactivo de sesiones completadas
                    </p>
                </div>
            </div>

            {/* Session Metadata */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-5 space-y-5 shadow-lg shadow-black/20">
                <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    <Dumbbell className="w-3.5 h-3.5" />
                    Detalles de la Sesión
                </div>

                <div className="space-y-4">
                    {/* Routine Name */}
                    <div className="space-y-1.5">
                        <Label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                            Nombre de la rutina
                        </Label>
                        <div className="relative">
                            <Dumbbell className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                            <Input
                                value={routineName}
                                onChange={(e) => setRoutineName(e.target.value)}
                                disabled={disableRoutineName}
                                placeholder="Ej: Push Day, Torso Pesado..."
                                className="bg-neutral-950 border-neutral-800 text-white font-semibold rounded-xl focus:ring-1 focus:ring-white/20 h-12 pl-10 placeholder:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {/* Date */}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                                Fecha
                            </Label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <DatePicker
                                        date={date ? new Date(date + "T12:00:00") : undefined}
                                        setDate={(newDate) => {
                                            if (newDate) {
                                                setDate(fechaLocalAString(newDate));
                                            }
                                        }}
                                        maxDate={new Date()}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleMarkRestWithConfirm}
                                    disabled={isSubmitting || isLoadingLog}
                                    className="h-12 border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded-xl px-4 shrink-0 transition-all active:scale-95"
                                    title="Marcar como descanso"
                                >
                                    <Moon className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
