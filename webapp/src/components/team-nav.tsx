import Link from "next/link";

import { cn } from "@/lib/utils";

export type TeamTab = "personas" | "horas" | "actividad";

/** Pestañas del grupo «Equipo»: Personas (directorio), Horas y horario (plan, horario y puntualidad) y, solo para el máster,
 *  Actividad de los Junior (últimos movimientos). Cada una es su propia ruta; el menú lateral las agrupa en «Equipo». */
export function TeamNav({ current, showActivity }: { current: TeamTab; showActivity: boolean }) {
  const tabs: { id: TeamTab; label: string; href: string }[] = [
    { id: "personas", label: "Personas", href: "/equipo" },
    { id: "horas", label: "Horas y horario", href: "/horas" },
    ...(showActivity ? [{ id: "actividad" as const, label: "Actividad de los Junior", href: "/equipo/actividad" }] : []),
  ];
  return (
    <nav aria-label="Apartados de Equipo" className="flex flex-wrap gap-1 border-b border-border">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={t.href}
          aria-current={current === t.id ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            current === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
