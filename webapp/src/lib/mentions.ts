import { prisma } from "@/lib/prisma";

/** Normaliza la lista de personas etiquetadas: quita vacíos y repetidos, y deja
 *  solo los ids que corresponden a un usuario activo (máx. 12). */
export async function resolveMentions(raw: (string | FormDataEntryValue)[]): Promise<string[]> {
  const ids = Array.from(new Set(raw.map((s) => String(s).trim()).filter(Boolean))).slice(0, 12);
  if (ids.length === 0) return [];
  const found = await prisma.user.findMany({
    where: { id: { in: ids }, active: true },
    select: { id: true },
  });
  const ok = new Set(found.map((u) => u.id));
  return ids.filter((id) => ok.has(id));
}
