import { prisma } from "@/lib/prisma";
import type { PieceData } from "@/lib/template-pieces";

/** Plantillas enlazadas a un proyecto (bloque «Plantillas» de su página). Las imágenes se piden aparte por /api/plantillas-imagen, así que aquí
 *  solo viajan direcciones, no imágenes. */

export type LinkedTemplate = {
  id: string;
  name: string;
  category: string;
  /** Enlace de la plantilla (Canva, Drive…) y su tipo elegido ("" = se deduce del dominio). */
  url: string | null;
  urlLabel: string;
  /** Captura y piezas, en ese orden, listas para el carrusel. */
  images: PieceData[];
};

export type TemplateOption = { id: string; name: string; category: string };

/** null = las tablas todavía no existen (migración pendiente): el bloque no se muestra. */
export async function loadProjectTemplates(projectId: string, withOptions: boolean): Promise<{ linked: LinkedTemplate[]; options: TemplateOption[] } | null> {
  try {
    const links = await prisma.projectTemplateLink.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
      select: { template: { select: { id: true, name: true, category: true, url: true } } },
    });
    const ids = links.map((l) => l.template.id);

    const [withShot, pieces, labels] = ids.length
      ? await Promise.all([
          prisma.template.findMany({ where: { id: { in: ids }, NOT: [{ screenshot: null }, { screenshot: "" }] }, select: { id: true } }),
          prisma.templatePiece.findMany({ where: { templateId: { in: ids } }, orderBy: [{ templateId: "asc" }, { order: "asc" }], select: { id: true, templateId: true, label: true, url: true } }).catch(() => []),
          prisma.templateLinkLabel.findMany({ where: { templateId: { in: ids } } }).catch(() => []),
        ])
      : [[], [], []];
    const shot = new Set(withShot.map((t) => t.id));
    const labelBy = new Map(labels.map((l) => [l.templateId, l.label]));

    const linked: LinkedTemplate[] = links.map(({ template: t }) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      url: t.url,
      urlLabel: labelBy.get(t.id) ?? "",
      images: [
        ...(shot.has(t.id) ? [{ image: `/api/plantillas-imagen/${t.id}`, label: "Captura", url: "" }] : []),
        ...pieces.filter((p) => p.templateId === t.id).map((p) => ({ image: `/api/plantillas-imagen/${t.id}?pieza=${p.id}`, label: p.label, url: p.url })),
      ],
    }));

    const options = withOptions ? await prisma.template.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }], select: { id: true, name: true, category: true } }) : [];
    return { linked, options };
  } catch {
    return null;
  }
}

/** Reemplaza las plantillas enlazadas a un proyecto (en este orden; solo las que existen, hasta 10). */
export async function replaceProjectTemplates(projectId: string, templateIds: string[]): Promise<void> {
  const wanted = Array.from(new Set(templateIds.filter((t) => typeof t === "string"))).slice(0, 10);
  const found = await prisma.template.findMany({ where: { id: { in: wanted } }, select: { id: true } });
  const ok = new Set(found.map((t) => t.id));
  const clean = wanted.filter((t) => ok.has(t));
  await prisma.$transaction([
    prisma.projectTemplateLink.deleteMany({ where: { projectId } }),
    prisma.projectTemplateLink.createMany({ data: clean.map((templateId, order) => ({ projectId, templateId, order })) }),
  ]);
}
