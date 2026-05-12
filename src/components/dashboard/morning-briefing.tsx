"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Zap,
  Target,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Flame,
  Siren,
  Utensils,
  Ruler,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { generarMorningBriefing, type MorningBriefing } from "@/actions/briefing-actions";
import { Skeleton } from "@/components/ui/skeleton";

export function MorningBriefing() {
  const [briefing, setBriefing] = useState<MorningBriefing | null>(null);
  const [cargando, setCargando] = useState(true);
  const [expandido, setExpandido] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        setCargando(true);
        const res = await generarMorningBriefing();
        if (res.success && res.briefing) {
          setBriefing(res.briefing);
        } else {
          setError(res.error || "No se pudo cargar el briefing");
        }
      } catch {
        setError("Error al conectar con Vivi");
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, []);

  const getReadinessColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getReadinessBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case "high":
        return "border-red-500/30 bg-red-500/5";
      case "medium":
        return "border-yellow-500/30 bg-yellow-500/5";
      default:
        return "border-blue-500/30 bg-blue-500/5";
    }
  };

  if (cargando) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-600/5 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full bg-neutral-800" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48 bg-neutral-800" />
              <Skeleton className="h-3 w-32 bg-neutral-800" />
            </div>
          </div>
          <Skeleton className="h-16 w-full bg-neutral-800 rounded-2xl" />
        </div>
      </motion.div>
    );
  }

  if (error || !briefing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/40 backdrop-blur-xl border border-red-500/20 rounded-3xl p-6 md:p-8 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-neutral-400 text-sm">{error || "Briefing no disponible"}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl md:rounded-4xl shadow-2xl overflow-hidden relative group"
    >
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-red-600/10 transition-all duration-700" />

      <div className="relative z-10">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 rounded-full blur-[10px] opacity-30" />
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center border border-red-500/30 relative z-10 shadow-lg">
                  <Sun className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                  Morning Briefing
                </h3>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                  Tu resumen diario de Vivi
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-400 hover:text-white h-8 w-8"
              onClick={() => setExpandido(!expandido)}
            >
              {expandido ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {expandido && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6 md:p-8 space-y-6">
                {/* Readiness + Frase */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex items-center gap-4">
                    <div
                      className={cn(
                        "h-14 w-14 rounded-full flex items-center justify-center text-2xl font-black",
                        getReadinessBg(briefing.readinessScore),
                        "text-white shadow-lg"
                      )}
                    >
                      {briefing.readinessScore}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                        Preparación
                      </p>
                      <p
                        className={cn(
                          "text-sm font-black uppercase",
                          getReadinessColor(briefing.readinessScore)
                        )}
                      >
                        {briefing.readinessScore >= 80
                          ? "Óptimo"
                          : briefing.readinessScore >= 60
                          ? "Bueno"
                          : briefing.readinessScore >= 40
                          ? "Regular"
                          : "Bajo"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-sm text-neutral-300 italic leading-relaxed">
                      &ldquo;{briefing.fraseMotivacional}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Entrenamiento de hoy */}
                {briefing.entrenamientoHoy ? (
                  <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                        Hoy toca
                      </p>
                    </div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">
                      {briefing.entrenamientoHoy.nombre}
                    </h4>
                    {briefing.entrenamientoHoy.ejercicios.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {briefing.entrenamientoHoy.ejercicios.slice(0, 5).map((ej, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          >
                            {ej}
                          </span>
                        ))}
                        {briefing.entrenamientoHoy.ejercicios.length > 5 && (
                          <span className="text-[10px] font-bold text-neutral-500">
                            +{briefing.entrenamientoHoy.ejercicios.length - 5} más
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-neutral-500" />
                      <p className="text-sm text-neutral-500">
                        Hoy es día de descanso o no tienes rutina asignada.
                      </p>
                    </div>
                  </div>
                )}

                {/* PRs al alcance */}
                {briefing.prAlAlcance.length > 0 && (
                  <div className="bg-black/40 border border-amber-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                        PRs al alcance
                      </p>
                    </div>
                    <div className="space-y-3">
                      {briefing.prAlAlcance.slice(0, 3).map((pr, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-amber-500/5 rounded-xl p-3 border border-amber-500/10"
                        >
                          <div>
                            <p className="text-sm font-bold text-white">{pr.ejercicio}</p>
                            <p className="text-[10px] text-neutral-500">{pr.mensaje}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-neutral-500 line-through">
                              {pr.pesoActual}kg
                            </p>
                            <p className="text-lg font-black text-amber-500">
                              {pr.pesoSugerido}
                              <span className="text-xs font-normal">kg</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alertas */}
                {briefing.alertas.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Siren className="w-4 h-4 text-red-500" />
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                        Alertas
                      </p>
                    </div>
                    {briefing.alertas.map((alerta, i) => (
                      <div
                        key={i}
                        className={cn(
                          "rounded-xl p-3 border",
                          getSeveridadColor(alerta.severidad)
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {alerta.tipo === "nutricion" ? (
                            <Utensils className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                          ) : alerta.tipo === "abandono" ? (
                            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                          )}
                          <p className="text-sm text-neutral-300">{alerta.mensaje}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Consejo del día */}
                <div className="bg-gradient-to-r from-red-950/30 to-neutral-900/50 border border-red-500/20 rounded-2xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-24 h-24 bg-red-600/10 rounded-full blur-2xl -ml-10 -mt-10" />
                  <div className="relative z-10 flex items-start gap-3">
                    <Zap className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">
                        Consejo de Vivi
                      </p>
                      <p className="text-sm text-neutral-300 leading-relaxed">
                        {briefing.consejoDelDia}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
