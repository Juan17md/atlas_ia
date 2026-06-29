import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Dumbbell } from "lucide-react";

interface PersonalRecordsCardProps {
    prs: { exercise: string; weight: number; date: string }[];
}

export function PersonalRecordsCard({ prs }: PersonalRecordsCardProps) {
    if (!prs || prs.length === 0) {
        return (
            <Card className="glass-card border-white/10 opacity-60">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <CardTitle className="text-sm font-bold text-white uppercase tracking-wider">Mejores Marcas</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-muted-foreground text-center">Registra entrenamientos para ver tus récords.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-4xl shadow-2xl">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                        <CardTitle className="text-sm font-black text-white uppercase tracking-[0.2em]">Récords Personales</CardTitle>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Tus mejores marcas</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {prs.map((pr, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-yellow-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:bg-yellow-500/10 group-hover:text-yellow-500 transition-colors">
                                <Dumbbell className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-white leading-none uppercase tracking-tight group-hover:text-yellow-500 transition-colors">{pr.exercise}</p>
                                <p className="text-[10px] text-neutral-500 mt-1.5 font-bold uppercase tracking-widest">{pr.date}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xl font-black text-white leading-none tracking-tighter italic">
                                {pr.weight} <span className="text-[10px] font-bold text-neutral-500 not-italic">KG</span>
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
