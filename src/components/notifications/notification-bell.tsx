"use client";

import { useState, useEffect } from "react";
import { Bell, ExternalLink } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { getCoachNotifications, getAthleteNotifications, markAllNotificationsAsRead } from "@/actions/notification-actions";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [hasUnread, setHasUnread] = useState(false);
    const [isMarking, setIsMarking] = useState(false);

    useEffect(() => {
        const fetchNotifications = async () => {
            const res = await getAthleteNotifications();

            if (res.success && res.notifications) {
                setNotifications(res.notifications);
                setHasUnread(res.notifications.some((n: any) => !n.read));
            }
        };
        fetchNotifications();
    }, []);

    const handleMarkAllRead = async () => {
        if (notifications.length === 0) return;

        setIsMarking(true);
        const res = await markAllNotificationsAsRead();
        setIsMarking(false);

        if (res.success) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setHasUnread(false);
            toast.success("Notificaciones marcadas como leídas");
        } else {
            toast.error("Error al actualizar");
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="relative w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer">
                    <Bell className="h-5 w-5" />
                    {hasUnread && (
                        <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-neutral-900 animate-pulse"></span>
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[360px] bg-neutral-950/95 backdrop-blur-xl border-neutral-800 text-white rounded-3xl shadow-[0_0_40px_-10px_rgba(0,0,0,0.7)] p-0 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5 bg-neutral-950/50 border-b border-neutral-800 flex items-center justify-between">
                    <DropdownMenuLabel className="font-black text-lg p-0 flex items-center gap-2.5 tracking-tight">
                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                            <Bell className="w-4 h-4 text-red-500" />
                        </div>
                        Notificaciones
                    </DropdownMenuLabel>
                    <span className="bg-neutral-900 border border-neutral-800 text-neutral-400 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest">
                        {notifications.filter(n => !n.read).length} Nuevas
                    </span>
                </div>

                <div className="max-h-[450px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 hover:scrollbar-thumb-neutral-700">
                    {notifications.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4 border border-neutral-800">
                                <Bell className="w-6 h-6 text-neutral-600" />
                            </div>
                            <h4 className="font-bold text-white mb-1">Todo al día</h4>
                            <p className="text-xs text-neutral-500 max-w-[200px]">No tienes notificaciones nuevas por el momento.</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`
                                    relative p-5 border-b border-neutral-900/50 transition-all duration-300 group
                                    ${!notif.read ? 'bg-gradient-to-r from-red-500/5 to-transparent' : 'opacity-60 hover:opacity-100 hover:bg-neutral-900/30'}
                                `}
                            >
                                <Link
                                    href={notif.link || '#'}
                                    className="absolute inset-0 z-10"
                                />

                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {!notif.read ? (
                                            <div className={`w-2 h-2 rounded-full mt-1.5 ${notif.type === 'alert' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]'}`} />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full mt-1.5 bg-neutral-700" />
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start gap-4">
                                            <h4 className={`text-sm font-bold leading-none ${!notif.read ? 'text-white' : 'text-neutral-400'}`}>
                                                {notif.title}
                                            </h4>
                                            <span className="text-[10px] text-neutral-500 whitespace-nowrap font-medium font-mono">
                                                {formatDistanceToNow(new Date(notif.time), { addSuffix: true, locale: es })}
                                            </span>
                                        </div>

                                        <p className="text-xs text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition-colors">
                                            {notif.message}
                                        </p>

                                        {notif.link && (
                                            <div className="pt-2 flex">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all text-red-400 group-hover:text-red-300 group-hover:translate-x-1">
                                                    Tomar Acción
                                                    <ExternalLink className="w-3 h-3" />
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-3 bg-neutral-950 border-t border-neutral-800">
                    <Button
                        variant="ghost"
                        className="w-full text-xs text-neutral-500 hover:text-white hover:bg-neutral-900 rounded-xl h-9 font-medium transition-all active:scale-95 disabled:opacity-50"
                        onClick={handleMarkAllRead}
                        disabled={isMarking || !hasUnread}
                    >
                        {isMarking ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-2" />
                        ) : null}
                        {hasUnread ? "Marcar todas como leídas" : "Todo marcado como leído"}
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
