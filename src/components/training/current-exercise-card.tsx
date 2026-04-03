"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Info, RefreshCw, Trash2, Dumbbell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoutineExercise, SessionExercise, RoutineSet, SessionSet } from "./workout-session-types";
import { ProgressionTip } from "./progression-tip";

interface CurrentExerciseCardProps {
    exercise: RoutineExercise;
    logExercise: SessionExercise;
    isAdvanced: boolean;
    variantNames: Record<string, string>;
    onSwap: () => void;
    onRemove: () => void;
    onRemoveConfirm: boolean;
    onSetRemoveConfirm: (confirm: boolean) => void;
    onToggleSetComplete: (setIndex: number) => void;
    onUpdateSetWeight: (setIndex: number, value: string) => void;
    onUpdateSetReps: (setIndex: number, value: string) => void;
    onUpdateSetRpe: (setIndex: number, value: string) => void;
    onUpdateFeedback: (value: string) => void;
    onSwitchVariant: (variantId: string, variantName: string) => void;
    historySets: { weight: number; reps: number; rpe?: number }[];
    children: React.ReactNode;
}

export function CurrentExerciseCard({
    exercise,
    logExercise,
    isAdvanced,
    variantNames,
    onSwap,
    onRemove,
    onRemoveConfirm,
    onSetRemoveConfirm,
    onToggleSetComplete,
    onUpdateSetWeight,
    onUpdateSetReps,
    onUpdateSetRpe,
    onUpdateFeedback,
    onSwitchVariant,
    historySets,
    children,
}: CurrentExerciseCardProps) {
    const handleNumberInput = (value: string, callback: (val: string) => void) => {
        const val = value.replace(",", ".");
        if (val === "" || /^\d*\.?\d*$/.test(val)) {
            callback(val);
        }
    };

    return (
        <div className="space-y-6 min-h-[50vh] relative">
            {children}
        </div>
    );
}

interface ExerciseCardContentProps {
    exercise: RoutineExercise;
    logExercise: SessionExercise;
    isAdvanced: boolean;
    variantNames: Record<string, string>;
    onSwap: () => void;
    onRemove: () => void;
    onRemoveConfirm: boolean;
    onSetRemoveConfirm: (confirm: boolean) => void;
    onSwitchVariant: (variantId: string, variantName: string) => void;
    historySets: { weight: number; reps: number; rpe?: number }[];
    onToggleSetComplete: (setIndex: number) => void;
    onUpdateSetWeight: (setIndex: number, value: string) => void;
    onUpdateSetReps: (setIndex: number, value: string) => void;
    onUpdateSetRpe: (setIndex: number, value: string) => void;
    onUpdateFeedback: (value: string) => void;
}

