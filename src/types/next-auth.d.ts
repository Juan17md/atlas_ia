import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: "athlete" | "coach" | "advanced_athlete";
            onboardingCompleted: boolean;
            authProvider: "google" | "password";
        } & DefaultSession["user"];
    }

    interface User {
        role: "athlete" | "coach" | "advanced_athlete";
        onboardingCompleted: boolean;
        authProvider: "google" | "password";
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: "athlete" | "coach" | "advanced_athlete";
        onboardingCompleted: boolean;
        authProvider: "google" | "password";
    }
}
