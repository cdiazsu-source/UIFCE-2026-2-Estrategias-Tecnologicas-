import { prisma } from "@/lib/prisma";
import { InfoHint } from "@/components/info-hint";
import { TemplatesPanel, type TemplateData } from "@/components/templates-panel";

export const dynamic = "force-dynamic";

export default async function PlantillasPage() {
  const rows = await prisma.template.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] });

  const templates: TemplateData[] = rows.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    description: t.description,
    url: t.url,
    format: t.format,
    notes: t.notes,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Plantillas
          <InfoHint text="Las plantillas reutilizables del área, agrupadas por categoría: material de redes sociales, televisores de la unidad, difusión por correo, disponibilidad de salas, Cursos Libres, eventos, apoyos académicos y más. Cada plantilla lleva su formato y un enlace al archivo (Drive, Canva, Figma…)." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Punto único para encontrar y mantener las plantillas de trabajo del área.
        </p>
      </div>
      <TemplatesPanel templates={templates} />
    </div>
  );
}
