import { auth } from "@/lib/auth";
import { getRoutines } from "@/actions/routine-actions";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RoutineCard } from "@/components/routines/routine-card";


export default async function RoutinesPage() {
    const session = await auth();

    // Verificación de autenticación
    if (!session?.user?.id) redirect("/login");

    const routinesRes = await getRoutines();
    const routinesRaw = routinesRes.success ? routinesRes.routines || [] : [];

    // Asegurar que no haya duplicados por ID y minimizar serialización enviada a Client Components (server-serialization)
    const routines = Array.from(new Map(routinesRaw.map(r => [r.id, r])).values());
    const athletes: Array<{ id: string; name: string; email: string; image: string | null }> = [];

    return (
        <div className="space-y-12 pb-24 md:pb-10 relative">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-red-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

            <div
                className="flex flex-col gap-6 md:flex-row md:justify-between md:items-end mb-4 md:mb-6"
            >
                <div className="space-y-1">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Mis Rutinas</h2>
                    <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-[10px] ml-1">
                        Explora tus: <span className="text-red-500">Rutinas & Programación</span>
                    </p>
                </div>

                <div className="flex gap-4 items-center w-full md:w-auto">
                    <Link href="/routines/new" className="w-full md:w-auto">
                        <Button className="group relative w-full md:w-auto overflow-hidden rounded-2xl bg-red-600 px-8 h-14 text-xs font-black text-white shadow-2xl shadow-red-900/40 transition-all duration-300 active:scale-95 group hover:bg-red-700">
                            <span className="relative z-10 flex items-center gap-3 uppercase tracking-[0.2em]">
                                <Plus className="w-5 h-5" />
                                Nueva Rutina
                                <ChevronRight className="w-5 h-5" />
                            </span>
                        </Button>
                    </Link>
                </div>
            </div>

            {routines.length === 0 ? (
                <div
                    className="relative p-12 md:p-24 bg-neutral-900/20 backdrop-blur-3xl rounded-4xl border border-white/5 overflow-hidden group shadow-2xl"
                >
                    <div className="absolute inset-0 bg-linear-to-br from-red-600/5 via-transparent to-transparent" />
                    <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
                        <div className="w-24 h-24 rounded-3xl bg-neutral-900/50 border border-white/10 flex items-center justify-center mb-8 shadow-2xl">
                            <ClipboardList className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Núcleo Vacío</h3>
                        <p className="text-neutral-500 font-medium text-sm leading-relaxed mb-10">
                            No se han creado rutinas. Puedes crear una rutina manualmente o utilizar la IA.
                        </p>
                        <Link href="/routines/new">
                            <Button className="h-14 px-10 rounded-2xl bg-white text-black hover:bg-neutral-200 font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl hover:shadow-white/10 flex items-center gap-3">
                                <Zap className="w-4 h-4" />
                                Crear Rutina
                            </Button>
                        </Link>
                    </div>
                    </div>
            ) : (
                <div className="space-y-16">
                    {/* Weekly Routines Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 group">
                            <div className="h-8 w-1 bg-red-600 rounded-full" />
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Planificación Semanal</h2>
                            <div className="px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-black tabular-nums">
                                {routines.filter((r: any) => r.type !== 'daily').length}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {routines
                                .filter((r: any) => r.type !== 'daily')
                                .map((routine: any) => (
                                    <RoutineCard key={routine.id} routine={routine} athletes={athletes || []} />
                                ))}
                            {routines.filter((r: any) => r.type !== 'daily').length === 0 && (
                                <div className="col-span-full py-16 text-center border-2 border-dashed border-white/5 rounded-4xl bg-white/5 backdrop-blur-sm">
                                    <p className="text-neutral-500 font-black uppercase tracking-[0.3em] text-[10px] italic">Sin Rutinas Semanales</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Daily Routines Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 group">
                            <div className="h-8 w-1 bg-amber-500 rounded-full" />
                            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Sesiones Diarias</h2>
                            <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black tabular-nums">
                                {routines.filter((r: any) => r.type === 'daily').length}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {routines
                                .filter((r: any) => r.type === 'daily')
                                .map((routine: any) => (
                                    <RoutineCard key={routine.id} routine={routine} athletes={athletes || []} />
                                ))}
                            {routines.filter((r: any) => r.type === 'daily').length === 0 && (
                                <div className="col-span-full py-16 text-center border-2 border-dashed border-white/5 rounded-4xl bg-white/5 backdrop-blur-sm">
                                    <p className="text-neutral-500 font-black uppercase tracking-[0.3em] text-[10px] italic">Sin Rutinas Diarias</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
