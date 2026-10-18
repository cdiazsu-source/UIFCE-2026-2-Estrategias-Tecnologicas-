/** Perfiles que se pueden «ver como» desde el menú lateral o desde Equipo. SIN contraseñas ni
 *  secretos: este archivo lo importan componentes de cliente (el menú, la tabla de Equipo),
 *  por eso vive aparte de `auth.ts`. Cada `key` debe coincidir con `User.credentialKey` de la
 *  persona y con el `who` de su credencial en `NAMED_CREDENTIALS` (src/lib/auth.ts). */

export type ViewLevel = "full" | "junior";

/** Claves de identidad de los dos perfiles Junior; deben coincidir con
 *  User.credentialKey de cada monitor (lo fija scripts/apply-junior-profiles.mjs). */
export const JUNIOR_ARTES_WHO = "junior-artes";
export const JUNIOR_ET_WHO = "junior-et";
/** Rótulo de cada perfil Junior (para los avisos y el saludo). */
export const JUNIOR_PROFILES: Record<string, string> = {
  [JUNIOR_ARTES_WHO]: "Junior Artes",
  [JUNIOR_ET_WHO]: "Junior ET",
};
export function isJuniorWho(who: string | null | undefined): who is string {
  return !!who && Object.prototype.hasOwnProperty.call(JUNIOR_PROFILES, who);
}

/** Clave de identidad del director; session.ts la usa para excluir al director de «Ver como». */
export const DIRECTOR_WHO = "henry-sarmiento";
export const LINA_WHO = "lina-sanabria";
export const SANTI_WHO = "santiago-parra";

export type ViewProfile = {
  key: string;
  label: string;
  group: "Junior" | "Dirección" | "Coordinación";
  /** Nivel de acceso con el que se ve la app: los Junior, de monitor; el resto, completo. */
  level: ViewLevel;
};

export const VIEW_PROFILES: ViewProfile[] = [
  { key: JUNIOR_ARTES_WHO, label: "Junior Artes", group: "Junior", level: "junior" },
  { key: JUNIOR_ET_WHO, label: "Junior ET", group: "Junior", level: "junior" },
  { key: DIRECTOR_WHO, label: "Dirección (Henry)", group: "Dirección", level: "full" },
  { key: LINA_WHO, label: "Coordinación (Lina)", group: "Coordinación", level: "full" },
  { key: SANTI_WHO, label: "Coordinación (Santi)", group: "Coordinación", level: "full" },
];

export function viewProfile(key: string | null | undefined): ViewProfile | null {
  return VIEW_PROFILES.find((p) => p.key === key) ?? null;
}
