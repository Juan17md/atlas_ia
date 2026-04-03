"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkoutNavigationProps {
    currentIndex: number;
    totalExercises: number;
    onPrev: () => void;
    onNext: () => void;
    isLastExercise: boolean;
    isFirstExercise: boolean;
    onFinish: () => void;
}

export function WorkoutNavigation({
    currentIndex,
    totalExercises,
    onPrev,
    onNext,
    isLastExercise,
    isFirstExercise,
    onFinish,
}: WorkoutNavigationProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-6 md:p-6 bg-black/80 backdrop-blur-3xl border-t border-white/10 flex justify-between items-center gap-6 z-40 animate-in slide-in-from-bottom-full duration-700 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]">
            <div className="max-w-3xl mx-auto w-full flex justify-between items-center gap-4 md:gap-6">
                <Button
                    onClick={onPrev}
                    disabled={isFirstExercise}
                    className="h-12 w-12 md:h-16 md:w-16 rounded-2xl bg-neutral-900/50 border border-white/5 text-white hover:bg-white/10 disabled:opacity-20 transition-all shadow-xl group shrink-0"
                >
                    <ChevronLeft className="w-5 h-5 md:w-8 md:h-8 group-hover:-translate-x-1 transition-transform" />
                </Button>

                <div className="flex-1 flex flex-col items-center justify-center gap-0">
                    <span className="text-[8px] md:text-[9px] uppercase font-black text-neutral-500 tracking-[0.2em] md:tracking-[0.3em] italic">Ejercicio</span>
                    <div className="flex items-center gap-3">
                        <span className="text-base md:text-2xl font-black text-white italic tracking-tighter">
                            <span className="text-red-600">{currentIndex + 1}</span>
                            <span className="text-neutral-700 mx-1">/</span>
                            {totalExercises}
                        </span>
                    </div>
                </div>

                <Button
                    onClick={isLastExercise ? onFinish : onNext}
                    className={cn(
                        "h-12 md:h-16 px-4 md:px-8 rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-[0.15em] md:tracking-[0.2em] transition-all shadow-2xl active:scale-95 flex items-center gap-2 md:gap-3 shrink-0",
                        isLastExercise
                            ? "bg-red-600 text-white hover:bg-red-500 shadow-red-900/40"
                            : "bg-white text-black hover:bg-neutral-200 shadow-white/20"
                    )}
                >
                    <span>{isLastExercise ? "Finalizar" : "Siguiente"}</span>
                    {isLastExercise ? (
                        <Trophy className="w-3.5 h-3.5 md:w-5 md:h-5" />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5 md:w-5 md:h-5" />
                    )}
                </Button>
            </div>
        </div>
    );
}