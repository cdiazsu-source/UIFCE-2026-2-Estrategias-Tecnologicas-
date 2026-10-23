import { prisma } from "@/lib/prisma";
import { canPostSticky, getSession } from "@/lib/session";
import { loadStickyNote } from "@/lib/sticky-load";
import type { StickyData } from "@/lib/sticky-note";
import { StickyEditor } from "@/components/sticky-note";
import { UsersTable } from "@/components/users-table";
import { InfoHint } from "@/components/info-hint";

export const dynamic = "force-dynamic";

const ROLE_ORDER = ["MASTER", "EQUIPO", "COORDINADOR", "DIRECTOR", "JUNIOR_ARTES", "JUNIOR_AUXILIAR"];

export default async function EquipoPage() {
  const session = await getSession();
  // «Ver como»: lo puede usar quien tiene ese permiso (máster, Lina, Santi) y no lo está usando ya.
  const canViewAs = session.authed && session.canViewAs && !session.viewing;
  const users = await prisma.user.findMany();
  // Post-it para los Junior: solo el máster lo edita. Tabla nueva: sin ella (migración pendiente) el editor no sale.
  let sticky: StickyData | null = null;
  let showSticky = false;
  if (await canPostSticky()) {
    try {
      sticky = await loadStickyNote(undefined, true);
      showSticky = true;
    } catch {
      showSticky = false;
    }
  }
  users.sort((a, b) => {
    const r = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
    return r !== 0 ? r : a.name.localeCompare(b.name, "es");
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Equipo
          <InfoHint text="Las personas del área y de su entorno cercano (coordinación, dirección), con su correo, rol y color. Cómo se usa: con perfil completo, «Agregar persona» o el lápiz de la fila; el correo es la identidad y el rol define qué aparece en los selectores. Ejemplo: «Maria Fernanda Celis · Junior — Artes · ET». Las personas con acceso propio (director, coordinación y los dos perfiles Junior) muestran su última visita; junto a cada una de ellas, «Ver como» abre la app tal como la ve esa persona." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Directorio interno del equipo de Estrategias Tecnológicas y su entorno cercano. Editable en línea.
        </p>
      </div>
      {showSticky && <StickyEditor current={sticky} />}
      <UsersTable users={users} canViewAs={canViewAs} selfKey={session.authed ? session.who : null} />
    </div>
  );
}
