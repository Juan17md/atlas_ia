import { RoutineEditor } from "@/components/routines/routine-editor";
import type { RoutineFormData } from "@/components/routines/routine-editor-types";
import { auth } from "@/lib/auth";
import { getRoutine, getRoutines } from "@/actions/routine-actions";
import { getExercises } from "@/actions/exercise-actions";
import { redirect } from "next/navigation";

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EditRoutinePage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;
    const dayStr = resolvedSearchParams?.day;
    const initialDayIndex = dayStr ? parseInt(dayStr as string) : undefined;

    const session = await auth();

    if (!session?.user?.id) redirect("/login");
    const role = session.user.role as string;
    if (role !== "coach" && role !== "advanced_athlete") redirect("/dashboard");

    const { routine, error } = await getRoutine(id) as { routine?: { name: string; description?: string; type?: string; schedule: any[] }; error?: string };
    const { exercises } = await getExercises();
    const { routines: availableRoutines } = await getRoutines();

    if (error || !routine) {
        return <div>Error: {error || "Rutina no encontrada"}</div>;
    }

    const initialData: RoutineFormData = {
        name: routine.name,
        description: routine.description,
        type: routine.type || "weekly",
        schedule: routine.schedule || [],
    };

    const transformedRoutines: RoutineFormData[] = (availableRoutines || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        type: r.type || "weekly",
        schedule: r.schedule || [],
    }));

    return <RoutineEditor initialData={initialData} isEditing availableExercises={exercises || []} availableRoutines={transformedRoutines} initialDayIndex={initialDayIndex} />;
}
