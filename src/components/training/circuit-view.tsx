"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CircuitBoard, Play, ChevronRight, RotateCcw, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { RestTimer } from "./rest-timer";
import { ExerciseTimer } from "./exercise-timer";

interface CircuitExerciseItem {
    exerciseId: string;
    exerciseName: string;
    duracionSegundos?: number;
}

interface CircuitViewProps {
    nombre: string;
    ejercicios: CircuitExerciseItem[];
    rondas: number;
    descansoEntreRondas: number;
    onCompletarEjercicio: (exerciseId: string) => void;
    onCompletarRonda: (ronda: number) => void;
    onCompletarCircuito: () => void;
    className?: string;
}

type FaseCircuito = "previa" | "ejercicio" | "descanso_ronda" | "completado";

export function CircuitView({
    nombre,
    ejercicios,
    rondas,
    descansoEntreRondas,
    onCompletarEjercicio,
    onCompletarRonda,
    onCompletarCircuito,
    className,
}: CircuitViewProps) {
    const [rondaActual, setRondaActual] = useState(1);
    const [ejercicioIndice, setEjercicioIndice] = useState(0);
    const [fase, setFase] = useState<FaseCircuito>("previa");
    const [ejerciciosCompletados, setEjerciciosCompletados] = useState<string[]>([]);

    const ejercicioActual = ejercicios[ejercicioIndice];
    const esCircuitoPorTiempo = ejercicios.some(e => e.duracionSegundos);

    const avanzarEjercicio = useCallback(() => {
        if (!ejercicioActual) return;
        setEjerciciosCompletados(prev => [...prev, ejercicioActual.exerciseId]);
        onCompletarEjercicio(ejercicioActual.exerciseId);

        if (ejercicioIndice < ejercicios.length - 1) {
            setEjercicioIndice(prev => prev + 1);
            setFase(esCircuitoPorTiempo ? "ejercicio" : "previa");
        } else {
            // Ronda completada
            onCompletarRonda(rondaActual);
            if (rondaActual >= rondas) {
                setFase("completado");
                onCompletarCircuito();
            } else {
                setFase("descanso_ronda");
            }
        }
    }, [ejercicioIndice, ejercicios.length, rondaActual, rondas, ejercicioActual, onCompletarEjercicio, onCompletarRonda, onCompletarCircuito, esCircuitoPorTiempo]);

    const iniciarDescansoRonda = useCallback(() => {
        setFase("descanso_ronda");
    }, []);

    const finalizarDescansoRonda = useCallback(() => {
        setRondaActual(prev => prev + 1);
        setEjercicioIndice(0);
        setEjerciciosCompletados([]);
        setFase("previa");
    }, []);

    const iniciarCircuito = useCallback(() => {
        setFase(esCircuitoPorTiempo ? "ejercicio" : "previa");
    }, [esCircuitoPorTiempo]);

    const reiniciar = useCallback(() => {
        setRondaActual(1);
        setEjercicioIndice(0);
        setFase("previa");
        setEjerciciosCompletados([]);
    }, []);

    return (
        <div className={cn("space-y-4", className)}>
            {/* Cabecera del circuito */}
            <div className="bg-neutral-900/40 backdrop-blur-xl rounded-3xl border border-white/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <CircuitBoard className="w-6 h-6 text-cyan-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase italic">{nombre}</h3>
                        <p className="text-[10px] text-neutral-500 font-medium">
                            {rondas} rondas &middot; {ejercicios.length} ejercicios
                            {descansoEntreRondas > 0 && <> &middot; {descansoEntreRondas}s descanso</>}
                        </p>
                    </div>
                    {fase === "completado" && (
                        <div className="ml-auto">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={reiniciar}
                                className="h-9 px-3 text-[10px] font-black uppercase text-neutral-500 hover:text-white"
                            >
                                <RotateCcw className="w-3 h-3 mr-1" /> Reiniciar
                            </Button>
                        </div>
                    )}
                </div>

                {/* Indicador de ronda */}
                <div className="flex items-center gap-2 mb-4">
                    {Array.from({ length: rondas }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                "h-2 flex-1 rounded-full transition-all",
                                i + 1 < rondaActual ? "bg-emerald-500" :
                                i + 1 === rondaActual ? "bg-cyan-500" :
                                "bg-neutral-800"
                            )}
                        />
                    ))}
                </div>

                {/* Lista de ejercicios */}
                <div className="space-y-2">
                    {ejercicios.map((ej, idx) => {
                        const estaActivo = idx === ejercicioIndice && fase !== "completado" && fase !== "descanso_ronda";
                        const estaCompletado = ejerciciosCompletados.includes(ej.exerciseId) ||
                            (fase === "completado") ||
                            (fase === "descanso_ronda");
                        return (
                            <div
                                key={ej.exerciseId}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                    estaActivo && "border-cyan-500/50 bg-cyan-500/10",
                                    estaCompletado && !estaActivo && "border-emerald-500/20 bg-emerald-500/5",
                                    !estaActivo && !estaCompletado && "border-white/5 bg-neutral-950/30"
                                )}
                            >
                                <div className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black border",
                                    estaCompletado ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                                    estaActivo ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400" :
                                    "bg-neutral-900 border-white/5 text-neutral-600"
                                )}>
                                    {estaCompletado ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                                </div>
                                <span className={cn(
                                    "text-sm font-bold flex-1",
                                    estaCompletado ? "text-neutral-500" : "text-white"
                                )}>
                                    {ej.exerciseName}
                                </span>
                                {ej.duracionSegundos && (
                                    <span className="text-[10px] font-black text-neutral-600 bg-neutral-950 px-2 py-1 rounded-lg">
                                        {ej.duracionSegundos}s
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Fases del circuito */}
            {fase === "previa" && (
                <div className="text-center py-8">
                    <p className="text-neutral-500 font-bold mb-4">
                        Ronda {rondaActual} de {rondas}
                    </p>
                    <Button
                        onClick={iniciarCircuito}
                        className="h-14 px-8 bg-cyan-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-cyan-700 shadow-xl shadow-cyan-900/30"
                    >
                        <Play className="w-5 h-5 mr-2" />
                        {rondaActual === 1 ? "Iniciar Circuito" : `Iniciar Ronda ${rondaActual}`}
                    </Button>
                </div>
            )}

            {fase === "ejercicio" && ejercicioActual && (
                <div className="space-y-4">
                    <p className="text-center text-xs font-black text-cyan-500 uppercase tracking-widest">
                        Ronda {rondaActual}/{rondas} &middot; Ejercicio {ejercicioIndice + 1}/{ejercicios.length}
                    </p>
                    {esCircuitoPorTiempo && ejercicioActual.duracionSegundos ? (
                        <ExerciseTimer
                            duracionSegundos={ejercicioActual.duracionSegundos}
                            onComplete={avanzarEjercicio}
                        />
                    ) : (
                        <div className="bg-neutral-900/40 rounded-3xl border border-white/5 p-6 text-center space-y-4">
                            <p className="text-lg font-black text-white uppercase italic">
                                {ejercicioActual.exerciseName}
                            </p>
                            <Button
                                onClick={avanzarEjercicio}
                                className="h-14 px-8 bg-emerald-600 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-900/30"
                            >
                                <Check className="w-5 h-5 mr-2" />
                                Completado
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {fase === "descanso_ronda" && (
                <RestTimer
                    restSeconds={descansoEntreRondas}
                    onSkip={finalizarDescansoRonda}
                    onComplete={finalizarDescansoRonda}
                    className="border-cyan-500/20"
                />
            )}

            {fase === "completado" && (
                <div className="bg-emerald-500/5 rounded-3xl border border-emerald-500/20 p-8 text-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
                        <Check className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="text-xl font-black text-emerald-400 uppercase italic">Circuito Completado</p>
                    <p className="text-neutral-500 text-sm">
                        {rondas} rondas completadas con {ejercicios.length} ejercicios
                    </p>
                </div>
            )}
        </div>
    );
}
