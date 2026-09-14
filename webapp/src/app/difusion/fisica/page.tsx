import { prisma } from "@/lib/prisma";
import { InfoHint } from "@/components/info-hint";
import { DifusionSpacesPanel, type DifusionSpaceData } from "@/components/difusion-spaces-panel";

export const dynamic = "force-dynamic";

export default async function DifusionFisicaPage() {
  const rows = await prisma.difusionSpace.findMany({
    orderBy: { order: "asc" },
    include: { images: { orderBy: { order: "asc" } } },
  });

  const spaces: DifusionSpaceData[] = rows.map((s) => ({
    id: s.id,
    title: s.title,
    status: s.status,
    description: s.description,
    images: s.images.map((img) => ({ id: img.id, dataUrl: img.dataUrl })),
  }));

  const totalImages = spaces.reduce((sum, s) => sum + s.images.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Difusión física
          <InfoHint text="Catálogo de espacios físicos a intervenir con piezas de difusión: fachadas, stands, oficinas, pasillos… Cómo se usa: con perfil completo, «Nuevo espacio» crea una tarjeta; el desplegable de estado marca si está por intervenir, en intervención o ya intervenido; el lápiz edita título y descripción; en la galería, «Agregar foto» elige un archivo, lo pega (Ctrl+V) o se arrastra — se reduce a 640 px y queda como vista previa. Ejemplo: «Fachada Principal · En intervención · 3 fotos»." />
        </h1>
        <p className="text-sm text-muted-foreground">
          {spaces.length} {spaces.length === 1 ? "espacio" : "espacios"} · {totalImages} {totalImages === 1 ? "foto" : "fotos"} en total.
        </p>
      </div>
      <DifusionSpacesPanel spaces={spaces} />
    </div>
  );
}
