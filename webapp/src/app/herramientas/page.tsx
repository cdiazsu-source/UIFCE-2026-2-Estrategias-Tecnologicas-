import { prisma } from "@/lib/prisma";
import { ToolsTable } from "@/components/tools-table";
import { InfoHint } from "@/components/info-hint";

export const dynamic = "force-dynamic";

export default async function HerramientasPage() {
  const tools = await prisma.tool.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Herramientas y licencias
          <InfoHint text="Qué software de diseño/edición tiene el área, si la licencia está vigente, y en qué equipo o con quién está — para no depender de la memoria de una sola persona ni de licencias personales." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Estado de las licencias de diseño y edición del área, y quién tiene acceso a cada una.
        </p>
      </div>
      <ToolsTable tools={tools} />
    </div>
  );
}
