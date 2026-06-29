import { Skeleton } from "@/components/ui/skeleton";

export default function OnboardingLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <Skeleton className="h-[700px] w-full max-w-4xl rounded-4xl bg-neutral-900" />
        </div>
    );
}
