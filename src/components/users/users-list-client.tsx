"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { UserRoleSelect } from "@/components/users/user-role-select";
import { DeleteUserButton } from "@/components/users/delete-user-button";
import { cn } from "@/lib/utils";
import { Shield, Mail } from "lucide-react";

interface UsuarioItem {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
}

interface UsersListClientProps {
    usuarios: UsuarioItem[];
}

export function UsersListClient({ usuarios }: UsersListClientProps) {
    const badgeClase = (rol: string) =>
        cn(
            "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic border transition-all duration-500",
            rol === "coach"
                ? "bg-red-600/10 text-red-500 border-red-600/20"
                : rol === "advanced_athlete"
                  ? "bg-blue-600/10 text-blue-500 border-blue-600/20"
                  : "bg-neutral-900/50 text-neutral-500 border-white/5"
        );

    const badgeIcono = (rol: string) => {
        if (rol === "coach") return <Shield className="w-3 h-3 mr-2 inline" />;
        return null;
    };

    const badgeEtiqueta = (rol: string) => {
        if (rol === "coach") return "Coach";
        if (rol === "advanced_athlete") return "Avanzado";
        return "Recluta";
    };

    return (
        <>
            {/* Vista Móvil: Tarjetas */}
            <div className="md:hidden space-y-3 pb-4">
                {usuarios.map((usuario) => (
                    <div
                        key={usuario.id}
                        className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-3xl p-4 space-y-3 hover:border-red-500/20 transition-all"
                    >
                        {/* Header: Avatar + Nombre + Badge */}
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar className="h-10 w-10 border border-white/5 rounded-xl shrink-0">
                                    <AvatarImage src={usuario.image ?? undefined} className="object-cover" />
                                    <AvatarFallback className="bg-neutral-950 text-white font-black italic text-xs">
                                        {usuario.name?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <span className="font-black text-white uppercase italic tracking-tight text-sm truncate block">
                                        {usuario.name}
                                    </span>
                                    <span className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">
                                        Activo
                                    </span>
                                </div>
                            </div>
                            <Badge className={badgeClase(usuario.role)}>
                                {badgeIcono(usuario.role)}
                                {badgeEtiqueta(usuario.role)}
                            </Badge>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-2 text-neutral-400">
                            <Mail className="w-3 h-3 text-neutral-600 shrink-0" />
                            <span className="text-[11px] font-medium lowercase italic truncate">
                                {usuario.email}
                            </span>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                            <UserRoleSelect
                                userId={usuario.id}
                                currentRole={usuario.role}
                            />
                            <DeleteUserButton
                                userId={usuario.id}
                                userName={usuario.name || "Usuario"}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Vista Desktop: Tabla */}
            <div className="hidden md:block bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 bg-linear-to-b from-white/2 to-transparent pointer-events-none" />

                <Table className="relative z-10">
                    <TableHeader className="bg-white/2">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-6 pl-10">
                                Perfil
                            </TableHead>
                            <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-6">
                                Identificador
                            </TableHead>
                            <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-6">
                                Rango Actual
                            </TableHead>
                            <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-6 text-right">
                                Modificar Permisos
                            </TableHead>
                            <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-6 text-right pr-10">
                                Acciones
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {usuarios.map((usuario) => (
                            <TableRow
                                key={usuario.id}
                                className="border-white/5 hover:bg-white/5 transition-colors group"
                            >
                                <TableCell className="py-6 pl-10">
                                    <div className="flex items-center gap-5">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-red-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <Avatar className="h-12 w-12 border-2 border-white/5 group-hover:border-red-600/30 transition-all duration-500 rounded-xl relative z-10">
                                                <AvatarImage
                                                    src={usuario.image ?? undefined}
                                                    className="object-cover"
                                                />
                                                <AvatarFallback className="bg-neutral-950 text-white font-black italic">
                                                    {usuario.name?.[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-white uppercase italic tracking-tight group-hover:text-red-500 transition-colors duration-300">
                                                {usuario.name}
                                            </span>
                                            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-0.5">
                                                Activo
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="py-6">
                                    <div className="flex items-center gap-2.5 text-neutral-400 group-hover:text-white transition-colors duration-300">
                                        <Mail className="w-3.5 h-3.5 text-neutral-600 group-hover:text-red-500 transition-colors" />
                                        <span className="text-xs font-medium lowercase italic">
                                            {usuario.email}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="py-6">
                                    <Badge
                                        className={cn(
                                            badgeClase(usuario.role),
                                            "group-hover:bg-red-600/20 group-hover:text-white"
                                        )}
                                    >
                                        {badgeIcono(usuario.role)}
                                        {badgeEtiqueta(usuario.role)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="py-6 pr-10 text-right">
                                    <div className="flex justify-end items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300 scale-90 group-hover:scale-100 origin-right">
                                        <UserRoleSelect
                                            userId={usuario.id}
                                            currentRole={usuario.role}
                                        />
                                    </div>
                                </TableCell>
                                <TableCell className="py-6 pr-10 text-right">
                                    <div className="flex justify-end items-center opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                                        <DeleteUserButton
                                            userId={usuario.id}
                                            userName={usuario.name || "Usuario"}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
