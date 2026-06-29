export interface BodyFatInput {
    height: number;
    waist: number;
    neck: number;
    hips?: number;
    gender?: "male" | "female";
}

export function calcularGrasaCorporal(input: BodyFatInput): {
    bodyFat: number | undefined;
    warning: string | undefined;
} {
    const { height, waist, neck, hips, gender } = input;
    let bodyFat: number | undefined;
    let warning: string | undefined;

    if (waist <= neck) {
        warning = "La cintura debe ser mayor que el cuello para calcular grasa corporal";
    } else if (gender === "male" || (!gender || gender !== "female")) {
        const diff = waist - neck;
        if (diff > 0 && height > 0) {
            const denom = 1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(height);
            if (denom !== 0 && !isNaN(denom)) {
                bodyFat = (495 / denom) - 450;
            }
        }
    } else if (gender === "female" && hips) {
        const diff = (waist + hips) - neck;
        if (diff > 0 && height > 0) {
            const denom = 1.29579 - 0.35004 * Math.log10(diff) + 0.22100 * Math.log10(height);
            if (denom !== 0 && !isNaN(denom)) {
                bodyFat = (495 / denom) - 450;
            }
        }
    }

    if (bodyFat !== undefined && !isNaN(bodyFat)) {
        bodyFat = Math.max(2, Math.min(60, bodyFat));
        bodyFat = parseFloat(bodyFat.toFixed(1));
    }

    return { bodyFat, warning };
}
