import { Skeleton } from "@/components/ui/skeleton";

export default function DayDetailLoading() {
    return (
        <div className="flex flex-col gap-8 pb-32">
            <Skeleton className="h-8 w-64 bg-neutral-800" />
            <Skeleton className="h-96 w-full rounded-4xl bg-neutral-900" />
        </div>
    );
}
