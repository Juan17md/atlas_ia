import { auth } from "@/lib/auth";
import { getExercises } from "@/actions/exercise-actions";
import { ExerciseList } from "@/components/exercises/exercise-list";
import { ExerciseFormDialog } from "@/components/exercises/exercise-form-dialog";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import { ClientMotionDiv } from "@/components/ui/client-motion";

export default async function ExercisesPage() {
    const session = await auth();

    // Auth Check
    if (!session?.user?.id) redirect("/login");

    // Access Check: Solo usuarios autenticados pueden gestionar su biblioteca
    if (!session.user.id) {
        redirect("/dashboard");
    }

    const { exercises, error } = await getExercises();

    return (
        <div className="space-y-12 pb-24 md:pb-10 relative">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            <ClientMotionDiv
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 md:gap-6 md:flex-row md:justify-between md:items-end mb-4 md:mb-6"
            >
                <div className="space-y-0.5 md:space-y-1">
                    <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Biblioteca</h2>
                    <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-[8px] md:text-[10px] ml-1">
                        Gestión Técnica: <span className="text-red-500">Ejercicios</span>
                    </p>
                </div>

                <div className="flex gap-4 items-center w-full md:w-auto">
                    <ExerciseFormDialog
                        trigger={
                            <Button className="group relative w-full md:w-auto overflow-hidden rounded-2xl bg-red-600 px-8 h-14 text-xs font-black text-white shadow-2xl shadow-red-900/40 transition-all duration-300 active:scale-95 group hover:bg-red-700">
                                <span className="relative z-10 flex items-center gap-3 uppercase tracking-[0.2em]">
                                    <Plus className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                                    Nuevo Ejercicio
                                    <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                                </span>
                            </Button>
                        }
                    />
                </div>
            </ClientMotionDiv>

            {error ? (
                <div className="p-8 bg-red-900/20 border border-red-500/20 rounded-4xl text-red-500 font-bold text-center">
                    {error}
                </div>
            ) : (
                <ExerciseList exercises={exercises || []} />
            )}
        </div>
    );
}
