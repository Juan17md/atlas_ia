import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { RegistradorSW } from "@/components/registrador-sw";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false, // Solo precargar la fuente principal
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Atlas IA - Tu Entrenador Personal Inteligente",
    template: "%s | Atlas IA",
  },
  description:
    "Gestiona rutinas, seguimiento de progreso y entrenamientos personalizados con inteligencia artificial.",
  keywords: ["gimnasio", "entrenamiento", "fitness", "rutinas", "IA", "progreso"],
  authors: [{ name: "Atlas IA Team" }],
  creator: "Atlas IA",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Atlas IA",
    startupImage: [],
  },
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: "/icono.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/icono.svg", type: "image/svg+xml" }],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
      },
      {
        rel: "mask-icon",
        url: "/icono.svg",
        color: "#FF0000",
      },
    ],
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Atlas IA",
    title: "Atlas IA - Tu Entrenador Personal Inteligente",
    description:
      "Gestiona rutinas, seguimiento de progreso y entrenamientos personalizados con IA.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://ik.imagekit.io" />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
        <RegistradorSW />
      </body>
    </html>
  );
}
