import { PRIORITY_TAG_COLOR, PRIORITY_TAG_LABEL } from "@/lib/utils";

/** Chip de urgencia del proyecto: emoji (doble codificación) + color mate.
 *  Devuelve null si no hay etiqueta o no se reconoce el código. */
export function PriorityTag({ tag, className = "" }: { tag: string | null; className?: string }) {
  if (!tag || !PRIORITY_TAG_LABEL[tag]) return null;
  const color = PRIORITY_TAG_COLOR[tag];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}
      style={{ color, borderColor: `${color}66`, backgroundColor: `${color}14` }}
    >
      {PRIORITY_TAG_LABEL[tag]}
    </span>
  );
}
