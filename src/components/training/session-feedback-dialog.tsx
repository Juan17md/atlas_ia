"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Loader2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionFeedbackDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (rpe: number, notes: string) => void;
    isSubmitting: boolean;
}

export function SessionFeedbackDialog({ open, onOpenChange, onConfirm, isSubmitting }: SessionFeedbackDialogProps) {
    const [rpe, setRpe] = useState(7); // Default to a good effort
    const [notes, setNotes] = useState("");

    const handleConfirm = () => {
        onConfirm(rpe, notes);
    };

    const getRpeColor = (value: number) => {
        if (value <= 4) return "text-green-500";
        if (value <= 7) return "text-yellow-500";
        return "text-red-500";
    };

    const getRpeDescription = (value: number) => {
        if (value <= 2) return "Paseo por el parque - Muy fácil";
        if (value <= 4) return "Suave / Recuperación";
        if (value <= 6) return "Moderado / Sostenible";
        if (value <= 8) return "Duro / Desafiante";
        if (value <= 9) return "Muy Duro / Cerca del fallo";
        return "Máximo Esfuerzo / Fallo total";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-neutral-900 border-neutral-800 text-white sm:max-w-md w-[95vw] rounded-2xl">
                <DialogHeader className="text-left">
                    <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase text-white">
                        <Zap className="w-6 h-6 text-yellow-500 filled-icon" fill="currentColor" />
                        Fin del Entrenamiento
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        ¡Gran trabajo! Tómate un momento para valorar tu sesión.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* RPE Selector */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <Label className="text-sm font-bold uppercase tracking-wider text-neutral-300">Esfuerzo Global (RPE)</Label>
                            <span className={cn("text-2xl md:text-3xl font-black tabular-nums transition-colors", getRpeColor(rpe))}>
                                {rpe}<span className="text-xs md:text-sm text-neutral-600 font-bold">/10</span>
                            </span>
                        </div>

                        <Slider
                            value={[rpe]}
                            onValueChange={(vals) => setRpe(vals[0])}
                            max={10}
                            min={1}
                            step={1}
                            className="py-4 cursor-pointer"
                        />

                        <p className="text-center text-sm font-medium text-neutral-400 bg-neutral-950 py-3 px-2 rounded-xl border border-neutral-800">
                            {getRpeDescription(rpe)}
                        </p>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label className="text-sm font-bold uppercase tracking-wider text-neutral-300">Notas de Sesión (Opcional)</Label>
                        <Textarea
                            placeholder="¿Cómo te sentiste? ¿Alguna molestia?"
                            className="bg-neutral-950 border-neutral-800 focus:border-neutral-700 min-h-[100px] text-base md:text-sm resize-none rounded-xl p-4"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="w-full sm:w-auto h-12 md:h-14 hover:bg-white/5 hover:text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest">
                        Atrás
                    </Button>
                    <Button onClick={handleConfirm} disabled={isSubmitting} className="w-full sm:w-auto h-12 md:h-14 bg-white text-black hover:bg-neutral-200 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-xl shadow-white/10">
                        {isSubmitting && <Loader2 className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 animate-spin" />}
                        Guardar Entrenamiento
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
