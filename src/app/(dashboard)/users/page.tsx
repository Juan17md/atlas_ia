import { getAllUsers } from "@/actions/user-actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Search, Users, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ClientMotionDiv } from "@/components/ui/client-motion";
import { UsersListClient } from "@/components/users/users-list-client";

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
        <div className="space-y-8 md:space-y-12 pb-24 md:pb-10 relative">
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-red-600/5 rounded-full blur-[100px] pointer-events-none -z-10" />

            {/* Header Area */}
            <ClientMotionDiv
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8"
            >
                <div className="space-y-1">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none">Jerarquía</h2>
                    <p className="text-neutral-500 font-bold uppercase tracking-[0.3em] text-[10px] ml-1">
                        Control Central: <span className="text-red-500">Gestión de Acceso y Autorizaciones</span>
                    </p>
                </div>

                <div className="w-full md:w-80 group relative">
                    <div className="absolute inset-0 bg-red-600/10 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 group-focus-within:text-red-500 transition-colors duration-300 z-10" />
                    <Input
                        placeholder="Filtrar por núcleo o terminal..."
                        className="relative z-10 pl-12 h-12 md:h-14 bg-neutral-900/40 backdrop-blur-3xl border-white/5 text-white rounded-2xl focus-visible:ring-red-600/30 transition-all placeholder:text-neutral-700 font-medium"
                    />
                </div>
            </ClientMotionDiv>

            {/* Contenido de Usuarios */}
            {!users || users.length === 0 ? (
                <ClientMotionDiv
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-neutral-900/20 backdrop-blur-3xl border border-white/5 rounded-4xl overflow-hidden shadow-2xl"
                >
                    <div className="h-64 flex flex-col items-center justify-center text-neutral-600">
                        <div className="w-16 h-16 rounded-2xl bg-neutral-900/50 flex items-center justify-center mb-6">
                            <Users className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="font-black uppercase tracking-widest text-xs italic">Cero Unidades Detectadas</p>
                    </div>
                </ClientMotionDiv>
            ) : (
                <ClientMotionDiv
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <UsersListClient usuarios={users} />
                </ClientMotionDiv>
            )}
        </div>
    );
}
