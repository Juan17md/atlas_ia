"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface RPESelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSelect: (value: string) => void;
  targetRpe?: number;
}

export function RPESelector({
  open,
  onOpenChange,
  value,
  onSelect,
  targetRpe,
}: RPESelectorProps) {
  const rpeValues = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] w-[90vw] bg-black/90 border-white/10 backdrop-blur-3xl rounded-3xl p-6 shadow-[0_0_50px_rgba(220,38,38,0.15)]">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-center flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-red-600/10 border border-red-600/20 rounded-full mb-1">
              <Sparkles className="w-3 h-3 text-red-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 italic">Esfuerzo Percibido</span>
            </div>
            <span className="text-2xl font-black italic tracking-tighter uppercase text-white">Seleccionar RPE</span>
            {targetRpe && (
              <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                Objetivo: <span className="text-red-500">@RPE {targetRpe}</span>
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {rpeValues.map((val) => {
            const isSelected = value === val.toString();
            const isTarget = targetRpe === val;

            return (
              <Button
                key={val}
                variant="ghost"
                onClick={() => {
                  onSelect(val.toString());
                  onOpenChange(false);
                }}
                className={cn(
                  "h-16 text-xl font-black italic rounded-2xl border transition-all duration-300 relative overflow-hidden group",
                  isSelected
                    ? "bg-red-600 text-white border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] scale-[1.02]"
                    : "bg-neutral-900/50 border-white/5 text-neutral-400 hover:text-white hover:bg-white/5 hover:border-white/10",
                  isTarget && !isSelected && "ring-1 ring-red-600/30"
                )}
              >
                <span className="relative z-10">{val}</span>
                {isTarget && !isSelected && (
                  <span className="absolute top-1 right-2 text-[8px] font-black text-red-500/50 uppercase tracking-tighter italic">OBJ</span>
                )}
                {isSelected && (
                   <div className="absolute inset-0 bg-linear-to-tr from-red-600 to-red-400 opacity-50" />
                )}
              </Button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          onClick={() => onOpenChange(false)}
          className="w-full mt-6 h-12 text-xs font-black uppercase tracking-[0.2em] italic text-neutral-500 hover:text-white transition-colors"
        >
          Cancelar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
