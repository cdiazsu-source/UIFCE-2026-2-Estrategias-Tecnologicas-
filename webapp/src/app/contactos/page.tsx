import { prisma } from "@/lib/prisma";
import { ContactsTable } from "@/components/contacts-table";
import { InfoHint } from "@/components/info-hint";

export const dynamic = "force-dynamic";

export default async function ContactosPage() {
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
          Contactos
          <InfoHint text="Personas fuera del equipo con quienes ET coordina: profesores, otras dependencias, aliados externos. Cómo se usa: con perfil completo, «Agregar contacto» o el lápiz de la fila; puedes vincular cada contacto a un proyecto. Ejemplo: «Sandra Carlos Vargas · Vicedecanatura de Investigación y Extensión · proyecto Semana UIFCE»." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Directorio de personas e instituciones externas al equipo, con el proyecto al que están vinculadas.
        </p>
      </div>
      <ContactsTable contacts={contacts} projectOptions={projects} />
    </div>
  );
}
