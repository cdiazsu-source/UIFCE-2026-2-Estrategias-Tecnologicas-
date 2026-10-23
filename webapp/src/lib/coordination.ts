/** «Reunión coordinación» (solo máster): presentación para líderes de área y coordinación, en cinco páginas: una general y una por parte
 *  (1 lo que entregamos, 2 en curso y bloqueos, 3 en el próximo corte, 4 notas y comentarios). Cada reunión se puede guardar con su fecha
 *  (`CoordinationMeeting`) y consultar después tal como se presentó. Tipos y constantes compartidos entre servidor y navegador. */

/** Proyectos de «Lo que entregamos», en el orden en que se presentan (ids del tracker). */
export const DELIVERED_PROJECT_IDS = [
  "cursoslibres-piezas-lanzamiento-especial",
  "aa-cartelera-fisica",
  "redes-rastreo-contactos-empresas",
  "interarea-infografia-puntualidad",
  "video-tutorial-para-el-aplicativo-programacion-de-salones",
  "produccion-capsulas-tecnologia-pantallas",
];

export const BLOCKER_MAX = 200;
export const DESIGN_TITLE_MAX = 80;
export const DESIGN_NOTE_MAX = 1500;
export const DESIGN_IMAGES_MAX = 4;
export const MEETING_LABEL_MAX = 80;

export type CoordProject = {
  id: string;
  title: string;
  category: string;
  status: string;
  done: number;
  total: number;
  assignee: string | null;
};

export type CoordBlocker = { id: string; text: string };

/** Las cinco páginas, en orden. */
export const SLIDE_KEYS = ["general", "entregamos", "bloqueos", "corte", "notas"] as const;
export type SlideKey = (typeof SLIDE_KEYS)[number];

export const SLIDE_LABEL: Record<SlideKey, string> = {
  general: "General",
  entregamos: "Lo que entregamos",
  bloqueos: "En curso y bloqueos",
  corte: "En el próximo corte",
  notas: "Notas y comentarios",
};
export const isSlideKey = (v: string): v is SlideKey => (SLIDE_KEYS as readonly string[]).includes(v);

/** Cómo se acomoda una imagen en la página. */
export const IMAGE_LAYOUTS = { izquierda: "Izquierda", derecha: "Derecha", ancho: "Ancho completo" } as const;
export type ImageLayout = keyof typeof IMAGE_LAYOUTS;
export const isImageLayout = (v: string): v is ImageLayout => Object.prototype.hasOwnProperty.call(IMAGE_LAYOUTS, v);

/** Una imagen o GIF tomado de la captura de una plantilla (se sirve por /api/plantillas-imagen/<id>). */
export type DesignImage = { templateId: string; layout: ImageLayout; caption: string };

/** Lo que el máster diseña en una página: título propio, una nota e imágenes. */
export type PageDesign = { title: string; note: string; images: DesignImage[] };
export const EMPTY_DESIGN: PageDesign = { title: "", note: "", images: [] };

export type CoordData = {
  delivered: CoordProject[];
  upcoming: CoordProject[];
  /** null = la tabla de bloqueos no existe todavía (falta la migración). */
  blockers: CoordBlocker[] | null;
  design: Record<SlideKey, PageDesign>;
};

export type MeetingSummary = { id: string; date: string; label: string };

export function emptyDesigns(): Record<SlideKey, PageDesign> {
  return { general: { ...EMPTY_DESIGN }, entregamos: { ...EMPTY_DESIGN }, bloqueos: { ...EMPTY_DESIGN }, corte: { ...EMPTY_DESIGN }, notas: { ...EMPTY_DESIGN } };
}

/** Lee con cuidado lo guardado como JSON (imágenes de una página o el contenido de una reunión). */
export function parseImages(raw: unknown): DesignImage[] {
  if (!Array.isArray(raw)) return [];
  const out: DesignImage[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (typeof o.templateId !== "string" || !o.templateId) continue;
    out.push({
      templateId: o.templateId,
      layout: typeof o.layout === "string" && isImageLayout(o.layout) ? o.layout : "ancho",
      caption: typeof o.caption === "string" ? o.caption.slice(0, 120) : "",
    });
    if (out.length >= DESIGN_IMAGES_MAX) break;
  }
  return out;
}

/** El contenido de una reunión guardada, validado: lo que se guardó antes sigue abriéndose aunque el formato cambie. */
export function parseSnapshot(raw: unknown): CoordData | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const projects = (v: unknown): CoordProject[] => (Array.isArray(v) ? (v as CoordProject[]).filter((p) => p && typeof p.id === "string" && typeof p.title === "string") : []);
  const designs = emptyDesigns();
  const d = (o.design ?? {}) as Record<string, Partial<PageDesign>>;
  for (const k of SLIDE_KEYS) {
    const p = d[k];
    if (p) designs[k] = { title: typeof p.title === "string" ? p.title : "", note: typeof p.note === "string" ? p.note : "", images: parseImages(p.images) };
  }
  const blockers = Array.isArray(o.blockers) ? (o.blockers as CoordBlocker[]).filter((b) => b && typeof b.text === "string").map((b) => ({ id: String(b.id ?? b.text), text: b.text })) : [];
  return { delivered: projects(o.delivered), upcoming: projects(o.upcoming), blockers, design: designs };
}
