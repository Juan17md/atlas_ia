const { execSync } = require("child_process");
const path = require("path");

const BASE_URL = "http://localhost:3000";

const USERS = {
    coach: { email: "coach@test.com", password: "Test123456!" },
    athlete: { email: "atleta1@test.com", password: "Test123456!" },
    advanced: { email: "avanzado@test.com", password: "Test123456!" },
};

const script = `
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const results = [];

    async function login(email, password) {
        await page.goto('${BASE_URL}');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        await page.fill('#login-email', email);
        await page.fill('#login-password', password);
        await page.click("button[type='submit']");

        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        return page.url().includes('/dashboard');
    }

    async function logout() {
        await page.goto('${BASE_URL}/api/auth/signout');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
    }

    // Test 1: Coach Login
    console.log('TEST 1: Login como Coach');
    let ok = await login('${USERS.coach.email}', '${USERS.coach.password}');
    console.log(ok ? '  ✅ Coach login exitoso' : '  ❌ Coach login falló');
    results.push(['Coach Login', ok ? 'PASS' : 'FAIL']);
    if (ok) {
        await page.screenshot({ path: '/tmp/atlas-coach-dashboard.png', fullPage: true });
        console.log('  📸 Screenshot: /tmp/atlas-coach-dashboard.png');
        try {
            await page.waitForSelector('text=Atletas', { timeout: 3000 });
            console.log('  ✅ Panel de coach visible');
            results.push(['Coach Dashboard', 'PASS']);
        } catch {
            console.log('  ⚠️ Texto "Atletas" no encontrado');
            results.push(['Coach Dashboard', 'WARN']);
        }
    }

    // Test 2: Athlete Login
    await logout();
    console.log('\\nTEST 2: Login como Atleta');
    ok = await login('${USERS.athlete.email}', '${USERS.athlete.password}');
    console.log(ok ? '  ✅ Atleta login exitoso' : '  ❌ Atleta login falló');
    results.push(['Athlete Login', ok ? 'PASS' : 'FAIL']);
    if (ok) {
        await page.screenshot({ path: '/tmp/atlas-athlete-dashboard.png', fullPage: true });
        console.log('  📸 Screenshot: /tmp/atlas-athlete-dashboard.png');
    }

    // Test 3: Advanced Athlete Login
    await logout();
    console.log('\\nTEST 3: Login como Atleta Avanzado');
    ok = await login('${USERS.advanced.email}', '${USERS.advanced.password}');
    console.log(ok ? '  ✅ Atleta Avanzado login exitoso' : '  ❌ Atleta Avanzado login falló');
    results.push(['Advanced Athlete Login', ok ? 'PASS' : 'FAIL']);
    if (ok) {
        await page.screenshot({ path: '/tmp/atlas-advanced-dashboard.png', fullPage: true });
        console.log('  📸 Screenshot: /tmp/atlas-advanced-dashboard.png');
    }

    await browser.close();

    console.log('\\n============================================================');
    console.log('RESULTADOS');
    console.log('============================================================');
    let allPass = true;
    for (const [test, result] of results) {
        const icon = result === 'PASS' ? '✅' : result === 'WARN' ? '⚠️' : '❌';
        console.log(\`  \${icon} \${test}: \${result}\`);
        if (result === 'FAIL') allPass = false;
    }
    console.log(allPass ? '\\n🎉 Todas las verificaciones pasaron!' : '\\n❌ Algunas verificaciones fallaron');
    process.exit(allPass ? 0 : 1);
})();
`;

const scriptPath = path.join(__dirname, "verify-audit-runner.js");
require("fs").writeFileSync(scriptPath, script);

const { spawn } = require("child_process");
const runner = spawn("npx", ["playwright", "test", "--reporter=line", scriptPath], {
    stdio: "inherit",
    shell: true,
    cwd: __dirname,
});

runner.on("exit", (code) => {
    process.exit(code);
});
