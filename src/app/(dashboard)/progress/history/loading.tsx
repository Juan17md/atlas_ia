import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryLoading() {
    return (
        <div className="flex flex-col gap-8 pb-32">
            <Skeleton className="h-8 w-48 bg-neutral-800" />
            <Skeleton className="h-6 w-32 bg-neutral-800" />
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 w-full rounded-4xl bg-neutral-900" />
            ))}
        </div>
    );
}
