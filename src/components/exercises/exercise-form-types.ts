export const MUSCLE_GROUPS = [
    "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Cuádriceps", "Isquiotibiales", "Glúteos", "Aductores", "Pantorrillas", "Abdominales", "Cardio", "Full Body"
] as const;

export const SPECIFIC_MUSCLES_BY_GROUP: Record<string, string[]> = {
    "Pecho": ["Pectoral Mayor", "Pectoral Menor", "Serrato Anterior", "Serrato Posterior", "Pectoral Inferior"],
    "Espalda": ["Dorsal Ancho", "Trapecio", "Romboides", "Redondo Mayor", "Redondo Menor", "Erector de la Columna", "Lumbar"],
    "Hombros": ["Deltoides Anterior", "Deltoides Medio", "Deltoides Posterior", "Manguito Rotador", "Deltoides Inferior", "Deltoides Superior"],
    "Bíceps": ["Bíceps Braquial", "Braquial", "Braquiorradial", "Bíceps Femoral", "Bíceps Longo", "Bíceps Corto"],
    "Tríceps": ["Tríceps Braquial (Cabeza Larga)", "Tríceps Braquial (Cabeza Lateral)", "Tríceps Braquial (Cabeza Medial)", "Tríceps Femoral", "Tríceps Longo", "Tríceps Corto"],
    "Cuádriceps": ["Recto Femoral", "Vasto Lateral", "Vasto Medial", "Vasto Intermedio"],
    "Isquiotibiales": ["Bíceps Femoral", "Semitendinoso", "Semimembranoso", "Isquiotibiales Inferior", "Isquiotibiales Superior"],
    "Glúteos": ["Glúteo Mayor", "Glúteo Medio", "Glúteo Menor", "Glúteo Inferior", "Glúteo Superior"],
    "Aductores": ["Aductor Mayor", "Aductor Largo", "Aductor Corto", "Pectíneo", "Grácil", "Aductor Inferior", "Aductor Superior"],
    "Pantorrillas": ["Gastrocnemio", "Sóleo", "Pantorrilla Inferior", "Pantorrilla Superior"],
    "Abdominales": ["Recto Abdominal", "Oblicuos", "Transverso del Abdomen", "Abdominal Inferior", "Abdominal Superior"],
    "Cardio": ["Corazón", "Resistencia General"],
    "Full Body": ["Cuerpo Completo"]
};