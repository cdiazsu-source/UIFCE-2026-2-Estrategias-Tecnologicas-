import type { Metadata } from "next";

import { SiteNav } from "@/components/site-nav";

import "./globals.css";

export const metadata: Metadata = {
  title: "ET en Marcha",
  description: "Seguimiento en vivo de la planeación de Estrategias Tecnológicas — UIFCE 2026-2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background font-sans antialiased">
        <SiteNav />
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
