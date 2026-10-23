/** «Reunión coordinación» (solo máster): lámina para presentar a los líderes de área y a coordinación. Tres bloques:
 *  1) lo que entregamos (lista fija de proyectos, con su estado real), 2) en curso y bloqueos (los bloqueos los edita el máster),
 *  3) próximos 15 días (proyectos en Atención Inmediata, abiertos, que no están en el bloque 1). */

/** Proyectos del bloque «Lo que entregamos», en el orden en que se presentan (ids del tracker). */
export const DELIVERED_PROJECT_IDS = [
  "cursoslibres-piezas-lanzamiento-especial",
  "aa-cartelera-fisica",
  "redes-rastreo-contactos-empresas",
  "interarea-infografia-puntualidad",
  "video-tutorial-para-el-aplicativo-programacion-de-salones",
  "produccion-capsulas-tecnologia-pantallas",
];

export const BLOCKER_MAX = 200;

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
