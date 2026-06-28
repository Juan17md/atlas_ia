"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
            Sentry.captureException(error);
        }
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex flex-col items-center justify-center min-h-dvh gap-4 p-8 bg-black text-white">
                    <h1 className="text-2xl font-bold">Error crítico</h1>
                    <p className="text-neutral-400 text-sm text-center">
                        Ocurrió un error inesperado. Por favor recarga la página.
                    </p>
                    <button
                        onClick={reset}
                        className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </body>
        </html>
    );
}
