import { prisma } from "@/lib/prisma";
import type { PieceData } from "@/lib/template-pieces";
import { InfoHint } from "@/components/info-hint";
import { TemplatesPanel, type TemplateData } from "@/components/templates-panel";

export const dynamic = "force-dynamic";

export default async function PlantillasPage() {
  const rows = await prisma.template.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] });

  // Piezas: tabla nueva; sin la migración, las plantillas salen sin piezas.
  const piecesBy = new Map<string, PieceData[]>();
  try {
    const pieceRows = await prisma.templatePiece.findMany({ orderBy: [{ templateId: "asc" }, { order: "asc" }] });
    for (const p of pieceRows) {
      const list = piecesBy.get(p.templateId) ?? [];
      list.push({ image: p.image, label: p.label, url: p.url });
      piecesBy.set(p.templateId, list);
    }
  } catch {
    piecesBy.clear();
  }

  // Tipo del enlace (Canva, Drive…): tabla nueva; sin la migración se deduce del dominio.
  const labelBy = new Map<string, string>();
  try {
    for (const l of await prisma.templateLinkLabel.findMany()) labelBy.set(l.templateId, l.label);
  } catch {
    labelBy.clear();
  }

  const templates: TemplateData[] = rows.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    description: t.description,
    url: t.url,
    format: t.format,
    notes: t.notes,
    promptText: t.promptText,
    screenshot: t.screenshot,
    pieces: piecesBy.get(t.id) ?? [],
    urlLabel: labelBy.get(t.id) ?? "",
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Plantillas
          <InfoHint text="Las plantillas reutilizables del área, agrupadas por categoría (redes sociales, televisores, difusión por correo, disponibilidad de salas, Cursos Libres, eventos, apoyos académicos…). Cómo se usa: con perfil completo, «Nueva plantilla» o el lápiz de una tarjeta; la categoría es texto libre con sugerencias y el enlace apunta al archivo real. Ejemplo: «Reel / video corto para redes · Vertical 1080×1920 · enlace a Drive»." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Punto único para encontrar y mantener las plantillas de trabajo del área.
        </p>
      </div>
      <TemplatesPanel templates={templates} />
    </div>
  );
}
