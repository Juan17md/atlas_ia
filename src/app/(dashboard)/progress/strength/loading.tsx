import { Skeleton } from "@/components/ui/skeleton";

export default function StrengthLoading() {
    return (
        <div className="flex flex-col gap-8 pb-32">
            <Skeleton className="h-8 w-56 bg-neutral-800" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-80 rounded-4xl bg-neutral-900" />
                ))}
            </div>
        </div>
    );
}
