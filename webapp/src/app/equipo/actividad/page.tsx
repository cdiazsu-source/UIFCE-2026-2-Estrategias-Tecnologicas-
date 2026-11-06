import { redirect } from "next/navigation";

import { canUseDeveloper } from "@/lib/session";
import { loadMovements } from "@/lib/movements";
import type { Movements } from "@/lib/movements-types";
import { MovementsFeed } from "@/components/movements-feed";
import { TeamNav } from "@/components/team-nav";
import { InfoHint } from "@/components/info-hint";

export const dynamic = "force-dynamic";

/** Actividad de los Junior: últimos movimientos y modificaciones de los monitores. Solo el máster (sin «Ver como»). */
export default async function ActividadPage() {
  if (!(await canUseDeveloper())) redirect("/equipo");

  let data: Movements | null = null;
  try {
    data = await loadMovements();
  } catch {
    data = null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Equipo
          <InfoHint text="Línea de tiempo de lo que hacen los monitores Junior: guardados, notas de bitácora, comentarios de su proyecto de estudio y subtareas que cambian; con «Todo el movimiento» también ven entradas a pantallas y proyectos y los botones que tocaron. Solo se registra a un Junior con su credencial propia (nunca a «Ver como» ni al máster) y nunca lo que escribe en los campos; la huella se conserva 90 días. Ejemplo: «Jean escribió una nota en la bitácora · Tracker de egresados»." />
        </h1>
        <p className="text-sm text-muted-foreground">Últimos movimientos y modificaciones de los monitores Junior.</p>
      </div>
      <TeamNav current="actividad" showActivity />
      {data ? <MovementsFeed data={data} /> : <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">No se pudo cargar la actividad. Intenta de nuevo en un momento.</p>}
    </div>
  );
}
