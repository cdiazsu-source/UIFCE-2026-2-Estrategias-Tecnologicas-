import { cache } from "react";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

/** Persona a la que se le avisan las novedades de bitácora: `userId` y `name` son los de su fila en User
 *  y `key` el nombre bajo el que se guarda lo que ya vio en el navegador. */
export type NotifyIdentity = { userId: string; name: string; key: string };

/** Quién recibe las novedades en esta sesión:
 *  - un perfil Junior (propio o visto con «Ver como»): esa persona;
 *  - cualquier otra identidad nominal (director, coordinación): su fila por credentialKey;
 *  - el máster (usuario MASTER, sin identidad nominal): el máster activo del área ET (Cesar).
 *  null si no se puede identificar (o la BD no responde): entonces no hay avisos. */
export const getNotifyIdentity = cache(async (): Promise<NotifyIdentity | null> => {
  const session = await getSession();
  if (!session.authed) return null;
  try {
    const key = session.juniorKey ?? session.viewWho;
    if (key) {
      const user = await prisma.user.findFirst({ where: { credentialKey: key }, select: { id: true, name: true } });
      return user ? { userId: user.id, name: user.name, key } : null;
    }
    if (session.isMaster) {
      const master = await prisma.user.findFirst({
        where: { role: "MASTER", area: "ET", active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      });
      return master ? { userId: master.id, name: master.name, key: "master" } : null;
    }
  } catch {
    // Sin avisos si la BD no responde.
  }
  return null;
});

export type AssignedUpdate = { id: string; title: string; at: string; author: string | null };

/** Días hacia atrás que cuenta una nota como «novedad». */
const UPDATE_WINDOW_DAYS = 14;

/** Proyectos abiertos de la persona (responsable, con subtareas a su nombre o etiquetada en una nota) que
 *  tienen notas de bitácora de OTRAS personas en los últimos 14 días, con la más reciente de cada uno. El navegador
 *  decide cuáles ya vio (lib/seen-updates.ts). Una nota es «de otra persona» si su autor no es esta
 *  persona ni por id ni por nombre (las notas antiguas, y las del máster con credencial compartida,
 *  solo guardan el nombre). */
export const getAssignedUpdates = cache(async (userId: string, name: string): Promise<AssignedUpdate[]> => {
  const since = new Date(Date.now() - UPDATE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const fromOthers = {
    createdAt: { gte: since },
    OR: [{ authorId: null }, { authorId: { not: userId } }],
    author: { not: name },
  };
  try {
    const rows = await prisma.project.findMany({
      where: {
        status: { not: "COMPLETADO" },
        OR: [
          { assigneeId: userId },
          { checklistItems: { some: { assigneeId: userId } } },
          // También los proyectos donde otra persona la etiquetó en una nota.
          { notes: { some: { ...fromOthers, mentionIds: { has: userId } } } },
        ],
        notes: { some: fromOthers },
      },
      select: {
        id: true,
        title: true,
        notes: { where: fromOthers, orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true, author: true } },
      },
    });
    return rows
      .filter((r) => r.notes.length > 0)
      .map((r) => ({ id: r.id, title: r.title, at: r.notes[0].createdAt.toISOString(), author: r.notes[0].author || null }));
  } catch {
    return [];
  }
});
