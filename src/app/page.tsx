import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginPageClient } from "@/components/auth/login-page-client";

/**
 * Landing/Login Page - Server Component wrapper
 * Verifica autenticación en servidor para evitar flash de contenido
 */
export default async function LoginPage() {
    const session = await auth();

    // Redirección en servidor (más rápida que useEffect)
    if (session?.user) {
        if (session.user.onboardingCompleted) {
            redirect("/dashboard");
        } else {
            redirect("/onboarding");
        }
    }

    return <LoginPageClient />;
}
