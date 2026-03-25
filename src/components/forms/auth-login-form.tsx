"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Eye, EyeOff, ShieldCheck, Loader2 } from "lucide-react";

const LoginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Contraseña requerida"),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

export function AuthLoginForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
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
                router.push("/dashboard");
                router.refresh();
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const idToken = await userCredential.user.getIdToken();

            const result = await signIn("credentials", {
                idToken,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Error iniciando sesión con Google en el servidor");
            } else {
                toast.success("Acceso concedido con Google");
                router.push("/dashboard");
                router.refresh();
            }
        } catch (error: any) {
            console.error("Google Login Error:", error);
            if (
                error.code === "auth/popup-closed-by-user" ||
                error.code === "auth/popup-blocked" ||
                error.code === "auth/cancelled-popup-request"
            ) {
                setGoogleLoading(false);
                return;
            }
            toast.error(
                "Error al iniciar sesión con Google: " + error.message
            );
        } finally {
            setGoogleLoading(false);
        }
    };

    const isDisabled = loading || googleLoading;

    return (
        <div className="w-full space-y-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <div className="space-y-1">
                    <Label
                        htmlFor="login-email"
                        className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400"
                    >
                        Email
                    </Label>
                    <Input
                        id="login-email"
                        type="email"
                        inputMode="email"
                        placeholder="tu@email.com"
                        autoComplete="email"
                        {...register("email")}
                        className="h-[48px] rounded-xl border border-white/6 bg-black/40 px-4 text-[14px] font-medium text-white shadow-inner transition-all placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:border-red-500/30"
                    />
                    {errors.email && (
                        <p className="ml-1 text-[10px] font-semibold text-red-500">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div className="space-y-1">
                    <Label
                        htmlFor="login-password"
                        className="ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400"
                    >
                        Contraseña
                    </Label>
                    <div className="relative">
                        <Input
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            {...register("password")}
                            className="h-[48px] rounded-xl border border-white/6 bg-black/40 pl-4 pr-12 text-[14px] font-medium text-white shadow-inner transition-all placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:border-red-500/30"
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-500 transition-colors hover:text-white cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                                showPassword
                                    ? "Ocultar contraseña"
                                    : "Mostrar contraseña"
                            }
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="ml-1 text-[10px] font-semibold text-red-500">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    className="group relative mt-1 h-[48px] w-full rounded-xl bg-red-600 text-xs font-bold uppercase tracking-[0.15em] text-white transition-all duration-300 hover:bg-red-700 shadow-[0_0_25px_-5px_rgba(220,38,38,0.5)] hover:shadow-[0_0_40px_-5px_rgba(239,68,68,0.6)] active:scale-[0.98] cursor-pointer disabled:opacity-60"
                    disabled={isDisabled}
                >
                    <span className="relative z-10 flex items-center justify-center gap-2.5">
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Iniciando...
                            </>
                        ) : (
                            <>
                                Entrar
                                <ShieldCheck className="h-5 w-5 transition-transform group-hover:scale-110" />
                            </>
                        )}
                    </span>
                    <div className="absolute inset-0 rounded-xl bg-linear-to-r from-red-400/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </Button>
            </form>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/6" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-neutral-950 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600">
                        o continúa con
                    </span>
                </div>
            </div>

            {/* Google */}
            <Button
                variant="outline"
                type="button"
                className="group h-[48px] w-full rounded-xl border border-white/6 bg-white/4 text-xs font-bold uppercase tracking-widest text-white transition-all duration-200 hover:bg-white/8 hover:border-white/10 active:scale-[0.98] cursor-pointer disabled:opacity-60"
                disabled={isDisabled}
                onClick={handleGoogleLogin}
            >
                <span className="flex items-center justify-center gap-3">
                    {googleLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <div className="rounded-lg bg-white p-1.5 transition-transform group-hover:scale-110">
                            <svg
                                className="h-4 w-4"
                                aria-hidden="true"
                                viewBox="0 0 488 512"
                            >
                                <path
                                    fill="#000"
                                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                                />
                            </svg>
                        </div>
                    )}
                    Google
                </span>
            </Button>
        </div>
    );
}
