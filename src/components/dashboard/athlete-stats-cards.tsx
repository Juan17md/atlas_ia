"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { Dumbbell, TrendingUp, Trophy, Flame } from "lucide-react";

interface AthleteStatsCardsProps {
    weeklyCompleted: number;
    weeklyVolume: number;
    prsLength: number;
}

export function AthleteStatsCards({ weeklyCompleted, weeklyVolume, prsLength }: AthleteStatsCardsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
                title="Sesiones"
                value={weeklyCompleted?.toString() || "0"}
                label="Esta semana"
                trend="neutral"
                icon={Dumbbell}
                color="red"
            />
            <StatCard
                title="Volumen"
                value={`${Math.round(weeklyVolume / 1000)}k`}
                label="Kg semanal"
                trend="neutral"
                icon={TrendingUp}
            />
            <StatCard
                title="Récords"
                value={prsLength?.toString() || "0"}
                label="Personales"
                trend={(prsLength || 0) > 0 ? "up" : "neutral"}
                trendValue={(prsLength || 0) > 0 ? "New" : undefined}
                icon={Trophy}
                color="yellow"
            />
            <StatCard
                title="Racha"
                value="—"
                label="Días seguidos"
                trend="neutral"
                icon={Flame}
            />
        </div>
    );
}
