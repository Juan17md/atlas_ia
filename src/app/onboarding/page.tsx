import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OnboardingWrapper } from "@/components/onboarding/onboarding-wrapper";

export default async function OnboardingPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/");
    }

    if (session.user.onboardingCompleted) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-black relative overflow-hidden flex flex-col items-center justify-center p-4 md:p-6">
            <div className="absolute top-0 right-0 -z-10 h-[300px] md:h-[500px] w-[300px] md:w-[500px] bg-red-600/10 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 -z-10 h-[300px] md:h-[500px] w-[300px] md:w-[500px] bg-blue-600/5 blur-[80px] md:blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-4xl z-10 pt-4 md:pt-0">
                <div className="text-center mb-6 md:mb-10">
                    <h1 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter mb-1 md:mb-2">
                        Configura tu <span className="text-red-600">Perfil Atlético</span>
                    </h1>
                    <p className="text-xs md:text-base text-neutral-400 max-w-[280px] md:max-w-none mx-auto">
                        Ayúdanos a personalizar tu experiencia y calibrar la IA.
                    </p>
                </div>

                <OnboardingWrapper />
            </div>
        </div>
    );
}

