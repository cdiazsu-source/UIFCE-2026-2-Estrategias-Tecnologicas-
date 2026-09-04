import { prisma } from "@/lib/prisma";
import { UsersTable } from "@/components/users-table";
import { InfoHint } from "@/components/info-hint";

export const dynamic = "force-dynamic";

const ROLE_ORDER = ["MASTER", "EQUIPO", "COORDINADOR", "DIRECTOR", "JUNIOR_ARTES", "JUNIOR_AUXILIAR"];

export default async function EquipoPage() {
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
          <InfoHint text="Las personas del área y de su entorno cercano (coordinación, dirección), con su correo, rol y color. Cómo se usa: con perfil completo, «Agregar persona» o el lápiz de la fila; el correo es la identidad y el rol define qué aparece en los selectores. Ejemplo: «Maria Fernanda Celis · Junior — Artes · ET». Junto al director figura su última visita." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Directorio interno del equipo de Estrategias Tecnológicas y su entorno cercano. Editable en línea.
        </p>
      </div>
      <UsersTable users={users} />
    </div>
  );
}
