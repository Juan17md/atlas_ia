import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "./auth";

// Tipo de rol de usuario - importado desde auth.ts
// export type UserRole = "athlete" | "coach" | "advanced_athlete";

export const authConfig = {
    pages: {
        signIn: "/",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
            const isOnOnboarding = nextUrl.pathname.startsWith("/onboarding");
            const isOnAuth = nextUrl.pathname === "/" || nextUrl.pathname.startsWith("/register");

            if (isOnAuth) {
                if (isLoggedIn) {
                    if (auth.user.role === "coach" || auth.user.onboardingCompleted) {
                        return Response.redirect(new URL("/dashboard", nextUrl));
                    } else {
                        return Response.redirect(new URL("/onboarding", nextUrl));
                    }
                }
                return true;
            }

            if (isOnOnboarding) {
                if (!isLoggedIn) return false;
                if (auth.user.role === "coach" || auth.user.onboardingCompleted) {
                    return Response.redirect(new URL("/dashboard", nextUrl));
                }
                return true;
            }

            // Protección del dashboard
            if (isOnDashboard) {
                if (isLoggedIn) {
                    // Si es atleta y no completó onboarding -> forzar onboarding
                    // Los coaches no necesitan onboarding
                    if (auth.user.role !== "coach" && !auth.user.onboardingCompleted) {
                        return Response.redirect(new URL("/onboarding", nextUrl));
                    }
                    return true;
                }
                return Response.redirect(new URL("/", nextUrl)); // Redirige explícitamente a la raíz
            }

            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                session.user.role = token.role as UserRole;
                session.user.onboardingCompleted = token.onboardingCompleted as boolean;
                session.user.authProvider = token.authProvider as "google" | "password";
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.sub = user.id;
                token.role = user.role as UserRole;
                token.onboardingCompleted = user.onboardingCompleted as boolean;
                token.authProvider = user.authProvider as "google" | "password";
            }
            if (trigger === "update" && session) {
                token.onboardingCompleted = session.onboardingCompleted;
            }
            return token;
        }
    },
    providers: [], // Providers se añaden en auth.ts para Node runtime
    session: { strategy: "jwt" }
} satisfies NextAuthConfig;

