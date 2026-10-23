/** Regreso a «Reunión coordinación» desde un proyecto: al tocar un proyecto de la presentación se guarda a dónde volver y un botón flotante
 *  (components/reunion-return.tsx) lo ofrece durante 30 segundos. Vive en sessionStorage, por pestaña. */

export const RETURN_KEY = "et:reunion-regreso";
export const RETURN_SECONDS = 30;

export type ReunionReturn = {
  /** Dirección de la presentación, con la página (y la reunión guardada, si se veía una). */
  href: string;
  /** Nombre de la página de la presentación a la que se vuelve. */
  label: string;
  /** Cuándo vence el botón (ms desde 1970). */
  until: number;
};

export function readReturn(): ReunionReturn | null {
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<ReunionReturn>;
    if (typeof o.href !== "string" || !o.href.startsWith("/reunion") || typeof o.until !== "number") return null;
    return { href: o.href, label: typeof o.label === "string" ? o.label : "", until: o.until };
  } catch {
    return null;
  }
}

export function clearReturn(): void {
  try {
    sessionStorage.removeItem(RETURN_KEY);
  } catch {
    // nada
  }
}
