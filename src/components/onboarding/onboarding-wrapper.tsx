"use client";

import dynamic from "next/dynamic";
import { LoaderPremium } from "@/components/ui/loader-premium";

const OnboardingWizard = dynamic(
    () => import("@/components/onboarding/onboarding-wizard").then((mod) => mod.OnboardingWizard),
    {
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center min-h-[500px]">
                <LoaderPremium size="lg" text="Preparando tu experiencia" />
            </div>
        ),
    }
);

export function OnboardingWrapper() {
    return <OnboardingWizard />;
}
