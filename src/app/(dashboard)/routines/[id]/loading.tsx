import { Skeleton } from "@/components/ui/skeleton";

export default function RoutineDetailLoading() {
    return (
        <div className="flex flex-col gap-8 pb-32">
            <Skeleton className="h-8 w-64 bg-neutral-800" />
            <Skeleton className="h-64 w-full rounded-4xl bg-neutral-900" />
            <Skeleton className="h-48 w-full rounded-4xl bg-neutral-900" />
        </div>
    );
}
