"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { RetroSet, useWorkoutLogger } from "./workout-logger-context";

interface SetRowProps {
    exIndex: number;
    setIndex: number;
    set: RetroSet;
    canDelete?: boolean;
}

export const SetRow = React.memo(function SetRow({ exIndex, setIndex, set, canDelete }: SetRowProps) {
    const { updateSet, removeSet } = useWorkoutLogger();

    return (
        <div className="grid grid-cols-[20px_1fr_1fr_1fr_20px] sm:grid-cols-[28px_1fr_1fr_1fr_28px] gap-1 sm:gap-1.5 items-center group">
            <div className="flex justify-center">
                <span className="bg-neutral-800/50 text-neutral-500 text-[9px] sm:text-[10px] font-black w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full shrink-0">
                    {setIndex + 1}
                </span>
            </div>
            <Input
                type="text"
                inputMode="decimal"
                value={set.weight}
                onChange={(e) => {
                    const val = e.target.value.replace(",", ".");
                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                        updateSet(exIndex, setIndex, "weight", val);
                    }
                }}
                placeholder="-"
                className="h-9 sm:h-11 text-center text-sm sm:text-base font-bold bg-neutral-900 border-neutral-800 focus:border-neutral-700 text-white rounded-lg sm:rounded-xl focus:ring-1 focus:ring-white/20 px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-neutral-800 transition-all placeholder:font-normal"
            />
            <Input
                type="text"
                inputMode="decimal"
                value={set.reps}
                onChange={(e) => {
                    const val = e.target.value.replace(",", ".");
                    if (val === "" || /^\d*\.?\d*$/.test(val)) {
                        updateSet(exIndex, setIndex, "reps", val);
                    }
                }}
                placeholder={set.targetReps || "-"}
                className="h-9 sm:h-11 text-center text-sm sm:text-base font-bold bg-neutral-900 border-neutral-800 focus:border-neutral-700 text-white rounded-lg sm:rounded-xl focus:ring-1 focus:ring-white/20 px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-neutral-600 transition-all placeholder:font-normal"
            />
            <Select
                value={set.rpe || ""}
                onValueChange={(val) => updateSet(exIndex, setIndex, "rpe", val)}
            >
                <SelectTrigger
                    className="h-9 sm:h-11 w-full justify-center text-center text-sm sm:text-base font-bold bg-neutral-900 border-neutral-800 focus:border-neutral-700 text-white rounded-lg sm:rounded-xl focus:ring-1 focus:ring-white/20 px-0 [&>svg]:hidden transition-all"
                >
                    <SelectValue placeholder={set.targetRpe || "-"} />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800 text-white min-w-[60px]">
                    {[10, 9, 8, 7, 6, 5].map((val) => (
                        <SelectItem key={val} value={val.toString()} className="justify-center focus:bg-neutral-800 focus:text-white">
                            {val}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex justify-center">
                {canDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSet(exIndex, setIndex)}
                        className="h-6 w-6 sm:h-7 sm:w-7 text-neutral-700 hover:text-red-500 hover:bg-red-500/10 rounded-md sm:rounded-lg transition-colors shrink-0"
                    >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </Button>
                )}
            </div>
        </div>
    );
});
