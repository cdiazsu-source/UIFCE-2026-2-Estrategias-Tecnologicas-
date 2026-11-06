/** Tipos de «Actividad de los Junior» (compartidos entre el servidor y el tablero; sin dependencias de servidor). */

export type MovementType = "CAMBIO" | "NOTA" | "COMENTARIO" | "SUBTAREA" | "ENTRADA" | "PROYECTO" | "CLIC";

/** Los que cuentan como modificación; el resto es navegación. */
export const CHANGE_TYPES: MovementType[] = ["CAMBIO", "NOTA", "COMENTARIO", "SUBTAREA"];

export type Movement = {
  id: string;
  at: string;
  /** Id del User (para filtrar por persona). */
  userId: string;
  type: MovementType;
  /** Qué hizo, en una línea. */
  text: string;
  /** Detalle opcional (extracto de la nota o del comentario). */
  detail: string | null;
  /** Dónde: proyecto o pantalla. */
  where: string | null;
  href: string | null;
};

export type MovementPerson = { id: string; name: string; color: string | null };
export type Movements = { people: MovementPerson[]; items: Movement[]; trackingReady: boolean };
