"use client";

import { Button } from "@/components/ui/button";
import { Moon, Loader2 } from "lucide-react";
import { useState } from "react";
import { markAsRestDay } from "@/actions/training-logs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface MarkRestButtonProps {
    dateStr?: string;
    className?: string;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
    showLabel?: boolean;
}

export function MarkRestButton({ 
    dateStr, 
    className, 
    variant = "default",
    showLabel = true,
    children
}: MarkRestButtonProps & { children?: React.ReactNode }) {
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const handleMarkRest = async () => {
        setIsPending(true);
        try {
            const res = await markAsRestDay(dateStr);
            if (res.success) {
                toast.success("Día de descanso registrado");
                router.refresh();
            } else {
                toast.error(res.error || "Error al registrar descanso");
            }
        } catch (error) {
            toast.error("Error de conexión");
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Button
            variant={variant}
            disabled={isPending}
            onClick={handleMarkRest}
            className={cn("gap-2", className)}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : children ? (
                children
            ) : (
                <>
                    <Moon className="w-4 h-4" />
                    {showLabel && "Marcar como Descanso"}
                </>
            )}
        </Button>
    );
}

