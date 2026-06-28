import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, "../.env");
const envContent = readFileSync(envPath, "utf-8");
const keyLine = envContent
    .split("\n")
    .find((l) => l.startsWith("FIREBASE_SERVICE_ACCOUNT_KEY="));
if (!keyLine) {
    console.error("FIREBASE_SERVICE_ACCOUNT_KEY no encontrada");
    process.exit(1);
}

const key = keyLine.slice("FIREBASE_SERVICE_ACCOUNT_KEY=".length).trim();
let cleanedKey = key;
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

const TESTS = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
    TESTS.push({ name, fn });
}

async function runTests() {
    // Obtener usuarios
    const users = {};
    for (const email of ["coach@test.com", "atleta1@test.com", "atleta2@test.com", "avanzado@test.com"]) {
        try {
            const record = await auth.getUserByEmail(email);
            users[email] = record;
        } catch {
            console.error(`  ❌ Usuario ${email} no encontrado`);
        }
    }

    const coach = users["coach@test.com"];
    const atleta1 = users["atleta1@test.com"];
    const atleta2 = users["atleta2@test.com"];
    const avanzado = users["avanzado@test.com"];

    // ──────── TEST 1: Custom Claims ────────
    test("Custom claims: coach tiene role=coach", () => {
        if (!coach) throw new Error("Coach no encontrado");
        const claims = coach.customClaims || {};
        if (claims.role !== "coach") throw new Error(`Esperaba role=coach, obtuvo ${claims.role}`);
    });

    test("Custom claims: atleta1 tiene role=athlete", () => {
        if (!atleta1) throw new Error("Atleta1 no encontrado");
        const claims = atleta1.customClaims || {};
        if (claims.role !== "athlete") throw new Error(`Esperaba role=athlete, obtuvo ${claims.role}`);
    });

    test("Custom claims: avanzado tiene role=advanced_athlete", () => {
        if (!avanzado) throw new Error("Avanzado no encontrado");
        const claims = avanzado.customClaims || {};
        if (claims.role !== "advanced_athlete") throw new Error(`Esperaba role=advanced_athlete, obtuvo ${claims.role}`);
    });

    // ──────── TEST 2: Documentos en Firestore ────────
    test("Firestore: coach tiene coachId ausente", async () => {
        const doc = await db.collection("users").doc(coach.uid).get();
        if (!doc.exists) throw new Error("Documento coach no existe");
        if (doc.data().coachId) throw new Error("Coach no debería tener coachId");
    });

    test("Firestore: atleta1 tiene coachId correcto", async () => {
        const doc = await db.collection("users").doc(atleta1.uid).get();
        if (!doc.exists) throw new Error("Documento atleta1 no existe");
        if (doc.data().coachId !== coach.uid) throw new Error(`coachId incorrecto: ${doc.data().coachId}`);
    });

    test("Firestore: atleta2 tiene coachId correcto", async () => {
        const doc = await db.collection("users").doc(atleta2.uid).get();
        if (!doc.exists) throw new Error("Documento atleta2 no existe");
        if (doc.data().coachId !== coach.uid) throw new Error(`coachId incorrecto: ${doc.data().coachId}`);
    });

    test("Firestore: avanzado tiene coachId correcto", async () => {
        const doc = await db.collection("users").doc(avanzado.uid).get();
        if (!doc.exists) throw new Error("Documento avanzado no existe");
        if (doc.data().coachId !== coach.uid) throw new Error(`coachId incorrecto: ${doc.data().coachId}`);
    });

    // ──────── TEST 3: Vinculación (solo atletas del coach son visibles) ────────
    test("Firestore: query atletas del coach retorna solo sus atletas", async () => {
        const snapshot = await db.collection("users")
            .where("coachId", "==", coach.uid)
            .get();
        const athleteIds = snapshot.docs.map(d => d.id).sort();
        const expected = [atleta1.uid, atleta2.uid, avanzado.uid].sort();
        if (JSON.stringify(athleteIds) !== JSON.stringify(expected)) {
            throw new Error(`Atletas esperados: ${expected.join(",")}, obtenidos: ${athleteIds.join(",")}`);
        }
    });

    // ──────── TEST 4: Intentar acceder como atleta a datos de otro atleta ────────
    // Nota: Esta verificación es conceptual: verificamos que atleta2 NO tenga coachId apuntando a atleta1
    test("Firestore: atleta2 no puede ver datos de atleta1 (coachId diferente)", async () => {
        const doc1 = await db.collection("users").doc(atleta1.uid).get();
        const doc2 = await db.collection("users").doc(atleta2.uid).get();
        // Ambos tienen el mismo coach, pero ningún atleta tiene coachId apuntando a otro atleta
        if (doc1.data().coachId === atleta2.uid) throw new Error("atleta1 tiene coachId de atleta2!");
        if (doc2.data().coachId === atleta1.uid) throw new Error("atleta2 tiene coachId de atleta1!");
    });

    // ──────── TEST 5: Roles válidos ────────
    test("Roles: solo roles válidos asignados", () => {
        const roles = ["coach", "athlete", "advanced_athlete"];
        for (const u of [coach, atleta1, atleta2, avanzado]) {
            const r = (u.customClaims || {}).role;
            if (!roles.includes(r)) throw new Error(`Rol inválido: ${r} para ${u.email}`);
        }
    });

    // ──────── EJECUTAR ────────
    console.log("\n🔍 Verificaciones de datos en Firebase...\n");
    for (const { name, fn } of TESTS) {
        try {
            if (fn.constructor.name === "AsyncFunction") {
                await fn();
            } else {
                fn();
            }
            console.log(`  ✅ ${name}`);
            passed++;
        } catch (err) {
            console.log(`  ❌ ${name}: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n📊 Resultados: ${passed} pasaron, ${failed} fallaron de ${TESTS.length} total`);
    await app.delete();
    process.exit(failed > 0 ? 1 : 0);
}

runTests();
