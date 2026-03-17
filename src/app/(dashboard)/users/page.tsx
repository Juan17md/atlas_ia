import { getAllUsers } from "@/actions/user-actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Shield, Mail, Activity, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { ClientMotionDiv } from "@/components/ui/client-motion";

export default async function UsersManagementPage() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "coach") {
        redirect("/dashboard");
    }

    const { users, error } = await getAllUsers();

    if (error) {
        return (
            <div className="p-12 text-center bg-red-600/10 border border-red-600/20 rounded-4xl backdrop-blur-3xl">
                <Shield className="w-12 h-12 text-red-500 mx-auto mb-6 opacity-50" />
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Error de Sincronización</h3>
                <p className="text-red-500 font-bold uppercase tracking-widest text-[10px]">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-24 md:pb-10 relative">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-red-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

            {/* Header Area */}
            <ClientMotionDiv
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-8"
            >
                <div className="space-y-1">
                    <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Jerarquía</h2>
                    <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-[10px] ml-1">
                        Control Central: <span className="text-red-500">Gestión de Acceso y Autorizaciones</span>
                    </p>
                </div>

                <div className="w-full md:w-80 group relative">
                    <div className="absolute inset-0 bg-red-600/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 group-focus-within:text-red-500 transition-colors duration-300 z-10" />
                    <Input
                        placeholder="Filtrar por núcleo o terminal..."
                        className="relative z-10 pl-12 h-14 bg-neutral-900/40 backdrop-blur-3xl border-white/5 text-white rounded-2xl focus-visible:ring-red-600/30 transition-all placeholder:text-neutral-700 font-medium"
                    />
                </div>
            </ClientMotionDiv>

            {/* Users Console Table */}
            <ClientMotionDiv
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl overflow-hidden shadow-2xl relative"
            >
                <div className="absolute inset-0 bg-linear-to-b from-white/2 to-transparent pointer-events-none" />

                <Table className="relative z-10">
                    <TableHeader className="bg-white/2">
                        <TableRow className="border-white/5 hover:bg-transparent">
                            <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-6 pl-10">Perfil</TableHead>
                            <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-6">Identificador</TableHead>
                            <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-6">Rango Actual</TableHead>
                            <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-6 text-right">Modificar Permisos</TableHead>
                            <TableHead className="text-neutral-500 font-black uppercase tracking-[0.2em] text-[10px] py-6 text-right pr-10">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!users || users.length === 0 ? (
                            <TableRow className="hover:bg-transparent">
                                <TableCell colSpan={5} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-neutral-600">
                                        <div className="w-16 h-16 rounded-2xl bg-neutral-900/50 flex items-center justify-center mb-6">
                                            <Users className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="font-black uppercase tracking-widest text-xs italic">Cero Unidades Detectadas</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            users.map((user) => (
                                <TableRow key={user.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell className="py-6 pl-10">
                                        <div className="flex items-center gap-5">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-red-600/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <Avatar className="h-12 w-12 border-2 border-white/5 group-hover:border-red-600/30 transition-all duration-500 rounded-xl relative z-10">
                                                    <AvatarImage src={user.image} className="object-cover" />
                                                    <AvatarFallback className="bg-neutral-950 text-white font-black italic">
                                                        {user.name?.[0]?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-white uppercase italic tracking-tight group-hover:text-red-500 transition-colors duration-300">{user.name}</span>
                                                <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest mt-0.5">Activo</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-6">
                                        <div className="flex items-center gap-2.5 text-neutral-400 group-hover:text-white transition-colors duration-300">
                                            <Mail className="w-3.5 h-3.5 text-neutral-600 group-hover:text-red-500 transition-colors" />
                                            <span className="text-xs font-medium lowercase italic">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-6">
                                        <Badge
                                            className={cn(
                                                "px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] italic border transition-all duration-500",
                                                user.role === "coach"
                                                    ? "bg-red-600/10 text-red-500 border-red-600/20 group-hover:bg-red-600/20"
                                                    : user.role === "advanced_athlete"
                                                        ? "bg-blue-600/10 text-blue-500 border-blue-600/20 group-hover:bg-blue-600/20"
                                                        : "bg-neutral-900/50 text-neutral-500 border-white/5 group-hover:text-white"
                                            )}
                                        >
                                            {user.role === "coach" ? <Shield className="w-3 h-3 mr-2 inline" /> : null}
                                            {user.role === "coach" ? "Coach" : user.role === "advanced_athlete" ? "Avanzado" : "Recluta"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-6 pr-10 text-right">
                                        <div className="flex justify-end items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300 scale-90 group-hover:scale-100 origin-right">
                                            <UserRoleSelect userId={user.id} currentRole={user.role} />
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-6 pr-10 text-right">
                                        <div className="flex justify-end items-center opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                                            <DeleteUserButton userId={user.id} userName={user.name || "Usuario"} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </ClientMotionDiv>
        </div>
    );
}

// Add cn helper import
import { cn } from "@/lib/utils";
