import type { Metadata } from "next";
import { Eye } from "lucide-react";

import { SiteNav } from "@/components/site-nav";
import { AccessProvider } from "@/components/access-context";
import { UndoProvider } from "@/components/undo-banner";
import { getSession } from "@/lib/session";
import { setJuniorView } from "@/lib/actions/view";
import { touchLastSeen } from "@/lib/presence";

import "./globals.css";

export const metadata: Metadata = {
  title: "ET en Marcha",
  description: "Seguimiento en vivo de la planeación de Estrategias Tecnológicas — UIFCE 2026-2",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // `level` es el efectivo: con la Vista Junior activa, editable = false.
  const editable = session.authed && session.level === "full";
  // El perfil junior también registra KPIs, gestiona el checklist y maneja los
  // consentimientos. La Vista Junior no cambia esto (es lo que un junior puede).
  const asJunior = session.authed ? session.viewingAsJunior : false;
  const canUseJuniorView = session.authed ? session.canUseJuniorView : false;
  if (session.authed) await touchLastSeen(session.who);

  return (
    <html lang="es">
      <body className="min-h-screen bg-background font-sans antialiased">
        <AccessProvider
          canEdit={editable}
          canRecordMetrics={session.authed}
          canManageChecklist={session.authed}
          canManageConsent={session.authed}
        >
          <UndoProvider>
            <SiteNav canEdit={editable} viewingAsJunior={asJunior} canUseJuniorView={canUseJuniorView} />
            {asJunior && (
              <div className="border-b border-warning/40 bg-warning/10">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-2 text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-warning">
                    <Eye className="h-3.5 w-3.5" />
                    Vista Junior activa: ves y editas solo lo que un monitor Junior puede.
                  </span>
                  <form action={setJuniorView.bind(null, false)}>
                    <button type="submit" className="font-medium underline hover:no-underline">
                      Volver a mi vista
                    </button>
                  </form>
                </div>
              </div>
            )}
            <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
          </UndoProvider>
        </AccessProvider>
      </body>
    </html>
  );
}
