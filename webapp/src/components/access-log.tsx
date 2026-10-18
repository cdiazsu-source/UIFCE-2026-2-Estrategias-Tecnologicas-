"use client";

import { Clock } from "lucide-react";

import { CollapseToggle, useCollapse } from "@/components/collapsible";

export type AccessEntry = {
  name: string;
  /** Cargo ya traducido (p. ej. «Junior — Artes»). */
  roleLabel: string;
  /** Fecha y hora del último acceso, ya formateadas; null si nunca ha entrado. */
  at: string | null;
  /** «hace 3 h», calculado en el servidor. */
  ago: string | null;
};

/** Últimos accesos del equipo, para el perfil completo. Contraído por defecto (solo un resumen con
 *  el acceso más reciente) para no sumar ruido al panel; al abrirlo, una fila por persona con el
 *  más reciente primero y los que aún no entran al final. */
export function AccessLog({ entries }: { entries: AccessEntry[] }) {
  const { open, toggle } = useCollapse("home:accesos", false);
  if (entries.length === 0) return null;

  const latest = entries.find((e) => e.at);
  const never = entries.filter((e) => !e.at).length;

  return (
    <section aria-label="Últimos accesos" className="-mt-4 rounded-md border border-border bg-card/50 px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <CollapseToggle open={open} onToggle={toggle} label="los últimos accesos" />
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          Últimos accesos ({entries.length})
        </h2>
        {!open && (
          <p className="text-xs text-muted-foreground">
            {latest ? (
              <>
                Más reciente: <span className="font-medium text-foreground">{latest.name}</span> · {latest.ago}
              </>
            ) : (
              "Nadie ha entrado todavía"
            )}
            {never > 0 && ` · ${never} sin registro`}
          </p>
        )}
      </div>
      {open && (
        <ul className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-3">
          {entries.map((e) => (
            <li key={e.name} className="flex flex-col border-l-2 border-border pl-2.5 text-xs">
              <span className="truncate font-medium">
                {e.name} <span className="font-normal text-muted-foreground">· {e.roleLabel}</span>
              </span>
              {e.at ? (
                <span className="text-muted-foreground">
                  {e.at} <span className="text-foreground">({e.ago})</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Sin registro todavía</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
