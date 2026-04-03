"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RoutineSet, SessionSet } from "./workout-session-types";

interface ExerciseSetRowProps {
    set: RoutineSet;
    logSet?: SessionSet;
    isCompleted: boolean;
    historySet?: { weight: number; reps: number; rpe?: number };
    onToggleComplete: () => void;
    onUpdateWeight: (value: string) => void;
    onUpdateReps: (value: string) => void;
    onUpdateRpe: (value: string) => void;
}

export function ExerciseSetRow({
    set,
    logSet,
    isCompleted,
    historySet,
    onToggleComplete,
    onUpdateWeight,
    onUpdateReps,
    onUpdateRpe,
}: ExerciseSetRowProps) {
    const handleNumberInput = (value: string, callback: (val: string) => void) => {
        const val = value.replace(",", ".");
        if (val === "" || /^\d*\.?\d*$/.test(val)) {
            callback(val);
        }
    };

    return (
        <div
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
                        {/* setIndex + 1 - passed as children */}
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
                        onClick={onToggleComplete}
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
                        onChange={(e) => handleNumberInput(e.target.value, onUpdateWeight)}
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
                        onChange={(e) => handleNumberInput(e.target.value, onUpdateReps)}
                        className={cn(
                            "h-14 md:h-14 px-0 text-center text-lg md:text-2xl font-black border-0 bg-neutral-950 rounded-xl focus:ring-2 focus:ring-white/10 transition-all placeholder:text-neutral-800 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none italic shadow-inner w-full",
                            isCompleted && "text-emerald-400 bg-emerald-950/20 ring-1 ring-emerald-500/30"
                        )}
                    />
                </div>

                <div className="md:col-span-2 relative">
                    <div className="text-[9px] text-neutral-500 uppercase font-black tracking-widest mb-1.5 px-1 truncate md:hidden">RPE</div>
                    <Select
                        value={logSet?.rpe?.toString() || ""}
                        onValueChange={onUpdateRpe}
                    >
                        <SelectTrigger
                            className={cn(
                                "h-11 md:h-14 w-full px-0 justify-center text-center text-base md:text-2xl font-black border-0 bg-neutral-950 rounded-xl focus:ring-2 focus:ring-white/10 transition-all text-white [&>svg]:hidden italic shadow-inner",
                                isCompleted && "text-emerald-400 bg-emerald-950/20 ring-1 ring-emerald-500/30"
                            )}
                        >
                            <SelectValue placeholder={historySet ? `${historySet.rpe}` : "-"} />
                        </SelectTrigger>
                        <SelectContent className="bg-neutral-900 border border-white/10 text-white min-w-[60px] rounded-2xl backdrop-blur-3xl shadow-2xl">
                            {[10, 9, 8, 7, 6, 5].map((val) => (
                                <SelectItem
                                    key={val}
                                    value={val.toString()}
                                    className="justify-center focus:bg-red-600 focus:text-white font-black italic rounded-xl mx-1"
                                >
                                    {val}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="hidden md:col-span-2 md:flex justify-center z-10 md:ml-auto">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleComplete}
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
}