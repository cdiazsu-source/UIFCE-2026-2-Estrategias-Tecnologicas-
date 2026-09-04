import { prisma } from "@/lib/prisma";

const STALE_MS = 5 * 60 * 1000; // no escribir más de una vez cada 5 min

/** Registra la última visita de una credencial nominal (casa por
 *  User.credentialKey). No-op si `who` es null (credenciales compartidas).
 *  Una sola sentencia UPDATE … WHERE; casi siempre 0 filas. */
export async function touchLastSeen(who: string | null): Promise<void> {
  if (!who) return;
  const cutoff = new Date(Date.now() - STALE_MS);
  try {
    await prisma.user.updateMany({
      where: {
        credentialKey: who,
        OR: [{ lastSeenAt: null }, { lastSeenAt: { lt: cutoff } }],
      },
      data: { lastSeenAt: new Date() },
    });
  } catch {
    // La presencia nunca debe romper el render.
  }
}
