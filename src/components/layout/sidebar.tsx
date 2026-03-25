"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import {
    LayoutDashboard,
    Dumbbell,
    BarChart2,
    Users,
    LogOut,
    Target,
    UserCircle,
    ClipboardList,
    History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Isotipo } from "@/components/ui/isotipo";
import { UserNav } from "@/components/layout/user-nav";

interface SidebarProps {
    role?: string;
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export function Sidebar({ role, user }: SidebarProps) {
    const pathname = usePathname();

    const commonItems = [
        { label: "DASHBOARD", href: "/dashboard", icon: LayoutDashboard, prefetch: true },
    ];

    const coachItems = [
        ...commonItems,
        { label: "ATLETAS", href: "/athletes", icon: Users, prefetch: true },
        { label: "RUTINAS", href: "/routines", icon: ClipboardList, prefetch: true },
        { label: "EJERCICIOS", href: "/exercises", icon: Dumbbell, prefetch: false },
        { label: "PROGRESO", href: "/progress", icon: BarChart2, prefetch: false },
        { label: "USUARIOS", href: "/users", icon: Users, prefetch: true },
    ];

    const athleteItems = [
        ...commonItems,
        { label: "ENTRENAR", href: "/train", icon: Dumbbell, prefetch: true },
        { label: "MI RUTINA", href: "/my-routine", icon: ClipboardList, prefetch: true },
        { label: "HISTORIAL", href: "/history", icon: History, prefetch: false },
        { label: "ANÁLISIS", href: "/progress", icon: BarChart2, prefetch: false },
    ];

    const advancedAthleteItems = [
        ...athleteItems,
        { label: "RUTINAS", href: "/routines", icon: ClipboardList, prefetch: true },
        { label: "EJERCICIOS", href: "/exercises", icon: Dumbbell, prefetch: false },
    ];

    const menuItems = role === "coach"
        ? coachItems
        : role === "advanced_athlete"
            ? advancedAthleteItems
            : athleteItems;

    const generalItems = [
        { label: "PERFIL", href: "/profile", icon: UserCircle, prefetch: false },
    ];

    return (
        <aside className="hidden md:block md:fixed md:top-0 md:left-0 md:h-screen md:w-55 flex flex-col bg-black relative overflow-hidden z-50">
            {/* Geometric Accents */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-linear-to-b from-red-600/5 to-transparent pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Logo Section */}
            <div className="p-8 relative z-10 shrink-0">
                <Link href="/dashboard" className="flex items-center gap-4 group transition-all">
<div className="relative">
    <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-500">
        <Isotipo />
    </div>
    <div className="absolute -inset-1 bg-white/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
</div>
<div className="flex flex-col">
    <span className="text-2xl font-black text-white tracking-tighter italic leading-none">Atlas IA</span>
</div>
                </Link>
            </div>

            <div className="px-6 flex-1 overflow-y-auto relative z-10 space-y-12 py-6 scrollbar-none">
                {/* Menu Central */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-600 italic">
                            Rutinas
                        </h3>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <nav className="space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch={item.prefetch}
                                    className={cn(
                                        "flex items-center gap-4 px-5 py-4 rounded-3xl transition-all duration-300 group relative overflow-hidden",
                                        isActive
                                            ? "bg-white/5 text-white shadow-inner"
                                            : "text-neutral-500 hover:text-white"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-pill"
                                            className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-red-600 rounded-r-full shadow-[4px_0_12px_rgba(220,38,38,0.5)]"
                                        />
                                    )}
                                    <Icon className={cn("h-5 w-5 transition-transform duration-300 shrink-0", isActive ? "text-red-500 scale-125" : "text-neutral-600 group-hover:text-white group-hover:scale-110")} />
                                    <span className={cn("text-xs font-black uppercase italic tracking-widest", isActive ? "text-white" : "group-hover:translate-x-1 transition-transform")}>
                                        {item.label}
                                    </span>

                                    {isActive && (
                                        <div className="ml-auto">
                                            <div className="h-1 w-1 rounded-full bg-red-600 animate-pulse" />
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Opciones */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 px-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-600 italic">
                            Operador
                        </h3>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>
                    <nav className="space-y-2">
                        {generalItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    prefetch={item.prefetch}
                                    className={cn(
                                        "flex items-center gap-4 px-5 py-4 rounded-3xl transition-all duration-300 group relative overflow-hidden",
                                        isActive
                                            ? "bg-white/5 text-white"
                                            : "text-neutral-500 hover:text-white"
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-pill-gen"
                                            className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-red-600 rounded-r-full shadow-[4px_0_12px_rgba(220,38,38,0.5)]"
                                        />
                                    )}
                                    <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-red-500 scale-125" : "text-neutral-600 group-hover:text-white group-hover:scale-110")} />
                                    <span className={cn("text-xs font-black uppercase italic tracking-widest", isActive ? "text-white" : "group-hover:translate-x-1 transition-transform")}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* User Profile Section - Fixed at bottom */}
            <div className="mt-auto p-4 relative z-10 border-t border-white/5 space-y-4">
                <UserNav user={user} />
                <button
                    onClick={() => signOut({ redirectTo: "/" })}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-neutral-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 group"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="text-xs font-black uppercase italic tracking-widest">
                        Cerrar Sesión
                    </span>
                </button>
                <p className="text-[10px] text-neutral-600 text-center uppercase tracking-widest pt-2">
                    Designed by <span className="text-white font-black italic">Juan17md</span>
                </p>
            </div>
        </aside>
    );
}
