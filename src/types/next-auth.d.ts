import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: "advanced_athlete";
            onboardingCompleted: boolean;
            authProvider: "password";
        } & DefaultSession["user"];
    }

    interface User {
        role: "advanced_athlete";
        onboardingCompleted: boolean;
        authProvider: "password";
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: "advanced_athlete";
        onboardingCompleted: boolean;
        authProvider: "password";
    }
}
