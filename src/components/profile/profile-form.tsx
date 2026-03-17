"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateProfile } from "@/actions/profile-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LoaderPremium } from "@/components/ui/loader-premium";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, ShieldCheck, Activity, Target } from "lucide-react";
import { ClientMotionDiv } from "@/components/ui/client-motion";

const profileSchema = z.object({
    // ... (rest of the schema remains same)
    name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    phone: z.string().optional(),
    height: z.string().optional(),
    weight: z.string().optional(),
});

interface ProfileFormProps {
    user: {
        name?: string;
        email?: string;
        image?: string;
        phone?: string;
        height?: number;
        weight?: number;
        role?: string;
        onboardingCompleted?: boolean;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Define your form.
    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user?.name || "",
            phone: user?.phone || "",
            height: user?.height?.toString() || "",
            weight: user?.weight?.toString() || "",
        },
    });

    // 2. Define a submit handler.
    async function onSubmit(values: z.infer<typeof profileSchema>) {
        setIsSubmitting(true);
        const res = await updateProfile({
            ...values,
            height: values.height ? Number(values.height) : undefined,
            weight: values.weight ? Number(values.weight) : undefined,
        });
        setIsSubmitting(false);
        if (res.success) {
            toast.success("Perfil actualizado");
            router.refresh();
        } else {
            toast.error(res.error || "Algo salió mal");
        }
    }

    const height = form.watch("height");
    const weight = form.watch("weight");

    const calculateBMI = (h?: string, w?: string) => {
        const heightVal = parseFloat(h || "0");
        const weightVal = parseFloat(w || "0");

        if (!heightVal || !weightVal) return null;

        const bmiVal = weightVal / ((heightVal / 100) * (heightVal / 100));
        const rounded = bmiVal.toFixed(1);

        if (bmiVal < 18.5) return { value: rounded, label: "Bajo Peso", color: "border-blue-500 text-blue-500" };
        if (bmiVal < 25) return { value: rounded, label: "Peso Normal", color: "border-green-500 text-green-500" };
        if (bmiVal < 30) return { value: rounded, label: "Sobrepeso", color: "border-yellow-500 text-yellow-500" };
        return { value: rounded, label: "Obesidad", color: "border-red-500 text-red-500" };
    };

    const bmi = calculateBMI(height, weight);

    return (
        <div className="space-y-12">
            <ClientMotionDiv
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col md:flex-row items-center md:items-start gap-8 pb-10 border-b border-white/5"
            >
                <div className="relative group">
                    <div className="absolute -inset-1 bg-linear-to-r from-red-600 to-red-900 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-700"></div>
                    <Avatar className="h-32 w-32 border-4 border-black relative z-10 shadow-2xl">
                        <AvatarImage src={user.image} className="object-cover" />
                        <AvatarFallback className="text-4xl font-black bg-neutral-900 text-neutral-600 italic">
                            {user.name?.[0]?.toUpperCase() || <User className="w-12 h-12" />}
                        </AvatarFallback>
                    </Avatar>
                </div>

                <div className="text-center md:text-left space-y-3 flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{user.name}</h2>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            <span className={cn(
                                "px-4 py-1.5 border rounded-xl text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-xl",
                                user.role === 'coach' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                user.role === 'advanced_athlete' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                                "bg-white/5 border-white/10 text-white"
                            )}>
                                {user.role === 'coach' ? 'Entrenador' : user.role === 'advanced_athlete' ? 'Atleta PRO' : 'Atleta'}
                            </span>
                            {user.onboardingCompleted && (
                                <div className="h-6 w-6 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                </div>
                            )}
                        </div>
                    </div>
                    <p className="text-neutral-500 font-bold italic text-sm tracking-tight">{user.email}</p>
                </div>

                {user.role !== 'coach' && bmi && (
                    <div className={cn(
                        "md:ml-auto p-6 rounded-3xl border bg-neutral-900/40 backdrop-blur-3xl flex flex-col items-center justify-center min-w-[160px] shadow-2xl transition-all hover:scale-105",
                        bmi.color.split(' ')[0],
                        "hover:border-opacity-50"
                    )}>
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-3.5 h-3.5 text-neutral-600" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-600">Índice Telemetría (IMC)</span>
                        </div>
                        <span className={cn("text-4xl font-black tracking-tighter italic leading-none mb-1", bmi.color.split(' ')[1])}>{bmi.value}</span>
                        <div className="bg-black/40 px-3 py-1 rounded-xl border border-white/5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 italic">{bmi.label}</span>
                        </div>
                    </div>
                )}
            </ClientMotionDiv>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel className="uppercase text-[10px] font-black tracking-[0.3em] text-neutral-500 ml-1 italic flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-red-500" />
                                        Nombre Completo
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Tu nombre"
                                            {...field}
                                            className="bg-neutral-900/20 border-white/5 focus:border-red-500/50 transition-all h-14 rounded-2xl text-white placeholder:text-neutral-700 font-bold italic shadow-inner"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px] font-black uppercase italic text-red-500" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel className="uppercase text-[10px] font-black tracking-[0.3em] text-neutral-500 ml-1 italic flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-blue-500" />
                                        Contacto Móvil
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="+56 9 ..."
                                            {...field}
                                            className="bg-neutral-900/20 border-white/5 focus:border-blue-500/50 transition-all h-14 rounded-2xl text-white placeholder:text-neutral-700 font-bold italic shadow-inner"
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px] font-black uppercase italic text-red-500" />
                                </FormItem>
                            )}
                        />

                        {user.role !== 'coach' && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="height"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="uppercase text-[10px] font-black tracking-[0.3em] text-neutral-500 ml-1 italic flex items-center gap-2">
                                                <Target className="w-3 h-3 text-red-500" />
                                                Altura (CM)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="text"
                                                    inputMode="decimal"
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(",", ".");
                                                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                            field.onChange(val);
                                                        }
                                                    }}
                                                    placeholder="175"
                                                    className="bg-neutral-900/20 border-white/5 focus:border-red-500/50 transition-all h-14 rounded-2xl text-white placeholder:text-neutral-700 font-bold italic shadow-inner"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px] font-black uppercase italic text-red-500" />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="weight"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel className="uppercase text-[10px] font-black tracking-[0.3em] text-neutral-500 ml-1 italic flex items-center gap-2">
                                                <Activity className="w-3 h-3 text-emerald-500" />
                                                Peso Actual (KG)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="text"
                                                    inputMode="decimal"
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(",", ".");
                                                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                                            field.onChange(val);
                                                        }
                                                    }}
                                                    placeholder="70"
                                                    className="bg-neutral-900/20 border-white/5 focus:border-emerald-500/50 transition-all h-14 rounded-2xl text-white placeholder:text-neutral-700 font-bold italic shadow-inner"
                                                />
                                            </FormControl>
                                            <FormMessage className="text-[10px] font-black uppercase italic text-red-500" />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}
                    </div>

                    <div className="pt-8 flex justify-end">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full md:w-auto px-12 h-14 bg-white text-black font-black uppercase italic tracking-[0.2em] text-[10px] rounded-2xl hover:bg-neutral-200 transition-all shadow-xl shadow-white/5 active:scale-95 flex items-center justify-center gap-3 group"
                        >
                            {isSubmitting ? <LoaderPremium size="sm" /> : (
                                <>
                                    <span>Sincronizar Datos</span>
                                    <Target className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div >
    );
}
