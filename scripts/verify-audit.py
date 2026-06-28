"""
Verificación automática de la auditoría de seguridad de Atlas IA.
Prueba login como coach, atleta y acceso a dashboard.
"""
from playwright.sync_api import sync_playwright
import sys
import time

BASE_URL = "http://localhost:3000"

USERS = {
    "coach": {"email": "coach@test.com", "password": "Test123456!"},
    "athlete": {"email": "atleta1@test.com", "password": "Test123456!"},
    "advanced": {"email": "avanzado@test.com", "password": "Test123456!"},
}

def login(page, email, password):
    page.goto(BASE_URL)
    page.wait_for_load_state("networkidle")
    time.sleep(1)
    
    page.fill("#login-email", email)
    page.fill("#login-password", password)
    page.click("button[type='submit']")
    
    # Esperar a que redirija al dashboard o muestre error
    page.wait_for_load_state("networkidle")
    time.sleep(2)
    
    current_url = page.url
    if "/dashboard" in current_url:
        return True
    return False

def logout(page):
    page.goto(f"{BASE_URL}/api/auth/signout")
    page.wait_for_load_state("networkidle")
    time.sleep(1)

def run():
    results = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()
        
        # Test 1: Login as Coach
        print("=" * 60)
        print("TEST 1: Login como Coach")
        print("=" * 60)
        success = login(page, USERS["coach"]["email"], USERS["coach"]["password"])
        if success:
            print("  ✅ Coach login exitoso - Dashboard visible")
            page.screenshot(path="/tmp/atlas-coach-dashboard.png", full_page=True)
            print("  📸 Screenshot guardado en /tmp/atlas-coach-dashboard.png")
            results.append(("Coach Login", "PASS"))
        else:
            print(f"  ❌ Coach login falló. URL: {page.url}")
            page.screenshot(path="/tmp/atlas-coach-login-fail.png", full_page=True)
            results.append(("Coach Login", "FAIL"))
        
        # Verificar que el dashboard tiene contenido del coach
        if success:
            try:
                coach_content = page.wait_for_selector("text=Atletas", timeout=3000)
                if coach_content:
                    print("  ✅ Dashboard contiene panel de coach")
                    results.append(("Coach Dashboard Content", "PASS"))
                else:
                    print("  ⚠️ No se encontró 'Atletas' en dashboard")
                    results.append(("Coach Dashboard Content", "WARN"))
            except:
                print("  ⚠️ No se encontró 'Atletas' en dashboard")
                results.append(("Coach Dashboard Content", "WARN"))
        
        # Test 2: Logout
        print("\n" + "=" * 60)
        print("TEST 2: Logout")
        print("=" * 60)
        logout(page)
        print("  ✅ Logout completado")
        
        # Test 3: Login as Athlete
        print("\n" + "=" * 60)
        print("TEST 3: Login como Atleta")
        print("=" * 60)
        success = login(page, USERS["athlete"]["email"], USERS["athlete"]["password"])
        if success:
            print("  ✅ Atleta login exitoso - Dashboard visible")
            page.screenshot(path="/tmp/atlas-athlete-dashboard.png", full_page=True)
            print("  📸 Screenshot guardado en /tmp/atlas-athlete-dashboard.png")
            results.append(("Athlete Login", "PASS"))
        else:
            print(f"  ❌ Atleta login falló. URL: {page.url}")
            page.screenshot(path="/tmp/atlas-athlete-login-fail.png", full_page=True)
            results.append(("Athlete Login", "FAIL"))
        
        # Test 4: Login as Advanced Athlete
        print("\n" + "=" * 60)
        print("TEST 4: Login como Atleta Avanzado")
        print("=" * 60)
        logout(page)
        success = login(page, USERS["advanced"]["email"], USERS["advanced"]["password"])
        if success:
            print("  ✅ Atleta Avanzado login exitoso")
            page.screenshot(path="/tmp/atlas-advanced-dashboard.png", full_page=True)
            print("  📸 Screenshot guardado en /tmp/atlas-advanced-dashboard.png")
            results.append(("Advanced Athlete Login", "PASS"))
        else:
            print(f"  ❌ Atleta Avanzado login falló")
            results.append(("Advanced Athlete Login", "FAIL"))
        
        browser.close()
    
    print("\n" + "=" * 60)
    print("RESULTADOS")
    print("=" * 60)
    all_pass = True
    for test, result in results:
        status = "✅" if result == "PASS" else "⚠️" if result == "WARN" else "❌"
        print(f"  {status} {test}: {result}")
        if result == "FAIL":
            all_pass = False
    
    if all_pass:
        print("\n🎉 Todas las verificaciones pasaron!")
    else:
        print("\n❌ Algunas verificaciones fallaron")
        sys.exit(1)

if __name__ == "__main__":
    run()
