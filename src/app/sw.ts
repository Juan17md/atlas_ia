import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope & typeof globalThis;

const ctx = self as any;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener("sync", ((event: any) => {
  if (event.tag === "sync-pending-logs") {
    event.waitUntil(notificarClientesSincronizar());
  }
}) as EventListener);

async function notificarClientesSincronizar() {
  const clientes = await ctx.clients.matchAll({ type: "window" });
  for (const cliente of clientes) {
    cliente.postMessage({ type: "SYNC_PENDING_LOGS" });
  }
}

self.addEventListener("message", ((event: any) => {
  if (event.data?.type === "REGISTER_SYNC") {
    event.waitUntil(
      (async () => {
        try {
          await ctx.registration.sync.register("sync-pending-logs");
        } catch {
          // Background Sync no soportado en este navegador
        }
      })()
    );
  }
}) as EventListener);
