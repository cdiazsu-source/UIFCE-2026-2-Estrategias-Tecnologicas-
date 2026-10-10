/** Orden preferido de secciones de la línea gráfica; cualquier otra sección va
 *  después, alfabética. Lo comparten la página y el texto que se copia. */
export const SECTION_ORDER = ["Lineamientos", "Colores", "Franjas", "Formatos", "Aprobación"];

type GuidelineLike = { section: string; title: string; body: string; colorHex: string | null; order: number };

export function sortSections<T>(entries: [string, T][]): [string, T][] {
  return [...entries].sort(([a], [b]) => {
    const ia = SECTION_ORDER.indexOf(a);
    const ib = SECTION_ORDER.indexOf(b);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.localeCompare(b, "es");
  });
}

/** Presupuesto de caracteres de la idea clave de cada indicación en el resumen. */
const KEY_IDEA_BUDGET = 260;

/** Parte el texto en oraciones sin cortar dentro de comillas ni de corchetes
 *  (ej. «"Hola, soy [nombre]. Inscríbete…"» es una sola pieza). */
function sentences(text: string): string[] {
  const out: string[] = [];
  const boundary = /(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ"«¿¡])/g;
  let start = 0;
  let m: RegExpExecArray | null;
  while ((m = boundary.exec(text))) {
    const sofar = text.slice(start, m.index);
    const quotesClosed = (sofar.match(/"/g) ?? []).length % 2 === 0;
    const bracketsClosed = !/\[[^\]]*$/.test(sofar);
    if (quotesClosed && bracketsClosed) {
      out.push(sofar);
      start = m.index + m[0].length;
    }
  }
  out.push(text.slice(start));
  return out;
}

/** Las primeras oraciones completas que caben en el presupuesto (siempre la
 *  primera, recortada en un límite de palabra si ella sola lo excede). Se omite
 *  «Equivalente aproximado: HEX…», que repite el color ya escrito en el título. */
function keyIdea(body: string): string {
  const parts = sentences(body.replace(/\s+/g, " ").trim()).filter((s) => !/^Equivalente aproximado/i.test(s));
  const picked: string[] = [];
  let len = 0;
  for (const s of parts) {
    if (picked.length > 0 && len + s.length + 1 > KEY_IDEA_BUDGET) break;
    picked.push(s);
    len += s.length + 1;
  }
  const text = picked.join(" ");
  if (text.length <= KEY_IDEA_BUDGET + 60) return text;
  const cut = text.slice(0, KEY_IDEA_BUDGET);
  return cut.slice(0, cut.lastIndexOf(" ") > 80 ? cut.lastIndexOf(" ") : KEY_IDEA_BUDGET).trimEnd() + "…";
}

/** Texto listo para pegar (en un chat, un prompt o un documento) con la línea
 *  gráfica vigente. `essential` deja una línea por indicación (título, color y
 *  su idea clave); `full` incluye el texto completo de cada una. */
export function buildBrandSummary(guidelines: GuidelineLike[], mode: "essential" | "full"): string {
  const bySection = new Map<string, GuidelineLike[]>();
  for (const g of guidelines) bySection.set(g.section, [...(bySection.get(g.section) ?? []), g]);

  const header =
    mode === "essential"
      ? "LÍNEA GRÁFICA UIFCE — resumen (Estrategias Tecnológicas, Universidad Nacional de Colombia)"
      : "LÍNEA GRÁFICA UIFCE — completa (Estrategias Tecnológicas, Universidad Nacional de Colombia)";

  const blocks = sortSections([...bySection.entries()]).map(([section, items]) => {
    const lines = items
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((g) => {
        // El HEX ya suele venir en el título («… · #84BD00»): no se repite.
        const hex = g.colorHex && !g.title.toLowerCase().includes(g.colorHex.toLowerCase()) ? ` · ${g.colorHex}` : "";
        if (mode === "essential") return `- ${g.title}${hex}: ${keyIdea(g.body)}`;
        return `- ${g.title}${hex}\n  ${g.body.trim().replace(/\n/g, "\n  ")}`;
      });
    return `${section.toUpperCase()}\n${lines.join("\n")}`;
  });

  return [header, ...blocks].join("\n\n");
}
