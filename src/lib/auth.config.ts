import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "./auth";

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
                    if (auth.user.onboardingCompleted) {
                        return Response.redirect(new URL("/dashboard", nextUrl));
                    } else {
                        return Response.redirect(new URL("/onboarding", nextUrl));
                    }
                }
                return true;
            }

            if (isOnOnboarding) {
                if (!isLoggedIn) return false;
                if (auth.user.onboardingCompleted) {
                    return Response.redirect(new URL("/dashboard", nextUrl));
                }
                return true;
            }

            if (isOnDashboard) {
                if (isLoggedIn) {
                    if (!auth.user.onboardingCompleted) {
                        return Response.redirect(new URL("/onboarding", nextUrl));
                    }
                    return true;
                }
                return Response.redirect(new URL("/", nextUrl));
            }

            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
                session.user.role = token.role as UserRole;
                session.user.onboardingCompleted = token.onboardingCompleted as boolean;
                session.user.authProvider = "password";
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.sub = user.id;
                token.role = user.role as UserRole;
                token.onboardingCompleted = user.onboardingCompleted as boolean;
                token.authProvider = "password";
            }
            if (trigger === "update" && session) {
                token.onboardingCompleted = session.onboardingCompleted;
            }
            return token;
        }
    },
    providers: [],
    session: { strategy: "jwt" }
} satisfies NextAuthConfig;
