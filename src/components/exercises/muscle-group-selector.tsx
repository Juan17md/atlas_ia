"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MUSCLE_GROUPS } from "./exercise-form-types";

interface MuscleGroupSelectorProps {
    selected: string[];
    onChange: (groups: string[]) => void;
}

export function MuscleGroupSelector({ selected, onChange }: MuscleGroupSelectorProps) {
    const toggleGroup = (group: string) => {
        if (selected.includes(group)) {
            onChange(selected.filter(g => g !== group));
        } else {
            onChange([...selected, group]);
        }
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {MUSCLE_GROUPS.map((group) => {
                const isSelected = selected.includes(group);
                return (
                    <button
                        key={group}
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className={cn(
                            "relative p-4 rounded-2xl border-2 transition-all text-left group",
                            isSelected
                                ? "border-red-500 bg-red-500/10"
                                : "border-white/10 bg-neutral-950/50 hover:border-white/20"
                        )}
                    >
                        {isSelected && (
                            <div className="absolute top-2 right-2 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                            </div>
                        )}
                        <span className={cn(
                            "text-sm font-black uppercase tracking-wider",
                            isSelected ? "text-white" : "text-neutral-500 group-hover:text-white"
                        )}>
                            {group}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}