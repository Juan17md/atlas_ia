"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, ClipboardList, Dumbbell, BarChart2, History, UserCircle, Menu } from "lucide-react";
import * as React from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { ROLE_CONFIG } from "@/components/layout/user-nav";

interface MobileNavProps {
    role?: string;
    user?: any;
}

export function MobileNav({ role, user }: MobileNavProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const pathname = usePathname();
    const userRoleKey = (user?.role || "athlete").toLowerCase();
    const roleInfo = ROLE_CONFIG[userRoleKey] || ROLE_CONFIG.athlete;

    const commonItems = [
        { label: "Inicio", href: "/dashboard", icon: LayoutDashboard },
    ];

    const coachItems = [
        ...commonItems,
        { label: "Atletas", href: "/athletes", icon: Users },
        { label: "Rutinas", href: "/routines", icon: ClipboardList },
        { label: "Ejercicios", href: "/exercises", icon: Dumbbell },
        { label: "Progreso", href: "/progress", icon: BarChart2 },
    ];

    // For coach, limit to 4 items in main bar, maybe put Analytics in "More"?
    // Let's stick to 4 main + More for Coach if needed, or 5.
    // Coach: Home, Athletes, Routines, Exercises, Stats. That's 5. Fits.

    const athleteItems = [
        ...commonItems,
        { label: "Rutina", href: "/my-routine", icon: ClipboardList },
        { label: "Entrenar", href: "/train", icon: Dumbbell },
        { label: "Actividad", href: "/history", icon: History },
        { label: "Avance", href: "/progress", icon: BarChart2 },
        { label: "Perfil", href: "/profile", icon: UserCircle },
    ];

    const advancedAthleteItems = [
        ...athleteItems,
        { label: "Rutinas", href: "/routines", icon: ClipboardList },
        { label: "Ejercicios", href: "/exercises", icon: Dumbbell },
    ];

    const items = role === "coach"
        ? coachItems
        : role === "advanced_athlete"
            ? advancedAthleteItems
            : athleteItems;

    // Solo mostrar los primeros 4 en la barra inferior, el resto irá al "Menú"
    const barItems = items.slice(0, 4);
    // Todos los items para el menú desplegable
    const menuItems = items;

    return (
        <div className="md:hidden fixed bottom-6 left-6 right-6 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-4xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 h-16 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)]">
            {barItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
                            isActive ? "text-red-500" : "text-neutral-500"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-2xl transition-all duration-300",
                            isActive ? "bg-red-500/10 scale-110" : "hover:bg-white/5"
                        )}>
                            <Icon className={cn("w-5 h-5", isActive && "text-red-500")} />
                        </div>
                    </Link>
                );
            })}

            {/* Menú Hamburguesa / Más */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                    <button className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-neutral-500 hover:text-white transition-all">
                        <div className="p-2 rounded-2xl hover:bg-white/5 transition-all duration-300">
                            <Menu className="w-5 h-5" />
                        </div>
                    </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-neutral-950/95 backdrop-blur-3xl border-white/5 rounded-t-[3rem] p-0 outline-none h-auto max-h-[90vh] overflow-y-auto scrollbar-none">
                    <div className="w-12 h-1.5 bg-neutral-800 rounded-full mx-auto mt-4 mb-2 opacity-50" />

                    <div className="p-8 pb-16 space-y-6">
                        <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>

                        {/* Perfil Header en Menú */}
                        <div className="flex items-center gap-4 p-6 bg-white/5 rounded-3xl border border-white/5">
                            <OptimizedAvatar src={user?.image} alt={user?.name || "Juan"} size={60} className="border-2 border-red-500/30" />
                            <div>
                                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">{user?.name || "Premium User"}</h3>
                                <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] uppercase font-black tracking-widest ${roleInfo.color}`}>
                                    {roleInfo.label}
                                </div>
                            </div>
                            <Link
                                href="/profile"
                                onClick={() => setIsOpen(false)}
                                className="ml-auto h-10 w-10 bg-neutral-900 rounded-full flex items-center justify-center text-white border border-white/10"
                            >
                                <UserCircle className="w-5 h-5" />
                            </Link>
                        </div>

                        {/* Listado de secciones */}
                        <div className="grid grid-cols-2 gap-3">
                            {menuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300 group",
                                            isActive
                                                ? "bg-red-600 border-red-500 text-white shadow-xl shadow-red-900/20"
                                                : "bg-neutral-900/50 border-white/5 text-neutral-400 hover:bg-neutral-800"
                                        )}
                                    >
                                        <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-neutral-500 group-hover:text-red-500")} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="h-px bg-white/5 w-full" />

                        {/* Logout Section */}
                        <button
                            onClick={() => signOut({ redirectTo: "/" })}
                            className="w-full flex items-center justify-between p-6 bg-red-950/20 border border-red-900/30 rounded-3xl group hover:bg-red-600 transition-all duration-500"
                        >
                            <span className="text-xs font-black text-red-500 group-hover:text-white uppercase tracking-[0.3em]">Cerrar Sesión</span>
                            <LogOut className="w-5 h-5 text-red-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
