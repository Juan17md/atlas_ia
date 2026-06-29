import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressLoading() {
    return (
        <div className="flex flex-col gap-12 pb-32">
            <div className="space-y-4">
                <Skeleton className="h-4 w-32 bg-neutral-800" />
                <Skeleton className="h-10 w-64 bg-neutral-800" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-40 rounded-4xl bg-neutral-900" />
                ))}
            </div>
            <Skeleton className="h-80 w-full rounded-4xl bg-neutral-900" />
        </div>
    );
}
