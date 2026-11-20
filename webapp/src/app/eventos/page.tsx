import { prisma } from "@/lib/prisma";
import { UnitEventsBoard } from "@/components/unit-events-board";
import { InfoHint } from "@/components/info-hint";
import { normalizeKind, normalizeModality, normalizeStatus, type UnitEventData } from "@/lib/unit-events";

export const dynamic = "force-dynamic";

export default async function EventosPage() {
  const projects = await prisma.project.findMany({ orderBy: { sourceOrder: "asc" }, select: { id: true, title: true } });

  // Tabla nueva: si la migración aún no se aplicó, la pantalla avisa en lugar de fallar.
  let events: UnitEventData[] = [];
  let missing = false;
  try {
    const rows = await prisma.unitEvent.findMany({ orderBy: { date: "desc" } });
    events = rows.map((e) => ({
      id: e.id,
      kind: normalizeKind(e.kind),
      title: e.title,
      date: e.date.toISOString(),
      modality: normalizeModality(e.modality),
      place: e.place,
      speaker: e.speaker,
      audience: e.audience,
      status: normalizeStatus(e.status),
      registered: e.registered,
      attended: e.attended,
      link: e.link,
      projectId: e.projectId,
      notes: e.notes,
    }));
  } catch {
    missing = true;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Microtalleres y eventos
          <InfoHint text="Histórico de los microtalleres y eventos de la Unidad, año por año: fecha, tallerista, modalidad, inscritos y asistentes, y el enlace a su evidencia. Cómo se usa: elige el año, agrega cada microtaller o evento con «Agregar» y, cuando se realice, registra cuántas personas asistieron. «Comparar años» resume todos los años en una tabla." />
        </h1>
        <p className="text-sm text-muted-foreground">Seguimiento de microtalleres y eventos de la UIFCE por año.</p>
      </div>
      {missing ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          Esta sección necesita una actualización de la base de datos que aún no se ha aplicado. Quien despliega debe correr <code>npm run db:deploy</code>.
        </p>
      ) : (
        <UnitEventsBoard events={events} projectOptions={projects} />
      )}
    </div>
  );
}
