import { prisma } from "@/lib/prisma";
import { ContactsTable } from "@/components/contacts-table";
import { InfoHint } from "@/components/info-hint";

export const dynamic = "force-dynamic";

export default async function AliadosPage() {
  const [contacts, projects] = await Promise.all([
    prisma.contact.findMany({
      orderBy: { name: "asc" },
      include: { project: { select: { id: true, title: true } } },
    }),
    prisma.project.findMany({ orderBy: { sourceOrder: "asc" }, select: { id: true, title: true } }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Aliados
          <InfoHint text="Personas e instituciones fuera del equipo con quienes ET coordina: profesores, otras dependencias, aliados externos. Cómo se usa: con perfil completo, «Agregar aliado» o el lápiz de la fila; puedes vincular cada aliado a un proyecto. Ejemplo: «Sandra Carlos Vargas · Vicedecanatura de Investigación y Extensión · proyecto Semana UIFCE»." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Directorio de aliados —personas e instituciones externas al equipo— con el proyecto al que están vinculados.
        </p>
      </div>
      <ContactsTable contacts={contacts} projectOptions={projects} />
    </div>
  );
}
