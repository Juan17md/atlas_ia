"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Loader2, ChevronRight, Activity } from "lucide-react";
import { getAssignedAthletes } from "@/actions/routine-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";


interface Athlete {
    id: string;
    name: string;
    image: string | null;
    email: string;
}

export function AssignedAthletesDialog({ routineId, routineName }: { routineId: string, routineName: string }) {
    const [open, setOpen] = useState(false);
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [loading, setLoading] = useState(false);

    const handleOpen = async (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen && athletes.length === 0) {
            setLoading(true);
            const res = await getAssignedAthletes(routineId);
            if (res.success) {
                setAthletes(res.athletes as Athlete[]);
            }
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-[10px] font-black uppercase tracking-[0.2em] bg-red-600/10 text-red-500 border-red-600/20 hover:bg-red-600/20 hover:text-red-500 rounded-xl transition-all shadow-lg shadow-red-900/10 italic"
                >
                    <Users className="w-3.5 h-3.5 mr-2" />
                    {loading ? "Sincronizando..." : "Ver Unidades"}
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-neutral-950 border-white/5 text-white sm:max-w-[450px] p-0 overflow-hidden rounded-4xl shadow-2xl shadow-black/80 gap-0">
                {/* Header Premium */}
                <div className="p-8 border-b border-white/5 bg-linear-to-br from-neutral-900 via-neutral-950 to-black relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic text-white flex items-center gap-3">
                            <Activity className="w-6 h-6 text-red-600" />
                            Unidades Activas
                        </DialogTitle>
                        <DialogDescription className="text-neutral-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">
                            Atletas con la rutina: <span className="text-white italic">{routineName}</span>
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-4">
                    <ScrollArea className="h-[350px] pr-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                                <Loader2 className="w-10 h-10 animate-spin text-red-600" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 italic">Escaneando Núcleos...</p>
                            </div>
                        ) : athletes.length > 0 ? (
                            <div className="space-y-2">
                                    {athletes.map((athlete) => (
                                        <div
                                            key={athlete.id}
                                            className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl transition-colors"
                                        >
                                            <Avatar className="h-12 w-12 border-2 border-white/5 group-hover:border-red-600/20 transition-colors">
                                                <AvatarImage src={athlete.image || undefined} />
                                                <AvatarFallback className="bg-neutral-900 text-xs font-black uppercase text-red-500 italic">
                                                    {athlete.name?.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-white text-sm uppercase tracking-tight italic group-hover:text-red-500 transition-colors">{athlete.name}</h4>
                                                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-0.5">{athlete.email}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-neutral-700" />
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-4xl bg-white/5 flex flex-col items-center gap-4">
                                <Users className="w-12 h-12 text-neutral-800" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600 italic">No hay atletas asignados a esta rutina</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
