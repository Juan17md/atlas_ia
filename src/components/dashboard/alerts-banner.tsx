"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  TrendingDown,
  Activity,
  X,
  Bell,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  obtenerAlertasProactivas,
  type AlertaProactiva,
} from "@/actions/alert-actions";

const ICONOS_ALERTA: Record<string, React.ElementType> = {
  estancamiento: TrendingDown,
  abandono: AlertTriangle,
  sobreentrenamiento: Activity,
  nutricion: Bell,
  medidas: Bell,
};

const COLORES_TIPO: Record<string, string> = {
  estancamiento: "border-amber-500/30 bg-amber-500/5",
  abandono: "border-red-500/30 bg-red-500/5",
  sobreentrenamiento: "border-red-500/30 bg-red-500/5",
  nutricion: "border-blue-500/30 bg-blue-500/5",
  medidas: "border-purple-500/30 bg-purple-500/5",
};

export function AlertsBanner() {
  const [alertas, setAlertas] = useState<AlertaProactiva[]>([]);
  const [cargando, setCargando] = useState(true);
  const [visible, setVisible] = useState(true);
  const [descartadas, setDescartadas] = useState<Set<string>>(new Set());

  useEffect(() => {
    const verificar = async () => {
      try {
        setCargando(true);
        const res = await obtenerAlertasProactivas();
        if (res.success && res.alertas) {
          setAlertas(res.alertas.filter((a) => !descartadas.has(a.id)));
        }
      } finally {
        setCargando(false);
      }
    };

    verificar();

    const intervalo = setInterval(verificar, 1000 * 60 * 30);
    return () => clearInterval(intervalo);
  }, [descartadas]);

  const descartarAlerta = (id: string) => {
    setDescartadas((prev) => new Set([...prev, id]));
    setAlertas((prev) => prev.filter((a) => a.id !== id));
  };

  if (cargando || alertas.length === 0 || !visible) return null;

  const alertasAlta = alertas.filter((a) => a.severidad === "high");
  const alertasMedia = alertas.filter((a) => a.severidad === "medium");
  const alertasBaja = alertas.filter((a) => a.severidad === "low");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6 space-y-2"
      >
        {alertasAlta.slice(0, 1).map((alerta) => (
          <div
            key={alerta.id}
            className={cn(
              "rounded-2xl p-4 border flex items-start gap-3",
              COLORES_TIPO[alerta.tipo] || "border-white/10 bg-white/5"
            )}
          >
            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-white uppercase tracking-tight">
                {alerta.titulo}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">{alerta.mensaje}</p>
              {alerta.accion && (
                <p className="text-[10px] text-red-500 font-bold mt-1.5 flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  {alerta.accion}
                </p>
              )}
            </div>
            <button
              onClick={() => descartarAlerta(alerta.id)}
              className="text-neutral-600 hover:text-white transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Alertas colapsables */}
        {alertasMedia.length + alertasBaja.length > 0 && (
          <details className="group">
            <summary className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest cursor-pointer hover:text-neutral-400 transition-colors list-none flex items-center gap-1.5">
              <Bell className="w-3 h-3" />
              {alertasMedia.length + alertasBaja.length} avisos adicionales
            </summary>
            <div className="mt-2 space-y-1.5">
              {[...alertasMedia, ...alertasBaja].map((alerta) => (
                <div
                  key={alerta.id}
                  className={cn(
                    "rounded-xl p-3 border flex items-start gap-2.5",
                    COLORES_TIPO[alerta.tipo] || "border-white/10 bg-white/5"
                  )}
                >
                  {React.createElement(ICONOS_ALERTA[alerta.tipo] || Bell, {
                    className: "w-3.5 h-3.5 text-neutral-500 mt-0.5 shrink-0",
                  })}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white">{alerta.titulo}</p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      {alerta.mensaje}
                    </p>
                  </div>
                  <button
                    onClick={() => descartarAlerta(alerta.id)}
                    className="text-neutral-700 hover:text-white shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </details>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
