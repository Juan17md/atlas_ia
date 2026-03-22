import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

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
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 3,
};

export const metadata: Metadata = {
  title: {
    default: "Atlas IA - Tu Entrenador Personal Inteligente",
    template: "%s | Atlas IA"
  },
  description: "Gestiona rutinas, seguimiento de progreso y entrenamientos personalizados con inteligencia artificial.",
  keywords: ["gimnasio", "entrenamiento", "fitness", "rutinas", "IA", "progreso"],
  authors: [{ name: "Atlas IA Team" }],
  creator: "Atlas IA",
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Atlas IA",
    title: "Atlas IA - Tu Entrenador Personal Inteligente",
    description: "Gestiona rutinas, seguimiento de progreso y entrenamientos personalizados con IA.",
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
        {/* Preconnect para recursos externos críticos */}
        <link rel="preconnect" href="https://ik.imagekit.io" />
        <link rel="dns-prefetch" href="https://ik.imagekit.io" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
