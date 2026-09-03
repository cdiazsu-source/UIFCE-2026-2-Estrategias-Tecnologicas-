/** Nombre del evento de ventana que conecta el checklist con la bitácora:
 *  al pulsar "actualizar en bitácora" en una subtarea, la bitácora lo escucha,
 *  preselecciona esa subtarea en el formulario de nota y hace foco.
 *  El `detail` del CustomEvent es el id del ChecklistItem. */
export const BITACORA_TARGET_EVENT = "bitacora:target";
