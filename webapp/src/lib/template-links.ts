/** Tipo del enlace de una plantilla («Canva», «Drive», «Figma»…): el que elige quien la guarda o, si no eligió, el que se deduce del dominio.
 *  Compartido entre servidor y navegador. */

export const LINK_LABEL_MAX = 40;

/** Tipos sugeridos como botones; también se puede escribir cualquier nombre. */
export const LINK_LABEL_PRESETS = ["Canva", "Drive", "Figma", "YouTube"] as const;

const DOMAIN_LABELS: [RegExp, string][] = [
  [/(^|\.)canva\.com$|(^|\.)canva\.link$/i, "Canva"],
  [/(^|\.)drive\.google\.com$/i, "Drive"],
  [/(^|\.)docs\.google\.com$/i, "Google Docs"],
  [/(^|\.)figma\.com$/i, "Figma"],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/i, "YouTube"],
  [/(^|\.)dropbox\.com$/i, "Dropbox"],
  [/(^|\.)notion\.(so|site)$/i, "Notion"],
];

/** Tipo deducido del dominio del enlace, o "" si no se reconoce. */
export function detectLinkLabel(url: string | null | undefined): string {
  if (!url) return "";
  try {
    const host = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname;
    return DOMAIN_LABELS.find(([re]) => re.test(host))?.[1] ?? "";
  } catch {
    return "";
  }
}

/** Texto del botón que abre el enlace: «Abrir en Canva», o «Abrir plantilla» si no hay tipo. */
export function openLinkText(custom: string | null | undefined, url: string | null | undefined, fallback = "Abrir plantilla"): string {
  const label = (custom ?? "").trim() || detectLinkLabel(url);
  return label ? `Abrir en ${label}` : fallback;
}
