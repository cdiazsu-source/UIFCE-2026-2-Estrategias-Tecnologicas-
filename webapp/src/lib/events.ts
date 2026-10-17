/** Nombre del evento de ventana que conecta el checklist con la bitácora:
 *  al pulsar "actualizar en bitácora" en una subtarea, la bitácora lo escucha,
 *  preselecciona esa subtarea en el formulario de nota y hace foco.
 *  El `detail` del CustomEvent es el id del ChecklistItem. */
export const BITACORA_TARGET_EVENT = "bitacora:target";

/** Evento que lleva a una nota concreta de la bitácora: el checklist lo dispara
 *  desde la tarjeta de entradas de una subtarea; la bitácora se abre (si estaba
 *  contraída), hace scroll a esa nota y la resalta un momento. `detail` = id de
 *  la ProjectNote. */
export const BITACORA_FOCUS_NOTE_EVENT = "bitacora:focus-note";
