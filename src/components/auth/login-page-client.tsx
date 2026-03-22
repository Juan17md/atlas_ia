"use client";

import { useState } from "react";
import { AuthLoginForm } from "@/components/forms/auth-login-form";
import { AuthRegisterForm } from "@/components/forms/auth-register-form";
import { Isotipo } from "@/components/ui/isotipo";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Client Component: Página de Login/Registro Ultra-Premium
 * Estética "Dark Liquid Glass / Aurora" para Desktop.
 * Mantiene Layout de columna única en Mobile.
 */
export function LoginPageClient() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col lg:flex-row bg-[#030303] overflow-hidden font-sans">

            {/* =========================================
                BACKGROUND: LIQUID AURORA (Global)
            ============================================= */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {/* Orbe 1 (Rojo vibrante, sup-der) */}
                <motion.div
                    animate={{
                        x: [0, -100, 50, 0],
                        y: [0, 50, -100, 0],
                        scale: [1, 1.2, 0.9, 1],
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -right-[10%] h-[60vw] w-[60vw] max-h-[800px] max-w-[800px] rounded-full bg-red-600/15 blur-[120px] mix-blend-screen"
                />

                {/* Orbe 2 (Carmesí oscuro, central-izq) */}
                <motion.div
                    animate={{
                        x: [0, 80, -60, 0],
                        y: [0, -80, 40, 0],
                        scale: [1, 0.85, 1.15, 1],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 1 }}
                    className="absolute top-[40%] -left-[20%] h-[70vw] w-[70vw] max-h-[900px] max-w-[900px] rounded-full bg-red-800/20 blur-[150px] mix-blend-screen"
                />

                {/* Orbe 3 (Naranja sutil, inf-der) */}
                <motion.div
                    animate={{
                        x: [0, -50, 30, 0],
                        y: [0, -30, -80, 0],
                    }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 2 }}
                    className="absolute -bottom-[20%] right-[10%] h-[40vw] w-[40vw] max-h-[600px] max-w-[600px] rounded-full bg-orange-600/10 blur-[100px] mix-blend-screen"
                />

                {/* Ruido cinematográfico sobre luces */}
                <div
                    className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
                />
            </div>

            {/* =========================================
                LADO IZQUIERDO: CONTENEDOR FROSTED GLASS
            ============================================= */}
            <div className="relative flex w-full flex-col items-center z-20 lg:w-[42%] lg:min-w-[500px] lg:max-w-[600px] lg:h-screen lg:shrink-0 lg:overflow-y-auto custom-scrollbar lg:bg-black/40 lg:backdrop-blur-2xl lg:border-r lg:border-white/5 lg:shadow-[20px_0_60px_-15px_rgba(0,0,0,0.8)]">

                {/* Dot pattern sutil solo en el panel izquierdo en desktop */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03] lg:opacity-[0.05]"
                    style={{
                        backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />

                <div className="flex w-full flex-col items-center pt-[10dvh] pb-8 px-5 md:px-8 lg:justify-center lg:pt-0 lg:pb-0 lg:px-12 relative z-10 min-h-[100dvh] lg:min-h-full">

                    {/* ── Header / Logo ── */}
                    <motion.header
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="flex w-full flex-col items-center mb-8 lg:mb-12 cursor-default"
                    >
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative mb-6 rounded-full bg-gradient-to-b from-white to-neutral-300 p-[18px] shadow-[0_0_50px_-12px_rgba(255,255,255,0.4)]"
                        >
                            <Isotipo className="h-8 w-8 shrink-0 relative z-10 drop-shadow-md brightness-0" />
                            <div className="absolute inset-0 rounded-full border border-white/40 shadow-[inset_0_2px_10px_rgba(255,255,255,0.8)] pointer-events-none" />
                        </motion.div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? "login-heading" : "register-heading"}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4, ease: "easeOut" }}
                                className="text-center space-y-3"
                            >
                                <div className="flex items-center justify-center gap-3">
                                    <span className="h-px w-8 bg-linear-to-r from-transparent to-red-500/80" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500">
                                        {isLogin ? "Acceso Seguro" : "Nuevo Operador"}
                                    </span>
                                    <span className="h-px w-8 bg-linear-to-l from-transparent to-red-500/80" />
                                </div>

                                <h1 className="text-4xl lg:text-5xl font-black uppercase italic tracking-tighter leading-none text-white">
                                    {isLogin ? "Iniciar " : "Crear "}
                                    <span className="text-transparent bg-clip-text bg-linear-to-br from-neutral-400 to-neutral-700">
                                        {isLogin ? "Sesión" : "Cuenta"}
                                    </span>
                                </h1>
                            </motion.div>
                        </AnimatePresence>
                    </motion.header>

                    {/* ── Form Card ── */}
                    <div className="w-full max-w-[420px] lg:max-w-[440px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isLogin ? "login-form" : "register-form"}
                                initial={{ opacity: 0, x: 20, filter: "blur(6px)" }}
                                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, x: -20, filter: "blur(6px)" }}
                                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {/* Form Container (Transparente en Desktop, Glass más opaco en Móvil) */}
                                <div className="rounded-[2.5rem] border border-white/6 bg-black/60 backdrop-blur-2xl p-6 shadow-2xl md:p-9 lg:bg-transparent lg:border-transparent lg:shadow-none lg:backdrop-blur-none lg:p-0">
                                    {isLogin ? <AuthLoginForm /> : <AuthRegisterForm />}
                                </div>

                                {/* ── Toggle login/registro ── */}
                                <div className="mt-8 text-center px-4">
                                    <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                                        {isLogin ? "¿No tienes cuenta en Atlas IA?" : "¿Ya posees credenciales?"}
                                    </p>
                                    <button
                                        onClick={() => setIsLogin(!isLogin)}
                                        className="group relative h-[52px] w-full rounded-2xl border border-white/8 bg-white/2 text-xs font-bold uppercase italic tracking-[0.15em] text-white transition-all duration-300 hover:border-red-500/30 hover:bg-white/5 active:scale-[0.98] cursor-pointer overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-linear-to-r from-red-600/0 via-red-600/10 to-red-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                        <span className="relative z-10">
                                            {isLogin ? "Solicitar Acceso (Registro)" : "Volver al Portal"}
                                        </span>
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* =========================================
                LADO DERECHO: BRANDING INMERSIVO LIQUID GLASS
            ============================================= */}
            <div className="hidden lg:flex relative flex-1 flex-col justify-end items-end p-20 z-10">

                {/* ── Overlay Textura Imagen (Skeuomorphing oscuro) ── */}
                <div className="absolute inset-0 z-0 opacity-30 mix-blend-luminosity pointer-events-none">
                    <img
                        src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
                        alt="Background Texture"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent opacity-80" />
                    <div className="absolute inset-0 bg-linear-to-l from-black/60 via-transparent to-transparent" />
                </div>

                {/* ── Marcas Holográficas ── */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-16 right-16 w-32 h-32 border-t border-r border-white/10" />
                    <div className="absolute bottom-16 right-16 flex flex-col items-end gap-1.5 opacity-40">
                        <div className="flex gap-1.5">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className={`h-1 w-2 rounded-sm ${i % 3 === 0 ? 'bg-red-500' : 'bg-white/30'}`} />
                            ))}
                        </div>
                        <span className="text-[10px] font-mono tracking-[0.3em] text-white/50">SECTOR.7G</span>
                    </div>
                </div>

                {/* ── Tipografía Hero Premium ── */}
                <motion.div
                    initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 w-full max-w-3xl text-right mt-auto"
                >
                    <h2 className="text-[7rem] 2xl:text-[9rem] font-black uppercase italic tracking-tighter leading-[0.85] text-transparent bg-clip-text bg-linear-to-b from-white to-white/60 relative">
                        {/* Texto trasero (Glow) */}
                        <span className="absolute inset-0 text-red-500/20 blur-2xl pointer-events-none" aria-hidden="true">
                            FORJA <br /> TU LEYENDA
                        </span>
                        FORJA <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 via-red-600 to-red-800">
                            TU LEYENDA
                        </span>
                    </h2>

                    {/* Tarjeta de descripción tipo Glass */}
                    <div className="mt-10 ml-auto p-6 rounded-2xl border border-white/5 bg-white/2 backdrop-blur-md max-w-lg shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-linear-to-tl from-white/4 to-transparent" />
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-red-500 to-red-900 rounded-l-2xl" />

                        <p className="relative z-10 text-neutral-400 text-lg 2xl:text-xl font-medium tracking-wide leading-relaxed">
                            <span className="text-white font-bold">Atlas IA</span> combina inteligencia artificial de vanguardia con tus métricas físicas.
                            <br /><span className="mt-2 block text-sm uppercase tracking-widest text-red-400 font-bold">Analiza. Adapta. Supera.</span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
