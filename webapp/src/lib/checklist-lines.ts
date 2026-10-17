/** Tope de subtareas que se agregan de una vez al pegar una lista. */
export const MAX_PASTED_CHECKLIST = 40;

/** Viñeta, numeración o casilla al inicio de una línea («- », «1. », «2) », «[ ] »). */
const BULLET = /^\s*(?:[-*•]|\d+\s*[.)]|\[[ xX]?\])\s*/;

/** Convierte el texto pegado (la respuesta de una IA o una lista a mano) en
 *  subtareas: una por línea, sin viñetas ni numeración. Si hay líneas con
 *  viñeta o número, solo cuentan esas: así se ignoran encabezados como
 *  «Checklist A», las cercas de código y las notas sueltas. Sin viñetas, cada
 *  línea no vacía es una subtarea. */
export function parseChecklistLines(raw: string, max = MAX_PASTED_CHECKLIST): string[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const bulleted = lines.filter((l) => BULLET.test(l));
  const source = bulleted.length > 0 ? bulleted : lines.filter((l) => !l.startsWith("```"));
  return source
    .map((l) => l.replace(BULLET, "").trim())
    .filter(Boolean)
    .slice(0, max);
}
