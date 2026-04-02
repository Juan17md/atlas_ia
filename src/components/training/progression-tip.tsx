"use client";

import { useEffect, useState } from "react";
import { getProgressionSuggestion, type ProgressionSuggestion } from "@/actions/progression-ai";
import { TrendingUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface ProgressionTipProps {
    exerciseId: string;
    className?: string;
}

export function ProgressionTip({ exerciseId, className }: ProgressionTipProps) {
    const [suggestion, setSuggestion] = useState<ProgressionSuggestion | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!exerciseId || exerciseId === "temp-id") {
            setLoading(false);
            return;
        }

        getProgressionSuggestion(exerciseId)
            .then((res) => {
                if (res?.success && res.suggestion) {
                    setSuggestion(res.suggestion);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [exerciseId]);

    if (loading || !suggestion) return null;

    const diff = suggestion.suggestedWeight - (suggestion.lastWeight || 0);
    const isIncrease = diff > 0;

    return (
        <div className={cn("flex items-center gap-2 px-3 py-2 bg-blue-900/20 border border-blue-500/20 rounded-lg text-sm mb-4", className)}>
            <div className={cn("p-1.5 rounded-full flex items-center justify-center",
                isIncrease ? "bg-green-500/20 text-green-500" : "bg-blue-500/20 text-blue-500"
            )}>
                <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
                <p className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    Sugerencia IA
                    {isIncrease && <span className="bg-green-500 text-black px-1.5 rounded text-[10px] font-black">+{diff}kg</span>}
                </p>
                <p className="text-blue-200/80 text-xs leading-snug mt-0.5">
                    {suggestion.reason} (Último: {suggestion.lastWeight}kg)
                </p>
            </div>

            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 p-0 rounded-full hover:bg-white/10 text-blue-400">
                        <Info className="w-4 h-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="bg-neutral-900 border-neutral-800 text-xs max-w-[200px] text-white p-3">
                    Basado en tu última sesión del {new Date(suggestion.lastDate!).toLocaleDateString()}.
                </PopoverContent>
            </Popover>
        </div>
    );
}
