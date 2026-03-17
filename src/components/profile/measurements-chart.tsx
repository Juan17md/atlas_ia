"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

interface MeasurementPoint {
    date: string;
    value: number;
}

interface MeasurementsChartProps {
    data: MeasurementPoint[];
    unit: string;
    title: string;
    color?: string;
}

export function MeasurementsChart({ data, unit, title, color = "#ef4444" }: MeasurementsChartProps) {
    const { points, min, max } = useMemo(() => {
        if (!data || data.length < 2) return { points: [], min: 0, max: 0 };

        const values = data.map(d => d.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const range = maxVal - minVal || 1;

        // Normalizar puntos al rango 0-100 para altura del SVG
        const normalizedPoints = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - ((d.value - minVal) / range) * 80 - 10; // Margen 10%
            return { x, y, value: d.value, date: d.date };
        });

        return { points: normalizedPoints, min: minVal, max: maxVal };
    }, [data]);

    // Si no hay datos suficientes
    if (!data || data.length < 2) {
        return (
            <Card className="glass-card border-white/10 opacity-50">
                <CardHeader>
                    <CardTitle className="text-sm text-neutral-400 uppercase tracking-wider">{title}</CardTitle>
                </CardHeader>
                <CardContent className="h-32 flex items-center justify-center text-xs text-neutral-600">
                    Necesitas al menos 2 registros para ver la tendencia.
                </CardContent>
            </Card>
        );
    }

    // Generar path SVG
    const svgPath = points.map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    // Área bajo la curva
    const areaPath = `${svgPath} L 100 100 L 0 100 Z`;

    return (
        <Card className="glass-card border-white/10 overflow-hidden">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-end">
                    <CardTitle className="text-sm text-neutral-400 uppercase tracking-wider font-bold">{title}</CardTitle>
                    <span className="text-2xl font-black text-white">
                        {data[data.length - 1].value} <span className="text-xs text-neutral-500 font-normal">{unit}</span>
                    </span>
                </div>
            </CardHeader>
            <CardContent className="p-0 relative h-32">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    {/* Gradiente */}
                    <defs>
                        <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area */}
                    <path d={areaPath} fill={`url(#grad-${title})`} />

                    {/* Línea */}
                    <path d={svgPath} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />

                    {/* Puntos */}
                    {points.map((p, i) => (
                        <circle
                            key={i}
                            cx={p.x} cy={p.y} r="1.5"
                            fill="#000" stroke={color} strokeWidth="1" vectorEffect="non-scaling-stroke"
                            className="hover:r-[4]"
                        />
                    ))}
                </svg>

                {/* Labels Min/Max superpuestos discretamente */}
                <div className="absolute top-2 left-2 text-[10px] text-neutral-600 font-mono bg-black/50 px-1 rounded">Max: {max}</div>
                <div className="absolute bottom-2 left-2 text-[10px] text-neutral-600 font-mono bg-black/50 px-1 rounded">Min: {min}</div>
            </CardContent>
        </Card>
    );
}
