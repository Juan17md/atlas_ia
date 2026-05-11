import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";

const RAÍZ = resolve(import.meta.dirname, "..");
const ICONO_SVG = resolve(RAÍZ, "public/icono.svg");
const ICONOS_DIR = resolve(RAÍZ, "public/icons");

if (!existsSync(ICONOS_DIR)) {
  mkdirSync(ICONOS_DIR, { recursive: true });
}

const TAMAÑOS = [
  { nombre: "icon-72x72.png", tamaño: 72 },
  { nombre: "icon-96x96.png", tamaño: 96 },
  { nombre: "icon-128x128.png", tamaño: 128 },
  { nombre: "icon-144x144.png", tamaño: 144 },
  { nombre: "icon-152x152.png", tamaño: 152 },
  { nombre: "icon-192x192.png", tamaño: 192 },
  { nombre: "icon-384x384.png", tamaño: 384 },
  { nombre: "icon-512x512.png", tamaño: 512 },
];

const ICONOS_APPLE = [
  { nombre: "apple-touch-icon.png", tamaño: 180 },
  { nombre: "apple-touch-icon-152x152.png", tamaño: 152 },
  { nombre: "apple-touch-icon-120x120.png", tamaño: 120 },
];

const svgBuffer = readFileSync(ICONO_SVG);

console.log("🎨 Generando iconos PWA...\n");

for (const { nombre, tamaño } of [...TAMAÑOS, ...ICONOS_APPLE]) {
  const salida = resolve(ICONOS_DIR, nombre);
  try {
    await sharp(svgBuffer).resize(tamaño, tamaño).png().toFile(salida);
    console.log(`  ✅ ${nombre} (${tamaño}x${tamaño})`);
  } catch (error) {
    console.error(`  ❌ Error generando ${nombre}:`, error.message);
  }
}

console.log("\n✅ Iconos PWA generados correctamente.");
