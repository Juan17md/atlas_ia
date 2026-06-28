"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error("Dashboard error:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <AlertCircle className="size-12 text-red-500" />
            <h2 className="text-xl font-semibold">Algo salió mal</h2>
            <p className="text-muted-foreground text-sm">No se pudieron cargar los datos del dashboard.</p>
            <Button onClick={reset} variant="default" className="mt-2">
                Reintentar
            </Button>
        </div>
    );
}
