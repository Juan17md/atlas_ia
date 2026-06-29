import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-32">
            <div className="space-y-4">
                <Skeleton className="h-4 w-24 bg-neutral-800" />
                <Skeleton className="h-10 w-72 bg-neutral-800" />
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-14 w-full rounded-3xl bg-neutral-900" />
            </div>
            <Skeleton className="h-[600px] w-full rounded-4xl bg-neutral-900" />
        </div>
    );
}
