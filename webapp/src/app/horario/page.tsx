import Link from "next/link";
import { CalendarClock, MapPin } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { InfoHint } from "@/components/info-hint";
import { bogotaDateKey, formatDayHeader, formatTimeRange, PROJECT_STATUS_LABEL } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_BADGE_VARIANT: Record<string, "secondary" | "warning" | "success"> = {
  POR_INICIAR: "secondary",
  EN_CURSO: "warning",
  COMPLETADO: "success",
};

export default async function HorarioPage() {
  const projects = await prisma.project.findMany({
    where: { startAt: { not: null } },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      title: true,
      status: true,
      startAt: true,
      endAt: true,
      location: true,
      mainProject: { select: { id: true, title: true } },
    },
  });

  const today = bogotaDateKey(new Date());

  // Un grupo por día, en el mismo orden en que ya vienen (startAt asc).
  const groups = new Map<string, typeof projects>();
  for (const p of projects) {
    const key = bogotaDateKey(p.startAt!);
    const arr = groups.get(key) ?? [];
    arr.push(p);
    groups.set(key, arr);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Horario
          <InfoHint text="Todo lo que tiene fecha y hora fija (eventos, actividades), en el orden en que pasa. Se agrega desde la ficha de cada proyecto, con «+ Agregar horario». Ejemplo: la Semana UIFCE y cada una de sus actividades." />
        </h1>
        <p className="text-sm text-muted-foreground">Un solo lugar, en orden, sin tener que abrir cada proyecto.</p>
      </div>

      {groups.size === 0 ? (
        <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          Todavía no hay nada con horario. Se agrega desde la ficha de un proyecto.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {[...groups.entries()].map(([key, items]) => (
            <section key={key} className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {formatDayHeader(items[0].startAt!)}
                {key === today && <Badge variant="warning">Hoy</Badge>}
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/proyectos/${p.id}`}
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-border p-3 text-sm transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    <span className="inline-flex w-36 shrink-0 items-center gap-1.5 font-medium tabular-nums">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      {formatTimeRange(p.startAt!, p.endAt)}
                    </span>
                    <span className="flex-1 font-medium">{p.title}</span>
                    {p.location && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {p.location}
                      </span>
                    )}
                    {p.mainProject && (
                      <span className="text-xs text-muted-foreground">Parte de: {p.mainProject.title}</span>
                    )}
                    <Badge variant={STATUS_BADGE_VARIANT[p.status]}>{PROJECT_STATUS_LABEL[p.status]}</Badge>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
