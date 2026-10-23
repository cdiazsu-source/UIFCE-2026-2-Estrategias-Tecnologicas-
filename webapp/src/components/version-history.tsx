import { History } from "lucide-react";

import { CHANGELOG, CHANGELOG_SHOWN, CHANGE_TYPE_LABEL, type ChangeType, type VersionEntry } from "@/lib/changelog";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TYPE_CLASS: Record<ChangeType, string> = {
  NUEVO: "bg-success/15 text-success",
  MEJORA: "bg-accent text-primary",
  CORRECCION: "bg-warning/15 text-warning",
};

/** «22 de octubre de 2026», leyendo el día como mediodía de Colombia para que no se corra de día. */
function dayLabel(date: string): string {
  return new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T12:00:00-05:00`));
}

function Changes({ entry }: { entry: VersionEntry }) {
  return (
    <ul className="flex flex-col gap-1.5 pt-1">
      {entry.changes.map((c, i) => (
        <li key={i} className="flex items-baseline gap-2 text-sm">
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px]", TYPE_CLASS[c.type])}>{CHANGE_TYPE_LABEL[c.type]}</span>
          <span>{c.text}</span>
        </li>
      ))}
    </ul>
  );
}

/** Resumen de versiones: las últimas 10 actualizaciones de la app, estilo notas de versión. La más reciente va abierta; las demás
 *  arrancan plegadas para no meter ruido. El historial se escribe a mano en `lib/changelog.ts`. */
export function VersionHistory() {
  const shown = CHANGELOG.slice(0, CHANGELOG_SHOWN);
  const [latest, ...older] = shown;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          <History className="h-4 w-4" aria-hidden />
          Resumen de versiones
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">Actual {latest.version}</span>
        </CardTitle>
        <p className="text-xs text-muted-foreground">Las últimas {shown.length} actualizaciones, de la más reciente a la más antigua.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="rounded-md border border-border p-3">
          <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold">
            <span>{latest.title}</span>
            <span className="text-xs font-normal text-muted-foreground">
              v{latest.version} · {dayLabel(latest.date)}
            </span>
          </p>
          <Changes entry={latest} />
        </div>
        {older.map((v) => (
          <details key={v.version} className="rounded-md border border-border px-3 py-2">
            <summary className="flex cursor-pointer select-none flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-medium">{v.title}</span>
              <span className="text-xs text-muted-foreground">
                v{v.version} · {dayLabel(v.date)} · {v.changes.length} {v.changes.length === 1 ? "cambio" : "cambios"}
              </span>
            </summary>
            <Changes entry={v} />
          </details>
        ))}
      </CardContent>
    </Card>
  );
}
