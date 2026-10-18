import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { UsersTable } from "@/components/users-table";
import { InfoHint } from "@/components/info-hint";

export const dynamic = "force-dynamic";

const ROLE_ORDER = ["MASTER", "EQUIPO", "COORDINADOR", "DIRECTOR", "JUNIOR_ARTES", "JUNIOR_AUXILIAR"];

export default async function EquipoPage() {
  const session = await getSession();
  // «Ver como» un Junior: lo puede usar quien puede activar la Vista Junior (máster, Lina, Santi).
  const canViewAs = session.authed && session.canUseJuniorView && !session.viewingAsJunior;
  const users = await prisma.user.findMany();
  users.sort((a, b) => {
    const r = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
    return r !== 0 ? r : a.name.localeCompare(b.name, "es");
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Equipo
          <InfoHint text="Las personas del área y de su entorno cercano (coordinación, dirección), con su correo, rol y color. Cómo se usa: con perfil completo, «Agregar persona» o el lápiz de la fila; el correo es la identidad y el rol define qué aparece en los selectores. Ejemplo: «Maria Fernanda Celis · Junior — Artes · ET». Las personas con acceso propio (director, coordinación y los dos perfiles Junior) muestran su última visita; junto a cada Junior, «Ver como» abre la app tal como la ve ese monitor." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Directorio interno del equipo de Estrategias Tecnológicas y su entorno cercano. Editable en línea.
        </p>
      </div>
      <UsersTable users={users} canViewAs={canViewAs} />
    </div>
  );
}
