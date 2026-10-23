/** Post-it virtual del máster para los monitores Junior (ver `components/sticky-note.tsx`). Vive aparte de la acción porque un archivo
 *  "use server" solo exporta funciones async. */

export const STICKY_ID = "main";
export const STICKY_MAX = 500;

export const STICKY_COLORS = {
  AMARILLO: { label: "Amarillo", bg: "#FFF3A3", fg: "#4A3F00", edge: "#E8D84A" },
  AZUL: { label: "Azul", bg: "#CFE6FF", fg: "#0B2B52", edge: "#8DB9EA" },
  VERDE: { label: "Verde", bg: "#D3F2C9", fg: "#1D4410", edge: "#97D184" },
  ROSA: { label: "Rosa", bg: "#FFD9E6", fg: "#5C1330", edge: "#EDA0BC" },
} as const;
export type StickyColor = keyof typeof STICKY_COLORS;
export const isStickyColor = (v: string): v is StickyColor => Object.prototype.hasOwnProperty.call(STICKY_COLORS, v);

/** La nota vigente, lista para el navegador. `stamp` cambia con cada edición (sirve para no repetirla a quien ya la vio). */
export type StickyData = {
  body: string;
  color: StickyColor;
  author: string;
  at: string;
  stamp: string;
};
