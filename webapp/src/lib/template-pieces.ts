/** Piezas de una plantilla: cada una es una imagen pequeña con su enlace (Canva, Drive…). Sirven para guardar, por ejemplo, todas las piezas
 *  que se hicieron para un evento (el lanzamiento especial de Cursos Libres fueron varias). Compartido entre servidor y navegador. */

export const PIECES_MAX = 30;
/** Tope de cada imagen (data URL ya reducida a ~360 px en el navegador); evita filas gigantes. */
export const PIECE_IMAGE_MAX = 300_000;
export const PIECE_LABEL_MAX = 100;
export const PIECE_URL_MAX = 500;
/** Lado mayor, en píxeles, al que se reduce cada imagen de pieza. */
export const PIECE_IMAGE_SIZE = 360;

export type PieceData = {
  /** Imagen como data URL (JPEG reducido). */
  image: string;
  label: string;
  /** Enlace a la pieza (Canva, Drive…), o "" si no tiene. */
  url: string;
};

/** Deja solo enlaces http(s); si falta el esquema y parece un dominio, se lo agrega. Lo demás se descarta. */
export function cleanPieceUrl(raw: string): string {
  const v = raw.trim().slice(0, PIECE_URL_MAX);
  if (!v) return "";
  if (/^https?:\/\/\S+$/i.test(v)) return v;
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v)) return `https://${v}`;
  return "";
}

/** Lee y valida las piezas que llegan del formulario (JSON). Lo que no sirve se descarta en silencio. */
export function parsePieces(raw: string): PieceData[] {
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  const out: PieceData[] = [];
  for (const r of arr) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const image = typeof o.image === "string" ? o.image : "";
    if (!/^data:image\/(jpeg|png|webp|gif);base64,/.test(image) || image.length > PIECE_IMAGE_MAX) continue;
    out.push({ image, label: typeof o.label === "string" ? o.label.trim().slice(0, PIECE_LABEL_MAX) : "", url: cleanPieceUrl(typeof o.url === "string" ? o.url : "") });
    if (out.length >= PIECES_MAX) break;
  }
  return out;
}
