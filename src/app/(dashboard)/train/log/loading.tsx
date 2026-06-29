import { Skeleton } from "@/components/ui/skeleton";

export default function TrainLogLoading() {
    return (
        <div className="flex flex-col gap-8 pb-32">
            <Skeleton className="h-8 w-48 bg-neutral-800" />
            <Skeleton className="h-64 w-full rounded-4xl bg-neutral-900" />
        </div>
    );
}
