import { prisma } from "@/lib/prisma";
import { BrandGuidelines } from "@/components/brand-guidelines";
import { InfoHint } from "@/components/info-hint";

export const dynamic = "force-dynamic";

export default async function LineaGraficaPage() {
  const guidelines = await prisma.brandGuideline.findMany({
    orderBy: [{ section: "asc" }, { order: "asc" }],
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Línea gráfica
          <InfoHint text="Las indicaciones de identidad visual que ET debe respetar en las piezas para la Facultad y la Universidad: colores, franjas institucionales, formatos, y lineamientos de Imagen Institucional / Unimedios. Es la referencia única del equipo de diseño." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Colores, franjas, formatos y lineamientos para las piezas gráficas de la UIFCE. Editable en línea.
        </p>
      </div>
      <BrandGuidelines guidelines={guidelines} />
    </div>
  );
}
