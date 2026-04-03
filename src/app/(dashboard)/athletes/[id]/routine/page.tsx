import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RoutineEditor } from "@/components/routines/routine-editor";
import { getAthleteRoutine } from "@/actions/routine-actions";
import { getExercises } from "@/actions/exercise-actions";
import type { RoutineFormData } from "@/components/routines/routine-editor-types";

export default async function AthleteRoutinePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "coach") redirect("/dashboard");

    const routine = await getAthleteRoutine(id);
    const availableExercises = await getExercises();

    const routineData = routine as any;
    const initialData: RoutineFormData | undefined = routineData ? {
        name: routineData.name,
        description: routineData.description,
        type: routineData.type || "weekly",
        schedule: routineData.schedule || [],
    } : undefined;

    return (
        <RoutineEditor
            initialData={initialData}
            isEditing={!!routineData}
            availableExercises={availableExercises.exercises || []}
            athleteId={id}
        />
    );
}