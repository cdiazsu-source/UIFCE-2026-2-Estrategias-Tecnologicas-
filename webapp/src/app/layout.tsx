import type { Metadata } from "next";
import { Eye } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { AccessProvider } from "@/components/access-context";
import { UndoProvider } from "@/components/undo-banner";
import { QuickNav } from "@/components/quick-nav";
import { NovedadesBell } from "@/components/novedades-bell";
import { ActivityTracker } from "@/components/activity-tracker";
import { WelcomeLayer } from "@/components/welcome-layer";
import { PreviewWelcomeButton } from "@/components/preview-welcome-button";
import { getTrackedWho } from "@/lib/activity";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { exitViewAs } from "@/lib/actions/view";
import { viewProfile } from "@/lib/view-profiles";
import { touchLastSeen } from "@/lib/presence";
import { BRAND_NAME, BRAND_SUBTITLE } from "@/lib/brand";
import { getAssignedUpdates, getNotifyIdentity } from "@/lib/notify";

import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND_NAME} · ${BRAND_SUBTITLE}`,
  description: "Seguimiento en vivo de la planeación de Estrategias Tecnológicas — UIFCE 2026-2",
};

// Fecha y hora de la compilación/deploy (ver next.config.mjs). Se formatea en
// hora de Colombia con orden ISO (sv-SE => "2026-09-17 14:32"). Cambia con cada
// push, así el pie refleja siempre la última versión publicada.
const BUILD_ISO = process.env.BUILD_TIME ?? new Date().toISOString();
const BUILD_LABEL = new Date(BUILD_ISO).toLocaleString("sv-SE", {
  timeZone: "America/Bogota",
  dateStyle: "short",
  timeStyle: "short",
});

/** Contadores del menú lateral (por id de opción). Si la BD no responde, el menú sale sin badges. */
async function loadBadges(): Promise<Record<string, number>> {
  try {
    const now = new Date();
    const inAWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const [urgent, scheduledProjects, events] = await Promise.all([
      // Panel principal: proyectos en «Atención Inmediata» que siguen abiertos.
      prisma.project.count({ where: { priorityTag: "ATENCION_INMEDIATA", status: { not: "COMPLETADO" } } }),
      // Calendario: lo que ocurre en los próximos 7 días (proyectos con horario + eventos sueltos).
      prisma.project.count({ where: { startAt: { gte: now, lt: inAWeek } } }),
      prisma.calendarEvent.count({ where: { startAt: { gte: now, lt: inAWeek } } }),
    ]);
    return { panel: urgent, calendario: scheduledProjects + events };
  } catch {
    return {};
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // `level` es el efectivo: con «Ver como» un Junior, editable = false.
  const editable = session.authed && session.level === "full";
  // El perfil junior también registra KPIs, gestiona el checklist y maneja los
  // consentimientos. «Ver como» no cambia esto (es lo que un junior puede).
  const viewing = session.authed ? session.viewing : false;
  const viewProf = session.authed ? viewProfile(session.viewKey) : null;
  const canViewAs = session.authed ? session.canViewAs : false;
  // "Desarrollador": solo el máster (usuario MASTER) y con «Ver como» apagado.
  const canUseDeveloper = session.authed ? session.isMaster && !session.viewing : false;
  if (session.authed) await touchLastSeen(session.who);
  const badges = session.authed ? await loadBadges() : {};
  // Huella digital: solo se registra a un Junior con su credencial propia. La capa de bienvenida es para cualquier perfil identificado
  // (el máster ve la huella del equipo); su «ya la cerré» se guarda por perfil.
  const tracked = session.authed ? await getTrackedWho() : null;
  const welcomeProfile = session.authed ? (session.isMaster ? "master" : session.who) : null;
  // Campana de novedades: notas de otras personas en la bitácora de los proyectos asignados.
  const notify = session.authed ? await getNotifyIdentity() : null;
  const updates = notify ? await getAssignedUpdates(notify.userId, notify.name) : [];
  // Persona de la credencial propia (o la del perfil que se ve con «Ver como»): queda
  // preseleccionada en «¿Quién eres?».
  let currentUserId: string | null = null;
  if (session.authed && session.viewWho) {
    try {
      currentUserId = (await prisma.user.findFirst({ where: { credentialKey: session.viewWho }, select: { id: true } }))?.id ?? null;
    } catch {
      currentUserId = null;
    }
  }

  return (
    <html lang="es">
      <body className="min-h-screen bg-background font-sans antialiased">
        <AccessProvider
          currentUserId={currentUserId}
          canEdit={editable}
          canRecordMetrics={session.authed}
          canManageChecklist={session.authed}
          canManageConsent={session.authed}
          canManageLeads={session.authed}
        >
          <UndoProvider>
            <QuickNav juniorOnly={session.authed && !!session.juniorKey} />
            {tracked && <ActivityTracker />}
            {welcomeProfile && <WelcomeLayer profile={welcomeProfile} />}
            <AppShell
              badges={badges}
              canEdit={editable}
              viewing={viewing}
              viewKey={session.authed ? session.viewKey : null}
              selfKey={session.authed ? session.who : null}
              canViewAs={canViewAs}
              canUseDeveloper={canUseDeveloper}
              isJunior={session.authed && !!session.juniorKey}
              bell={notify ? <NovedadesBell profile={notify.key} items={updates} /> : null}
            >
            {viewing && (
              <div className="border-b border-warning/40 bg-warning/10">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-2 text-xs lg:pr-[4.5rem]">
                  <span className="flex items-center gap-1.5 font-medium text-warning">
                    <Eye className="h-3.5 w-3.5" />
                    Ver como {viewProf ? viewProf.label : "Junior"} activo:{" "}
                    {viewProf?.level === "full"
                      ? "ves la app con el acceso de ese perfil (sin «Desarrollador»)."
                      : "ves y editas solo lo que un monitor Junior puede."}
                  </span>
                  <div className="flex items-center gap-4">
                    <PreviewWelcomeButton className="inline-flex items-center gap-1.5 font-medium underline hover:no-underline" iconClassName="h-3.5 w-3.5">
                      Ver su pantalla de bienvenida
                    </PreviewWelcomeButton>
                    <form action={exitViewAs}>
                      <button type="submit" className="font-medium underline hover:no-underline">
                        Volver a mi vista
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
            {/* lg:pr-[4.5rem] deja libre el costado derecho para el menú rápido (QuickNav). */}
            <main className="mx-auto max-w-6xl px-6 py-8 lg:pr-[4.5rem]">{children}</main>
            <footer
              className="mx-auto max-w-6xl px-6 pb-8 text-xs text-muted-foreground lg:pr-[4.5rem]"
              title="Fecha y hora de la última publicación (hora de Colombia)"
            >
              Versión {BUILD_LABEL}
            </footer>
            </AppShell>
          </UndoProvider>
        </AccessProvider>
      </body>
    </html>
  );
}
