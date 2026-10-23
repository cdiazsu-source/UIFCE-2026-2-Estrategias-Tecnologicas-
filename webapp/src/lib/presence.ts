import { prisma } from "@/lib/prisma";

const STALE_MS = 5 * 60 * 1000; // no escribir más de una vez cada 5 min
const NEW_VISIT_MS = 30 * 60 * 1000; // una pausa de más de 30 min separa una visita de la siguiente

/** Registra la última visita de una credencial nominal (casa por
 *  User.credentialKey). No-op si `who` es null (credenciales compartidas).
 *  Si pasaron más de 30 min desde la actividad anterior, esa fecha se guarda antes en UserVisit.previousVisitAt («tu último
 *  ingreso fue…», ver lib/welcome.ts). Esa tabla es nueva y va en su propio try: si la migración aún no está aplicada, la última
 *  visita se sigue registrando igual. Después, una sola sentencia UPDATE … WHERE; casi siempre 0 filas. */
export async function touchLastSeen(who: string | null): Promise<void> {
  if (!who) return;
  const now = new Date();
  const visitCutoff = new Date(now.getTime() - NEW_VISIT_MS);
  try {
    await prisma.$executeRaw`INSERT INTO "UserVisit" ("userId", "previousVisitAt", "updatedAt") SELECT "id", "lastSeenAt", ${now}::timestamp FROM "User" WHERE "credentialKey" = ${who} AND "lastSeenAt" IS NOT NULL AND "lastSeenAt" < ${visitCutoff} ON CONFLICT ("userId") DO UPDATE SET "previousVisitAt" = EXCLUDED."previousVisitAt", "updatedAt" = EXCLUDED."updatedAt"`;
  } catch {
    // Sin la tabla (migración pendiente) no hay «visita anterior»; la presencia sigue.
  }
  const cutoff = new Date(now.getTime() - STALE_MS);
  try {
    await prisma.user.updateMany({
      where: {
        credentialKey: who,
        OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: cutoff } }],
      },
      data: { lastSeenAt: now },
    });
  } catch {
    // La presencia nunca debe romper el render.
  }
}
