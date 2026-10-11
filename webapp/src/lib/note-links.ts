/** Enlaces de apoyo de una nota de bitácora: guardados aparte del texto para que
 *  se muestren como vínculos con nombre (y no como una URL pegada). */
export type NoteLink = { label: string; url: string };

export const NOTE_LINKS_MAX = 10;
const LABEL_MAX = 80;

/** Acepta «drive.google.com/…» sin esquema (le antepone https://). Solo http(s)
 *  con un dominio válido; cualquier otra cosa (javascript:, data:, texto) → null. */
export function normalizeUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".") && u.hostname !== "localhost") return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Lee el JSON guardado en la BD (o el que llega al cliente) con tolerancia. */
export function parseNoteLinks(value: unknown): NoteLink[] {
  if (!Array.isArray(value)) return [];
  const out: NoteLink[] = [];
  for (const v of value) {
    if (!v || typeof v !== "object") continue;
    const { label, url } = v as { label?: unknown; url?: unknown };
    if (typeof url !== "string") continue;
    out.push({ label: typeof label === "string" ? label : "", url });
  }
  return out;
}

/** Arma la lista desde los campos paralelos `linkLabel` / `linkUrl` del formulario.
 *  Descarta filas sin URL o con URL inválida; recorta nombres y limita la cantidad. */
export function linksFromForm(labels: FormDataEntryValue[], urls: FormDataEntryValue[]): NoteLink[] {
  const out: NoteLink[] = [];
  urls.forEach((rawUrl, i) => {
    const url = normalizeUrl(String(rawUrl));
    if (!url) return;
    out.push({ label: String(labels[i] ?? "").trim().slice(0, LABEL_MAX), url });
  });
  return out.slice(0, NOTE_LINKS_MAX);
}

/** Texto visible de un enlace: su nombre, o el dominio y la ruta si no tiene. */
export function linkDisplay(link: NoteLink): string {
  if (link.label) return link.label;
  try {
    const u = new URL(link.url);
    const text = (u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname)).replace(/\/$/, "");
    return text.length > 48 ? `${text.slice(0, 47)}…` : text;
  } catch {
    return link.url;
  }
}
