"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderPremiumProps {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
    text?: string;
    fullPage?: boolean;
}

const sizeMap = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
};

export function LoaderPremium({ className, size = "md", text, fullPage }: LoaderPremiumProps) {
    const loaderContent = (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <Loader2 className={cn("animate-spin text-red-600", sizeMap[size])} />
            {text && (
                <p className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500">
                    {text}
                </p>
            )}
        </div>
    );

    if (fullPage) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                {loaderContent}
            </div>
        );
    }

    return loaderContent;
}
