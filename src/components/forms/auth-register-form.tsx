"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerUser } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Sparkles, Loader2 } from "lucide-react";

const RegisterSchema = z
    .object({
        name: z.string().min(1, "Nombre requerido"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Mínimo 6 caracteres"),
        confirmPassword: z.string().min(6, "Mínimo 6 caracteres"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

type RegisterFormValues = z.infer<typeof RegisterSchema>;

export function AuthRegisterForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {},
    });

    const onSubmit = async (data: RegisterFormValues) => {
        setLoading(true);
        try {
            const result = await registerUser({
                name: data.name,
                email: data.email,
                password: data.password,
                role: "athlete",
            });

            if (result.success) {
                toast.success("Cuenta creada exitosamente");

                await signIn("credentials", {
                    email: data.email,
                    password: data.password,
                    redirect: false,
                });

                router.push("/dashboard");
                router.refresh();
            } else {
                toast.error(result.error || "Error al registrar");
            }
        } catch (error) {
            toast.error("Ocurrió un error inesperado " + error);
        } finally {
            setLoading(false);
        }
    };

    /** Clases reutilizables para inputs */
    const inputClass =
        "h-[48px] rounded-xl border border-white/[0.06] bg-black/40 px-4 text-[14px] font-medium text-white shadow-inner transition-all placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:border-red-500/30";
    const inputPasswordClass =
        "h-[48px] rounded-xl border border-white/[0.06] bg-black/40 pl-4 pr-12 text-[14px] font-medium text-white shadow-inner transition-all placeholder:text-neutral-600 focus-visible:ring-1 focus-visible:ring-red-500/50 focus-visible:border-red-500/30";
    const labelClass =
        "ml-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400";
    const errorClass = "ml-1 text-[10px] font-semibold text-red-500";

    return (
        <div className="w-full space-y-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                {/* Nombre */}
                <div className="space-y-1">
                    <Label htmlFor="reg-name" className={labelClass}>
                        Nombre completo
                    </Label>
                    <Input
                        id="reg-name"
                        placeholder="Tu nombre"
                        autoComplete="name"
                        {...register("name")}
                        className={inputClass}
                    />
                    {errors.name && (
                        <p className={errorClass}>{errors.name.message}</p>
                    )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                    <Label htmlFor="reg-email" className={labelClass}>
                        Email
                    </Label>
                    <Input
                        id="reg-email"
                        type="email"
                        inputMode="email"
                        placeholder="tu@email.com"
                        autoComplete="email"
                        {...register("email")}
                        className={inputClass}
                    />
                    {errors.email && (
                        <p className={errorClass}>{errors.email.message}</p>
                    )}
                </div>

                {/* Contraseña */}
                <div className="space-y-1">
                    <Label htmlFor="reg-password" className={labelClass}>
                        Contraseña
                    </Label>
                    <div className="relative">
                        <Input
                            id="reg-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 6 caracteres"
                            autoComplete="new-password"
                            {...register("password")}
                            className={inputPasswordClass}
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
                        <p className={errorClass}>{errors.password.message}</p>
                    )}
                </div>

                {/* Confirmar contraseña */}
                <div className="space-y-1">
                    <Label
                        htmlFor="reg-confirmPassword"
                        className={labelClass}
                    >
                        Confirmar contraseña
                    </Label>
                    <div className="relative">
                        <Input
                            id="reg-confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Repite la contraseña"
                            autoComplete="new-password"
                            {...register("confirmPassword")}
                            className={inputPasswordClass}
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-500 transition-colors hover:text-white cursor-pointer"
                            onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                            }
                            aria-label={
                                showConfirmPassword
                                    ? "Ocultar contraseña"
                                    : "Mostrar contraseña"
                            }
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                    {errors.confirmPassword && (
                        <p className={errorClass}>
                            {errors.confirmPassword.message}
                        </p>
                    )}
                </div>

                {/* Submit */}
                <Button
                    type="submit"
                    className="group relative mt-1 h-[48px] w-full rounded-xl bg-white text-xs font-bold uppercase tracking-[0.15em] text-black transition-all duration-300 hover:bg-neutral-200 shadow-xl hover:shadow-2xl active:scale-[0.98] cursor-pointer disabled:opacity-60"
                    disabled={loading}
                >
                    <span className="relative z-10 flex items-center justify-center gap-2.5">
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Creando cuenta...
                            </>
                        ) : (
                            <>
                                Crear cuenta
                                <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
                            </>
                        )}
                    </span>
                </Button>
            </form>
        </div>
    );
}
