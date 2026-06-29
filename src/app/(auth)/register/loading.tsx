import { Skeleton } from "@/components/ui/skeleton";

export default function RegisterLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <Skeleton className="h-[600px] w-full max-w-md rounded-4xl bg-neutral-900" />
        </div>
    );
}
