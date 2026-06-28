import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cargar .env manualmente — extraer solo FIREBASE_SERVICE_ACCOUNT_KEY
const envPath = resolve(__dirname, "../.env");
const envContent = readFileSync(envPath, "utf-8");
const keyLine = envContent
    .split("\n")
    .find((l) => l.startsWith("FIREBASE_SERVICE_ACCOUNT_KEY="));

if (!keyLine) {
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY no encontrada en .env");
    process.exit(1);
}

const key = keyLine.slice("FIREBASE_SERVICE_ACCOUNT_KEY=".length).trim();
let cleanedKey = key;
// Quitar comillas envolventes
if (cleanedKey.startsWith("'") && cleanedKey.endsWith("'")) cleanedKey = cleanedKey.slice(1, -1);
else if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) cleanedKey = cleanedKey.slice(1, -1);

const serviceAccount = JSON.parse(cleanedKey);
if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
});

const auth = admin.auth(app);
const db = admin.firestore(app);

const USUARIOS = [
    {
        email: "coach@test.com",
        password: "Test123456!",
        name: "Coach Test",
        role: "coach",
        onboardingCompleted: true,
    },
    {
        email: "atleta1@test.com",
        password: "Test123456!",
        name: "Atleta Uno",
        role: "athlete",
        onboardingCompleted: true,
        goal: "hypertrophy",
        experienceLevel: "intermediate",
        injuries: [],
    },
    {
        email: "atleta2@test.com",
        password: "Test123456!",
        name: "Atleta Dos",
        role: "athlete",
        onboardingCompleted: true,
        goal: "strength",
        experienceLevel: "advanced",
        injuries: ["hombro derecho"],
    },
    {
        email: "avanzado@test.com",
        password: "Test123456!",
        name: "Atleta Avanzado",
        role: "advanced_athlete",
        onboardingCompleted: true,
        goal: "strength",
        experienceLevel: "advanced",
        injuries: [],
    },
];

async function main() {
    console.log("Creando usuarios de prueba...\n");

    let coachId = null;
    const coachIds = [];

    for (const u of USUARIOS) {
        try {
            // Eliminar si ya existe
            try {
                const existing = await auth.getUserByEmail(u.email);
                await auth.deleteUser(existing.uid);
                await db.collection("users").doc(existing.uid).delete();
                // Limpiar subcolecciones relacionadas
                const collections = ["routines", "training_logs", "workout_sets", "body_measurements", "notifications", "vivi_intelligence"];
                for (const col of collections) {
                    const snap = await db.collection(col).where("athleteId", "==", existing.uid).get();
                    const batch = db.batch();
                    snap.docs.forEach((d) => batch.delete(d.ref));
                    await batch.commit();
                }
                console.log(`  Eliminado usuario existente: ${u.email}`);
            } catch {
                // No existe
            }

            const user = await auth.createUser({
                email: u.email,
                password: u.password,
                displayName: u.name,
            });

            await auth.setCustomUserClaims(user.uid, { role: u.role });

            const userData = {
                id: user.uid,
                name: u.name,
                email: u.email,
                role: u.role,
                createdAt: new Date(),
                updatedAt: new Date(),
                onboardingCompleted: u.onboardingCompleted ?? false,
                goal: u.goal || null,
                experienceLevel: u.experienceLevel || null,
                injuries: u.injuries || [],
            };

            await db.collection("users").doc(user.uid).set(userData);
            console.log(`  ✅ ${u.email} (${u.role}) — UID: ${user.uid}`);

            if (u.role === "coach") {
                coachId = user.uid;
                coachIds.push(user.uid);
            }
        } catch (err) {
            console.error(`  ❌ Error creando ${u.email}:`, err.message);
        }
    }

    // Vincular atletas al coach
    if (coachId) {
        const coachDoc = await db.collection("users").doc(coachId).get();
        const coachName = coachDoc.data()?.name || "Coach Test";

        for (const u of USUARIOS) {
            if (u.role === "athlete" || u.role === "advanced_athlete") {
                try {
                    const userRecord = await auth.getUserByEmail(u.email);
                    await db.collection("users").doc(userRecord.uid).update({
                        coachId: coachId,
                        coachName: coachName,
                        linkedAt: new Date(),
                    });
                    console.log(`  🔗 ${u.email} vinculado a ${coachName}`);
                } catch (err) {
                    console.error(`  ❌ Error vinculando ${u.email}:`, err.message);
                }
            }
        }
    }

    console.log("\n--- Credenciales de prueba ---");
    for (const u of USUARIOS) {
        console.log(`  ${u.email} / ${u.password}`);
    }

    await app.delete();
}

main().catch(console.error);
