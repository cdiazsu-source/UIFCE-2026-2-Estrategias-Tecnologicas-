import { prisma } from "@/lib/prisma";
import { STICKY_ID, isStickyColor, type StickyData } from "@/lib/sticky-note";

/** Post-it vigente. Con `forKey` (clave del perfil Junior) devuelve null si la nota no es para esa persona; sin `forKey` devuelve la
 *  nota completa, con sus destinatarios (editor del máster). `strict`: si la tabla de la nota falla, relanza el error (para saber si
 *  falta la migración); por defecto devuelve null. La tabla de destinatarios es más nueva: si falta, la nota va para todos. */
export async function loadStickyNote(forKey?: string | null, strict = false): Promise<StickyData | null> {
  try {
    const n = await prisma.stickyNote.findUnique({ where: { id: STICKY_ID } });
    if (!n || !n.active) return null;
    let to: string[] = [];
    try {
      to = (await prisma.stickyRecipient.findMany({ select: { profileKey: true } })).map((r) => r.profileKey);
    } catch {
      to = [];
    }
    if (forKey !== undefined && to.length > 0 && !(forKey && to.includes(forKey))) return null;
    const at = n.updatedAt.toISOString();
    return { body: n.body, color: isStickyColor(n.color) ? n.color : "AMARILLO", author: n.author, at, stamp: at, to };
  } catch (e) {
    if (strict) throw e;
    return null;
  }
}
