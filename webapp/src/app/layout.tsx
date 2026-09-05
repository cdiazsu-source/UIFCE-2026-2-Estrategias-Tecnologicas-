import type { Metadata } from "next";

import { SiteNav } from "@/components/site-nav";
import { AccessProvider } from "@/components/access-context";
import { UndoProvider } from "@/components/undo-banner";
import { getSession } from "@/lib/session";
import { touchLastSeen } from "@/lib/presence";

import "./globals.css";

export const metadata: Metadata = {
  title: "ET en Marcha",
  description: "Seguimiento en vivo de la planeación de Estrategias Tecnológicas — UIFCE 2026-2",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const editable = session.authed && session.level === "full";
  // El perfil junior también puede registrar mediciones de KPIs de redes.
  const canRecordMetrics = session.authed;
  if (session.authed) await touchLastSeen(session.who);

  return (
    <html lang="es">
      <body className="min-h-screen bg-background font-sans antialiased">
        <AccessProvider canEdit={editable} canRecordMetrics={canRecordMetrics}>
          <UndoProvider>
            <SiteNav canEdit={editable} />
            <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          </UndoProvider>
        </AccessProvider>
      </body>
    </html>
  );
}
