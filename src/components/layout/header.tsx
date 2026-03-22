"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Isotipo } from "@/components/ui/isotipo";
import { UserNav } from "@/components/layout/user-nav";
import { usePathname } from "next/navigation";

interface HeaderProps {
    user?: any;
}

export function Header({ user }: HeaderProps) {
    const pathname = usePathname();
    const role = user?.role;
    const isDashboard = pathname === "/dashboard";

    return (
        <header className="flex h-16 items-center justify-between gap-4 px-6 md:px-10 py-3 bg-transparent w-full">
            {/* Logo for mobile only since Sidebar is hidden */}
            <Link href="/dashboard" className="md:hidden flex items-center gap-2 hover:opacity-80 transition-opacity">
<div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
    <Isotipo />
</div>
<span className="text-xl font-bold tracking-tighter text-white">Atlas IA</span>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4 ml-auto md:ml-0">
                <NotificationBell role={role} />

                <div className="h-8 w-px bg-neutral-800 mx-2 hidden sm:block" />

                <UserNav user={user} />
            </div>
        </header>
    );
}
