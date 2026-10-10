/** Orden por defecto de los proyectos del panel. Menor rango = va primero:
 *  1. «❗ Atención Inmediata»
 *  2. los que están «En curso»
 *  3. «📅 Próximo Ciclo»
 *  4. «⏸️ Backlog»
 *  5. sin etiqueta
 *  6. los «Completados», siempre al final.
 *  Dentro de cada grupo se respeta el orden de planeación (`sortIndex`). */
type Orderable = { status: string; priorityTag: string | null; sortIndex: number };

const PRIORITY_RANK: Record<string, number> = {
  ATENCION_INMEDIATA: 0,
  PROXIMO_CICLO: 2,
  BACKLOG: 3,
};

function urgencyRank(p: Orderable): number {
  if (p.status === "COMPLETADO") return 5;
  if (p.priorityTag === "ATENCION_INMEDIATA") return 0;
  if (p.status === "EN_CURSO") return 1;
  return PRIORITY_RANK[p.priorityTag ?? ""] ?? 4;
}

export function byUrgency(a: Orderable, b: Orderable): number {
  return urgencyRank(a) - urgencyRank(b) || a.sortIndex - b.sortIndex;
}
