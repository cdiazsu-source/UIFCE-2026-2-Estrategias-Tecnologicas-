import { redirect } from "next/navigation";
import { Code2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { canUseDeveloper } from "@/lib/session";
import { APP_TIME_ZONE, PROJECT_STATUS_LABEL } from "@/lib/utils";
import { requesterLabel } from "@/lib/requester";
import { parseNoteLinks } from "@/lib/note-links";
import type { DeveloperSnapshot } from "@/lib/developer-prompt";
import type { DevProjectOption } from "@/lib/developer-modules";
import { InfoHint } from "@/components/info-hint";
import { DeveloperPromptPanel } from "@/components/developer-prompt-panel";
import { VersionHistory } from "@/components/version-history";

export const dynamic = "force-dynamic";

/** Datos en vivo que acompañan al prompt. Si la BD no responde, el prompt sale igual. */
async function loadSnapshot(): Promise<DeveloperSnapshot> {
  const generatedAt = new Date().toLocaleString("es-CO", {
    timeZone: APP_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  });
  try {
    const [projects, checklistItems, users, studyProjects, semester, migrations] = await Promise.all([
      prisma.project.count(),
      prisma.checklistItem.count(),
      prisma.user.count({ where: { active: true } }),
      prisma.studyProject.count(),
      prisma.semester.findFirst({ where: { isCurrent: true }, select: { label: true } }),
      prisma
        .$queryRaw<{ migration_name: string }[]>`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 1`
        .catch(() => [] as { migration_name: string }[]),
    ]);
    return {
      generatedAt,
      lastMigration: migrations[0]?.migration_name ?? null,
      semester: semester?.label ?? null,
      counts: { projects, checklistItems, users, studyProjects },
    };
  } catch {
    return { generatedAt, lastMigration: null, semester: null, counts: null };
  }
}

/** Proyectos que se pueden elegir como foco del prompt (con lo justo para contextualizar). */
async function loadProjectOptions(): Promise<DevProjectOption[]> {
  try {
    const rows = await prisma.project.findMany({
      orderBy: { sourceOrder: "asc" },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        description: true,
        expectedOutcome: true,
        requesterArea: true,
        links: true,
        isManual: true,
        assignee: { select: { name: true } },
        checklistItems: { orderBy: { order: "asc" }, select: { text: true, done: true } },
      },
    });
    return rows.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      statusLabel: PROJECT_STATUS_LABEL[p.status] ?? p.status,
      assignee: p.assignee?.name ?? null,
      requesterArea: requesterLabel(p.requesterArea) ?? p.requesterArea,
      description: p.description,
      expectedOutcome: p.expectedOutcome,
      links: parseNoteLinks(p.links),
      checklist: p.checklistItems.slice(0, 40),
      checklistTotal: p.checklistItems.length,
      isManual: p.isManual,
    }));
  } catch {
    return [];
  }
}

export default async function DesarrolladorPage() {
  // Solo el máster (usuario MASTER) y con la Vista Junior apagada; el menú ya lo
  // oculta, pero la validación de verdad es esta.
  if (!(await canUseDeveloper())) redirect("/");

  const [snapshot, projects] = await Promise.all([loadSnapshot(), loadProjectOptions()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Code2 className="h-5 w-5" />
          Desarrollador
          <InfoHint text="Genera un prompt autosuficiente para Claude Code (u otra IA con acceso al repositorio): trae la estructura completa de «ET en Marcha» (stack, carpetas, rutas, modelo de datos, patrones de código, permisos y reglas duras) y, al final, tu modificación. Cómo se usa: elige en «¿Dónde se aplica?» el módulo, el apartado o el proyecto que vas a cambiar (así la IA recibe sus archivos, modelos, permisos y apartados en detalle) y el tipo de estructuración; describe el cambio con tus palabras, copia el prompt, ábrelo en Claude Code dentro del repositorio y pégalo; la IA despliega la idea, la ejecuta, verifica y te deja el resumen. El prompt nunca incluye contraseñas. Ejemplo: elige «Horas del equipo» + «Agregar apartado» y escribe «Agregar un resumen mensual por persona con descarga»." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Contexto estructural del proyecto + tu modificación, listo para pegar en Claude Code y ejecutar sin pensar.
        </p>
      </div>

      <DeveloperPromptPanel snapshot={snapshot} projects={projects} />

      <VersionHistory />
    </div>
  );
}
