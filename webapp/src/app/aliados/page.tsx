import { prisma } from "@/lib/prisma";
import { ContactsTable } from "@/components/contacts-table";
import { CompanyLeadsSection } from "@/components/company-leads-section";
import { InfoHint } from "@/components/info-hint";

export const dynamic = "force-dynamic";

export default async function AliadosPage() {
  const [contacts, projects, targetCompanies] = await Promise.all([
    prisma.contact.findMany({
      orderBy: { name: "asc" },
      include: { project: { select: { id: true, title: true } } },
    }),
    prisma.project.findMany({ orderBy: { sourceOrder: "asc" }, select: { id: true, title: true } }),
    prisma.targetCompany.findMany({
      orderBy: [{ order: "asc" }, { name: "asc" }],
      include: { leads: { orderBy: { name: "asc" } } },
    }),
  ]);

  const companies = targetCompanies.map((company) => ({
    id: company.id,
    name: company.name,
    notes: company.notes,
    leads: company.leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      role: lead.role,
      linkedinUrl: lead.linkedinUrl,
      notes: lead.notes,
      lastCheckedAt: lead.lastCheckedAt ? lead.lastCheckedAt.toISOString() : null,
    })),
  }));

  return (
    <div className="flex flex-col gap-6">
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

      <div className="border-t border-border pt-5">
        <CompanyLeadsSection companies={companies} />
      </div>
    </div>
  );
}
