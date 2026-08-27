import { prisma } from "@/lib/prisma";
import { StudyProjects, type JuniorWithStudy } from "@/components/study-projects";
import { InfoHint } from "@/components/info-hint";
import { JUNIOR_ROLES } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProyectosDeEstudioPage() {
  const juniors = await prisma.user.findMany({
    where: { role: { in: [...JUNIOR_ROLES] } },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: {
      studyProjects: {
        orderBy: { order: "asc" },
        include: { checkpoints: { orderBy: { number: "asc" } } },
      },
    },
  });

  const data: JuniorWithStudy[] = juniors.map((j) => ({
    id: j.id,
    name: j.name,
    role: j.role,
    studyProjects: j.studyProjects,
  }));

  const juniorOptions = juniors
    .filter((j) => j.active)
    .map((j) => ({ id: j.id, name: j.name }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          Proyectos de estudio
          <InfoHint text="Cada monitor Junior expone dos proyectos de estudio en el semestre. Aquí se registra el cronograma de cada uno y sus 4 puntos de corte, con fecha y estado, para hacerles seguimiento. Los Junior se definen en la sección Equipo." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Dos proyectos de estudio por Junior, con cronograma y cuatro puntos de corte para seguimiento.
        </p>
      </div>
      <StudyProjects juniors={data} juniorOptions={juniorOptions} />
    </div>
  );
}
