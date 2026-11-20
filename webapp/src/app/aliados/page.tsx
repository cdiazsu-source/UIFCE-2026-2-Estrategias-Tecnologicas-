import { prisma } from "@/lib/prisma";
import { AllyDependenciesSection, type ContactItem } from "@/components/ally-dependencies-section";
import { CompanyLeadsSection } from "@/components/company-leads-section";
import { AcademicAlliesSection } from "@/components/academic-allies-section";
import { InfoHint } from "@/components/info-hint";
import { loadAcademicAllies } from "@/lib/academic-allies";

export const dynamic = "force-dynamic";

/** Aliados dependencias. Si la columna `dependency` aún no existe (migración sin aplicar), se lee sin ella
 *  y la dependencia se deduce del rol, así la pantalla no falla. */
async function loadContacts(): Promise<ContactItem[]> {
  try {
    const rows = await prisma.contact.findMany({
      orderBy: { name: "asc" },
      include: { project: { select: { id: true, title: true } } },
    });
    return rows.map((c) => ({ ...c, dependency: c.dependency ?? null }));
  } catch {
    const rows = await prisma.contact.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        role: true,
        email: true,
        phone: true,
        photoUrl: true,
        projectId: true,
        notes: true,
        project: { select: { id: true, title: true } },
      },
    });
    return rows.map((c) => ({ ...c, dependency: null }));
  }
}

export default async function AliadosPage() {
  const alliesData = await loadAcademicAllies();
  const [contacts, projects, targetCompanies] = await Promise.all([
    loadContacts(),
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
    sector: company.sector,
    logoUrl: company.logoUrl,
    linkedinUrl: company.linkedinUrl,
    tags: company.tags,
    leads: company.leads.map((lead) => ({
      id: lead.id,
      name: lead.name,
      role: lead.role,
      kind: lead.kind,
      status: lead.status,
      alumni: lead.alumni,
      undergrad: lead.undergrad,
      postgrad: lead.postgrad,
      linkedinUrl: lead.linkedinUrl,
      notes: lead.notes,
      lastCheckedAt: lead.lastCheckedAt ? lead.lastCheckedAt.toISOString() : null,
    })),
  }));

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Aliados
          <InfoHint text="Personas e instituciones fuera del equipo con quienes ET coordina, en tres categorías que se abren y se cierran con su flecha: aliados académicos (los profesores), aliados dependencias (ORI, CIID, Vicedecanatura, Comunicaciones y demás) y empresas de interés. Cómo se usa: abre la categoría que necesites; con perfil completo puedes agregar y editar aliados y vincular cada uno a un proyecto." />
        </h1>
        <p className="text-sm text-muted-foreground">Relaciones estratégicas de la Unidad con la academia, la Facultad y el sector productivo.</p>
      </div>

      <AcademicAlliesSection data={alliesData} projectOptions={projects} />

      <div className="border-t border-border pt-5">
        <AllyDependenciesSection contacts={contacts} projectOptions={projects} />
      </div>

      <div className="border-t border-border pt-5">
        <CompanyLeadsSection companies={companies} />
      </div>
    </div>
  );
}
