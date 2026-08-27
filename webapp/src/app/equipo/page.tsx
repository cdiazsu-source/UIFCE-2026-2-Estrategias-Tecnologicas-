import { prisma } from "@/lib/prisma";
import { UsersTable } from "@/components/users-table";
import { InfoHint } from "@/components/info-hint";

export const dynamic = "force-dynamic";

const ROLE_ORDER = ["MASTER", "COORDINADOR", "DIRECTOR", "JUNIOR_ARTES", "JUNIOR_AUXILIAR"];

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
          <InfoHint text="Las personas del área y de su entorno cercano (coordinación, dirección), con su correo y rol. Se crea y edita aquí mismo; el correo es la identidad de cada quien. Por ahora es sólo directorio — no habilita inicio de sesión." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Directorio interno del equipo de Estrategias Tecnológicas y su entorno cercano. Editable en línea.
        </p>
      </div>
      <UsersTable users={users} />
    </div>
  );
}
