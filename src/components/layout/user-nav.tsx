"use client";

import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface UserNavProps {
    user?: any;
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
    coach: { label: "Entrenador", color: "text-blue-400 border-blue-400/30 bg-blue-400/10" },
    advanced_athlete: { label: "Atleta Avanzado", color: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
    athlete: { label: "Atleta", color: "text-neutral-400 border-neutral-400/30 bg-neutral-400/10" },
};

export function UserNav({ user }: UserNavProps) {
    const userRoleKey = (user?.role || "athlete").toLowerCase();
    const roleInfo = ROLE_CONFIG[userRoleKey] || ROLE_CONFIG.athlete;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 sm:pl-2 cursor-pointer hover:opacity-80 transition-opacity">
                    <div className="hidden sm:flex flex-col items-end text-right">
                        <p className="text-sm font-semibold text-white leading-none">{user?.name || "Usuario"}</p>
                        <div className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] uppercase font-black tracking-widest ${roleInfo.color}`}>
                            {roleInfo.label}
                        </div>
                    </div>
                    <OptimizedAvatar
                        src={user?.image}
                        alt={user?.name || "Usuario"}
                        size={40}
                        priority={true}
                        className="border-2 border-neutral-800"
                        fallback={user?.name?.[0]?.toUpperCase() || <UserCircle className="w-6 h-6 text-neutral-400" />}
                    />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-neutral-950 border-neutral-800 text-white rounded-xl shadow-xl shadow-black/50">
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name || "Mi Cuenta"}</p>
                        <p className="text-xs leading-none text-neutral-400">{user?.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-neutral-800" />
                <Link href="/profile">
                    <DropdownMenuItem className="cursor-pointer hover:bg-neutral-800 focus:bg-neutral-800 focus:text-white rounded-lg my-1">
                        <UserCircle className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                    </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-neutral-800" />
                <DropdownMenuItem className="cursor-pointer hover:bg-red-900/20 focus:bg-red-900/20 text-red-500 focus:text-red-500 rounded-lg my-1" onClick={() => signOut({ redirectTo: "/" })}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
