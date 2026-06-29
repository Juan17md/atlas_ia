"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";

const LoginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Contraseña requerida"),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

export function AuthLoginForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormValues>({
        resolver: zodResolver(LoginSchema),
    });

    const onSubmit = async (data: LoginFormValues) => {
        setLoading(true);
        try {
            const result = await signIn("credentials", {
                email: data.email,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Credenciales incorrectas");
            } else {
                toast.success("Bienvenido de nuevo");
                const session = await getSession();
                if (session?.user?.onboardingCompleted) {
                    router.push("/dashboard");
                } else {
                    router.push("/onboarding");
                }
                router.refresh();
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = loading;

    return (
        <div className="space-y-5">
            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-red-500" />
                        Correo electrónico
                    </Label>
                    <Input
                        {...register("email")}
                        id="email"
                        type="email"
                        placeholder="tucorreo@ejemplo.com"
                        autoComplete="email"
                        className="h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-neutral-700 focus-visible:ring-red-600/20 focus-visible:border-red-600/30 transition-all text-sm"
                    />
                    {errors.email && (
                        <p className="text-[10px] font-bold text-red-500 italic">{errors.email.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-red-500" />
                        Contraseña
                    </Label>
                    <div className="relative">
                        <Input
                            {...register("password")}
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-neutral-700 focus-visible:ring-red-600/20 focus-visible:border-red-600/30 transition-all text-sm pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="text-[10px] font-bold text-red-500 italic">{errors.password.message}</p>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={isDisabled}
                    className="relative h-12 w-full rounded-xl bg-red-600 text-white font-black text-xs uppercase tracking-[0.2em] transition-all duration-200 hover:bg-red-500 active:scale-[0.98] disabled:opacity-60 cursor-pointer overflow-hidden group"
                >
                    <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-800 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            "Iniciar Sesión"
                        )}
                    </span>
                </Button>
            </form>
        </div>
    );
}
