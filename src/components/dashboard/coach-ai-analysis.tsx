"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Lightbulb, Loader2 } from "lucide-react";
import { analyzeAthleteProgress } from "@/actions/analytics-actions";

interface CoachAIAnalysisProps {
    athleteId: string;
}

interface AnalysisResult {
    suggestions: string[];
}

export function CoachAIAnalysis({ athleteId }: CoachAIAnalysisProps) {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

    const runAnalysis = async () => {
        setLoading(true);
        try {
            const res = await analyzeAthleteProgress(athleteId);
            if (res.success) {
                const suggestions = (res.suggestions || []) as string[];
                setAnalysis({ suggestions });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="bg-neutral-900 border-neutral-800 lg:col-span-3 overflow-hidden text-white">
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between bg-neutral-950/50 pb-4 gap-4">
                <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-500 shrink-0" />
                    <div>
                        <CardTitle className="text-white">Análisis Inteligente</CardTitle>
                        <p className="text-sm text-neutral-400">Motor de detección de patrones y estancamiento.</p>
                    </div>
                </div>
                {!analysis && (
                    <Button onClick={runAnalysis} disabled={loading} className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-lg shadow-purple-900/20">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {loading ? "Analizando..." : "Analizar Progreso"}
                    </Button>
                )}
            </CardHeader>

            {analysis && (
                <CardContent className="space-y-6 pt-6 ">
                    {/* Suggestions Section */}
                    <div className="space-y-3">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-neutral-400 uppercase tracking-wider">
                            <Lightbulb className="w-4 h-4" /> Sugerencias
                        </h4>
                        <div className="grid gap-2">
                            {analysis.suggestions.map((sug, i) => (
                                <div key={i} className="bg-neutral-800/50 p-3 rounded-lg text-sm text-neutral-300 border border-neutral-800">
                                    {sug}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setAnalysis(null)} className="text-neutral-500 hover:text-white">
                            Cerrar Análisis
                        </Button>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
