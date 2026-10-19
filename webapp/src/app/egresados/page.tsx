import { prisma } from "@/lib/prisma";
import { AlumniTracker, type AlumnusData } from "@/components/alumni-tracker";
import { InfoHint } from "@/components/info-hint";
import { ALUMNI_PROJECT_ID } from "@/lib/alumni";
import { parseNoteLinks } from "@/lib/note-links";

export const dynamic = "force-dynamic";

export default async function EgresadosPage() {
  const [rows, companies, project] = await Promise.all([
    prisma.alumnus.findMany({ orderBy: [{ name: "asc" }] }),
    prisma.targetCompany.findMany({ select: { name: true } }),
    prisma.project.findUnique({ where: { id: ALUMNI_PROJECT_ID }, select: { links: true } }),
  ]);

  const alumni: AlumnusData[] = rows.map((a) => ({
    id: a.id,
    name: a.name,
    cohort: a.cohort,
    area: a.area,
    degree: a.degree,
    currentCompany: a.currentCompany,
    currentRole: a.currentRole,
    linkedinUrl: a.linkedinUrl,
    status: a.status,
    notes: a.notes,
    lastCheckedAt: a.lastCheckedAt ? a.lastCheckedAt.toISOString() : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Egresados
          <InfoHint text="Tracker de los antiguos monitores de la Unidad: dónde trabajan hoy (empresa y cargo), su carrera de graduación y el estado del contacto, para conectar internamente con ellos. Cómo se usa: abre un directorio, copia los nombres y pégalos en «Agregar egresados»; luego usa «Buscar su perfil» para encontrar su LinkedIn, completa sus datos con el lápiz y cambia su estado a medida que avanzas. Solo se guarda información que cada persona comparte o publica en su perfil profesional." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Antiguos monitores de la UIFCE: dónde están hoy, qué estudiaron y cómo conectar con ellos. Hace parte del proyecto «Tracker de
          egresados UIFCE».
        </p>
      </div>
      <AlumniTracker alumni={alumni} interestCompanies={companies.map((c) => c.name)} sourceLinks={parseNoteLinks(project?.links).map((l) => ({ label: l.label || "Directorio", url: l.url }))} />
    </div>
  );
}
