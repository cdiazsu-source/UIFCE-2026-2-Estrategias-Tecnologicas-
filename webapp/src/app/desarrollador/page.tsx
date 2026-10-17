import { redirect } from "next/navigation";
import { Code2 } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { canUseDeveloper } from "@/lib/session";
import { APP_TIME_ZONE } from "@/lib/utils";
import type { DeveloperSnapshot } from "@/lib/developer-prompt";
import { InfoHint } from "@/components/info-hint";
import { DeveloperPromptPanel } from "@/components/developer-prompt-panel";

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

export default async function DesarrolladorPage() {
  // Solo el máster (usuario MASTER) y con la Vista Junior apagada; el menú ya lo
  // oculta, pero la validación de verdad es esta.
  if (!(await canUseDeveloper())) redirect("/");

  const snapshot = await loadSnapshot();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Code2 className="h-5 w-5" />
          Desarrollador
          <InfoHint text="Genera un prompt autosuficiente para Claude Code (u otra IA con acceso al repositorio): trae la estructura completa de «ET en Marcha» (stack, carpetas, rutas, modelo de datos, patrones de código, permisos y reglas duras) y, al final, tu modificación. Cómo se usa: describe el cambio con tus palabras, copia el prompt, ábrelo en Claude Code dentro del repositorio y pégalo; la IA despliega la idea, la ejecuta, verifica y te deja el resumen. El prompt nunca incluye contraseñas. Ejemplo: «Agregar una pantalla de inventario de equipos con responsable y estado, visible solo para el perfil completo»." />
        </h1>
        <p className="text-sm text-muted-foreground">
          Contexto estructural del proyecto + tu modificación, listo para pegar en Claude Code y ejecutar sin pensar.
        </p>
      </div>

      <DeveloperPromptPanel snapshot={snapshot} />
    </div>
  );
}
