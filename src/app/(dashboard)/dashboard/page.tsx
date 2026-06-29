import { auth } from "@/lib/auth";
import { getWeeklyActivity, getWeeklyProgress } from "@/actions/analytics-actions";
import { getActiveRoutine } from "@/actions/athlete-actions";
import { AthleteDashboardUI } from "@/components/dashboard/dashboard-ui-shell";
import type { DashboardUser } from "@/types";

async function AthleteDashboard({ user }: { user: DashboardUser | undefined }) {
    const userId = user?.id ?? "";
    const [routineRes, activityRes, progressRes] = await Promise.all([
        getActiveRoutine(),
        getWeeklyActivity(userId),
        getWeeklyProgress(userId)
    ]);

    const { routine } = routineRes;
    const { data: activityData } = activityRes;
    const { completed: weeklyCompleted = 0, target: weeklyTarget = 0 } = progressRes;

    return (
        <AthleteDashboardUI
            user={user}
            activityData={activityData}
            weeklyCompleted={weeklyCompleted}
            weeklyTarget={weeklyTarget}
            routine={routine}
        />
    );
}

export default async function DashboardPage() {
    const session = await auth();

    return <AthleteDashboard user={session?.user} />;
}