export function ExerciseCardContent({
    exercise,
    logExercise,
    isAdvanced,
    variantNames,
    onSwap,
    onRemove,
    onRemoveConfirm,
    onSetRemoveConfirm,
    onSwitchVariant,
    historySets,
    onToggleSetComplete,
    onUpdateSetWeight,
    onUpdateSetReps,
    onUpdateSetRpe,
    onUpdateFeedback,
}: ExerciseCardContentProps) {
    const handleNumberInput = (value: string, callback: (val: string) => void) => {
        const val = value.replace(",", ".");
        if (val === "" || /^\d*\.?\d*$/.test(val)) {
            callback(val);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-neutral-900/40 backdrop-blur-3xl rounded-4xl border border-white/5 overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

            <div className="bg-white/2 border-b border-white/5 p-6 md:p-8 space-y-4">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                                {logExercise.exerciseName}
                            </h3>
                            {isAdvanced && (
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onSwap}
                                        className="h-8 w-8 rounded-lg text-neutral-600 hover:text-amber-400 hover:bg-amber-400/10 transition-all"
                                        title="Cambiar ejercicio"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                    </Button>
                                    {onRemoveConfirm ? (
                                        <div className="flex items-center gap-1 animate-in fade-in duration-200">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={onRemove}
                                                className="h-7 px-2 text-[10px] font-black text-red-500 hover:bg-red-500/20 rounded-lg uppercase"
                                            >
                                                Sí
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onSetRemoveConfirm(false)}
                                                className="h-7 px-2 text-[10px] font-black text-neutral-500 hover:text-white rounded-lg uppercase"
                                            >
                                                No
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onSetRemoveConfirm(true)}
                                            className="h-8 w-8 rounded-lg text-neutral-600 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                            title="Eliminar ejercicio"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {exercise.variantIds && exercise.variantIds.length > 0 && (
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline" className="h-8 text-[10px] font-black uppercase tracking-[0.2em] bg-red-600/10 border-red-600/20 text-red-500 w-fit px-4 rounded-xl hover:bg-red-600/20 transition-all shadow-lg shadow-red-950/20 group">
                                        <Dumbbell className="w-3 h-3 group-hover:rotate-12 transition-transform mr-2" />
                                        Máquina Ocupada
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="bottom" className="bg-neutral-950 border-white/10 rounded-t-3xl min-h-[40vh] max-h-[80vh] overflow-y-auto w-full md:max-w-md md:mx-auto md:rounded-3xl md:mb-4 px-4 py-6">
                                    <SheetHeader className="pb-4 text-left">
                                        <SheetTitle className="text-xl font-black uppercase italic tracking-wider text-white">Alternativas</SheetTitle>
                                        <SheetDescription className="text-neutral-400 text-xs">
                                            Selecciona otra variante si buscas un estímulo distinto o el equipo está ocupado.
                                        </SheetDescription>
                                    </SheetHeader>
                                    
                                    <div className="flex flex-col gap-3 mt-2">
                                        <SheetClose asChild>
                                            <button
                                                onClick={() => onSwitchVariant(exercise.exerciseId || "primary", exercise.exerciseName)}
                                                className={cn(
                                                    "text-left bg-neutral-900 border border-white/5 p-4 rounded-2xl transition-all hover:border-red-500/50 hover:bg-red-500/5 flex items-center justify-between",
                                                    logExercise.exerciseIdUsed === (exercise.exerciseId || "primary") && "border-red-500/50 bg-red-500/10"
                                                )}
                                            >
                                                <div>
                                                    <div className="font-bold text-white uppercase italic text-sm">{exercise.exerciseName}</div>
                                                    <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-black mt-1">Recomendación Principal</div>
                                                </div>
                                                {logExercise.exerciseIdUsed === (exercise.exerciseId || "primary") && (
                                                    <Check className="w-5 h-5 text-red-500" />
                                                )}
                                            </button>
                                        </SheetClose>

                                        {exercise.variantIds.map(vId => (
                                            <SheetClose asChild key={vId}>
                                                <button
                                                    onClick={() => onSwitchVariant(vId, variantNames[vId] || "Variante")}
                                                    className={cn(
                                                        "text-left bg-neutral-900 border border-white/5 p-4 rounded-2xl transition-all hover:border-amber-500/50 hover:bg-amber-500/5 flex items-center justify-between",
                                                        logExercise.exerciseIdUsed === vId && "border-amber-500/50 bg-amber-500/10"
                                                    )}
                                                >
                                                    <div>
                                                        <div className="font-bold text-white uppercase italic text-sm">{variantNames[vId] || "Cargando variante..."}</div>
                                                        <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-black mt-1">Alternativa</div>
                                                    </div>
                                                    {logExercise.exerciseIdUsed === vId && (
                                                        <Check className="w-5 h-5 text-amber-500" />
                                                    )}
                                                </button>
                                            </SheetClose>
                                        ))}
                                    </div>
                                </SheetContent>
                            </Sheet>
                        )}
                    </div>

                    {exercise.notes && (
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-help group" title={exercise.notes}>
                            <Info className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <ProgressionTip exerciseId={exercise.exerciseId || ""} />
                    {exercise.notes && (
                        <div className="px-3 py-1 bg-neutral-950/50 rounded-lg border border-white/5">
                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider line-clamp-1 italic">
                                OBS: {exercise.notes}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-2 md:p-6 md:pt-0">
                <div className="hidden md:grid md:grid-cols-12 md:gap-3 mb-4 px-4 text-[10px] font-black text-neutral-500 text-center uppercase tracking-[0.2em] bg-white/2 py-3 rounded-2xl border border-white/5">
                    <div className="col-span-1 italic">SQ</div>
                    <div className="col-span-3 italic">Obj.</div>
                    <div className="col-span-2 italic">Carga (kg)</div>
                    <div className="col-span-2 italic">Reps</div>
                    <div className="col-span-2 italic">RPE</div>
                    <div className="col-span-2 italic">Status</div>
                </div>

                <div className="space-y-3">
                    {exercise.sets.map((set, setIndex) => {
                        const logSet = logExercise.sets[setIndex];
                        const isCompleted = logSet?.completed;
                        const historySet = historySets[setIndex];

                        return (
                            <div
                                key={setIndex}
                                className={cn(
                                    "flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-3 p-3 md:p-3 rounded-2xl md:items-center transition-all duration-500 relative overflow-hidden group/set border",
                                    isCompleted
                                        ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)]"
                                        : "bg-neutral-900 border-white/5 hover:border-white/10"
                                )}
                            >
                                <div className="flex justify-between items-center md:contents">
                                    <div className="flex items-center gap-3 md:col-span-4 z-10 md:justify-start">
                                        <span className={cn(
                                            "text-[9px] md:text-[10px] font-black w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center border transition-all duration-300 md:ml-auto md:mr-4 shrink-0",
                                            isCompleted ? "bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" :
                                                set.type === 'warmup' ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
                                                    set.type === 'failure' ? "text-red-500 bg-red-500/10 border-red-500/20" :
                                                        "text-neutral-500 bg-neutral-950 border-white/5"
                                        )}>
                                            {setIndex + 1}
                                        </span>
                                        
                                        <div className="text-left md:text-center min-w-0">
                                            <div className="text-white font-black text-xs md:text-base italic leading-tight uppercase tracking-wider truncate">
                                                OBJ: {set.reps} {set.rpeTarget && <span className="text-neutral-500 text-[9px] md:text-[10px] ml-1">@RPE {set.rpeTarget}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="md:hidden flex justify-center z-10 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onToggleSetComplete(setIndex)}
                                            className={cn(
                                                "h-9 w-9 rounded-xl transition-all duration-500 border",
                                                isCompleted
                                                    ? "bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-110"
                                                    : "bg-neutral-950 text-neutral-700 border-white/5 hover:border-red-600/30"
                                            )}
                                        >
                                            <Check className={cn("w-4 h-4 transition-transform", isCompleted ? "scale-110" : "scale-100", isCompleted ? "text-black" : "text-neutral-600 hover:text-white")} />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 md:contents z-10 w-full">
                                    <div className="md:col-span-2 relative">
                                        <div className="text-[9px] text-neutral-500 uppercase font-black tracking-widest mb-1.5 px-1 truncate md:hidden">Carga (kg)</div>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder={historySet ? `${historySet.weight}` : "-"}
                                            value={logSet?.weight}
                                            onChange={(e) => handleNumberInput(e.target.value, (val) => onUpdateSetWeight(setIndex, val))}
                                            className={cn(
                                                "h-11 md:h-14 px-0 text-center text-base md:text-2xl font-black border-0 bg-neutral-950 rounded-xl focus:ring-2 focus:ring-white/10 transition-all placeholder:text-neutral-800 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none italic shadow-inner w-full",
                                                isCompleted && "text-emerald-400 bg-emerald-950/20 ring-1 ring-emerald-500/30"
                                            )}
                                        />
                                    </div>

                                    <div className="md:col-span-2 relative">
                                        <div className="text-[9px] text-neutral-500 uppercase font-black tracking-widest mb-1.5 px-1 truncate md:hidden">Reps</div>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder={historySet ? `${historySet.reps}` : "-"}
                                            value={logSet?.reps}
                                            onChange={(e) => handleNumberInput(e.target.value, (val) => onUpdateSetReps(setIndex, val))}
                                            className={cn(
                                                "h-14 md:h-14 px-0 text-center text-lg md:text-2xl font-black border-0 bg-neutral-950 rounded-xl focus:ring-2 focus:ring-white/10 transition-all placeholder:text-neutral-800 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none italic shadow-inner w-full",
                                                isCompleted && "text-emerald-400 bg-emerald-950/20 ring-1 ring-emerald-500/30"
                                            )}
                                        />
                                    </div>

                                    <div className="md:col-span-2 relative">
                                        <div className="text-[9px] text-neutral-500 uppercase font-black tracking-widest mb-1.5 px-1 truncate md:hidden">RPE</div>
                                        <div className={cn(
                                            "h-11 md:h-14 w-full px-0 justify-center text-center text-base md:text-2xl font-black border-0 bg-neutral-950 rounded-xl focus:ring-2 focus:ring-white/10 transition-all text-white [&>svg]:hidden italic shadow-inner",
                                            isCompleted && "text-emerald-400 bg-emerald-950/20 ring-1 ring-emerald-500/30"
                                        )}>
                                            {/* RPE Select - inline for now */}
                                            <select
                                                value={logSet?.rpe?.toString() || ""}
                                                onChange={(e) => onUpdateSetRpe(setIndex, e.target.value)}
                                                className="w-full h-full bg-transparent text-center font-black italic"
                                            >
                                                <option value="">-</option>
                                                {[10, 9, 8, 7, 6, 5].map((val) => (
                                                    <option key={val} value={val.toString()}>{val}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden md:col-span-2 md:flex justify-center z-10 md:ml-auto">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onToggleSetComplete(setIndex)}
                                        className={cn(
                                            "h-14 w-14 rounded-xl transition-all duration-500 border",
                                            isCompleted
                                                ? "bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-110"
                                                : "bg-neutral-950 text-neutral-700 border-white/5 hover:border-red-600/30 hover:text-white"
                                        )}
                                    >
                                        <Check className={cn("w-6 h-6 transition-transform", isCompleted ? "scale-110" : "scale-100")} />
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 px-2 relative z-10">
                    <div className="flex items-center gap-3 mb-3 text-neutral-500">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Feedback Operativo</span>
                    </div>
                    <Input
                        placeholder="Añadir observaciones técnicas..."
                        value={logExercise.feedback}
                        onChange={(e) => onUpdateFeedback(e.target.value)}
                        className="bg-neutral-950/50 border border-white/5 rounded-2xl px-6 py-8 text-sm text-neutral-300 focus-visible:ring-1 focus-visible:ring-red-600/50 placeholder:text-neutral-700 transition-all"
                    />
                </div>
            </div>
        </div>
    );
}