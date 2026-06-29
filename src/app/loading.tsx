import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black">
            <Skeleton className="h-12 w-48 bg-neutral-900 rounded-2xl" />
        </div>
    );
}
