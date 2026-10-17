import { ET_AREA_CONTEXT } from "@/lib/project-seed-prompt";

/** Todo lo que se cuenta de un proyecto a una IA (serializable, ya formateado). */
export type ProjectContext = {
  title: string;
  category: string;
  statusLabel: string;
  priorityLabel: string | null;
  assignee: string | null;
  requester: string | null;
  tags: string[];
  description: string;
  expectedOutcome: string;
  rationale: string;
  /** Horario y lugar ya formateados, si el proyecto es un evento. */
  schedule: string | null;
  mainProjectTitle: string | null;
  driveFolderUrl: string | null;
  /** Etiqueta del semestre del proyecto, sus objetivos y los frentes de difusión de ET. */
  semesterLabel: string | null;
  semesterObjectives: string[];
  etStrategies: string[];
  /** Descripción del área (la franja «El área» del panel principal). */
  areaDescription: string | null;
  activities: { title: string; statusLabel: string; schedule: string | null }[];
  checklist: { text: string; done: boolean; assignee: string | null; due: string | null }[];
  /** Notas de bitácora recientes (la más nueva primero), con el cuerpo ya recortado. */
  notes: {
    author: string;
    date: string;
    body: string;
    /** Texto de la subtarea a la que se refiere la nota, si la hay. */
    item: string | null;
    links: { label: string; url: string }[];
  }[];
  /** Total de notas del proyecto (puede ser mayor que las incluidas). */
  notesTotal: number;
};

/** Prompt de contexto: se pega en cualquier IA para ponerla al día de la Unidad y de
 *  un proyecto concreto. Si el usuario escribe «lo que necesito», la IA arranca por ahí. */
export function buildProjectContextPrompt(ctx: ProjectContext, need: string): string {
  const dash = (v: string | null | undefined) => (v && v.trim() ? v.trim() : "—");
  const doneCount = ctx.checklist.filter((i) => i.done).length;

  const list = (items: string[]) => (items.length ? items.map((t, i) => `${i + 1}. ${t}`).join("\n") : "—");

  const activitiesBlock = ctx.activities.length
    ? ctx.activities
        .map((a) => `- ${a.title} (${a.statusLabel}${a.schedule ? ` · ${a.schedule}` : ""})`)
        .join("\n")
    : "Ninguna.";

  const checklistBlock = ctx.checklist.length
    ? ctx.checklist
        .map((i, n) => {
          const extra = [i.assignee ? `responsable: ${i.assignee}` : "", i.due ? `vence ${i.due}` : ""]
            .filter(Boolean)
            .join(", ");
          return `${n + 1}. [${i.done ? "x" : " "}] ${i.text}${extra ? ` (${extra})` : ""}`;
        })
        .join("\n")
    : "Todavía no tiene subtareas.";

  const notesBlock = ctx.notes.length
    ? ctx.notes
        .map((n) => {
          const head = `- ${n.date} · ${n.author}${n.item ? ` · sobre la subtarea «${n.item}»` : ""}: ${n.body
            .replace(/\s+/g, " ")
            .trim()}`;
          const links = n.links.length
            ? ` [enlaces: ${n.links.map((l) => (l.label ? `${l.label} → ${l.url}` : l.url)).join("; ")}]`
            : "";
          return head + links;
        })
        .join("\n") +
      (ctx.notesTotal > ctx.notes.length
        ? `\n(Se muestran las ${ctx.notes.length} notas más recientes de ${ctx.notesTotal}.)`
        : "")
    : "Sin notas todavía.";

  const ask = need.trim()
    ? `## Lo que necesito ahora\n"""\n${need.trim()}\n"""\nEmpieza por ahí, apoyándote en todo el contexto de arriba.`
    : `## Qué hacer con este mensaje\nTe estoy poniendo al día. Responde solo con: (1) un resumen de 3 líneas de lo que entendiste del proyecto y de dónde está, y (2) una pregunta corta sobre en qué necesito tu ayuda. Espera mi respuesta antes de proponer nada.`;

  return `Voy a trabajar contigo en un proyecto de la Unidad de Informática de la Facultad de Ciencias Económicas (UIFCE), Universidad Nacional de Colombia. Este mensaje te da el contexto de la Unidad y del proyecto; léelo completo antes de responder.

## La Unidad y el área
La UIFCE es la Unidad de Informática de la Facultad de Ciencias Económicas de la Universidad Nacional de Colombia (sede Bogotá). Presta servicios tecnológicos y académicos a la Facultad mediante siete áreas, con apoyo de estudiantes monitores. El proyecto pertenece al área de Estrategias Tecnológicas (ET).
${dash(ctx.areaDescription)}

${ET_AREA_CONTEXT.replace("## Contexto del área", "### Cómo trabaja ET")}

### Semestre ${dash(ctx.semesterLabel)}
Objetivos del área:
${list(ctx.semesterObjectives)}

Frentes de Difusión y visibilidad:
${list(ctx.etStrategies)}

## El proyecto
- Título: ${ctx.title}
- Categoría: ${ctx.category}
- Estado: ${ctx.statusLabel} · Urgencia: ${dash(ctx.priorityLabel)}
- Responsable (dentro de ET): ${dash(ctx.assignee)} · Área solicitante (fuera de ET): ${dash(ctx.requester)}
- Etiquetas: ${ctx.tags.length ? ctx.tags.join(", ") : "—"}
- Horario y lugar: ${dash(ctx.schedule)}
- Es una actividad del proyecto: ${dash(ctx.mainProjectTitle)}
- Carpeta de Drive: ${dash(ctx.driveFolderUrl)}

Qué se debe hacer:
${dash(ctx.description)}

Qué se espera:
${dash(ctx.expectedOutcome)}

Fundamento:
${dash(ctx.rationale)}

## Actividades que cuelgan de este proyecto
${activitiesBlock}

## Checklist (${ctx.checklist.length} subtareas, ${doneCount} hechas; [x] = hecha)
${checklistBlock}

## Bitácora (de la más reciente a la más antigua)
${notesBlock}

## Cómo quiero que trabajes
- Usa solo lo que está en este mensaje. No inventes datos, cifras, fechas ni nombres; si falta algo, dilo o escribe «[por confirmar]».
- Si te falta algo esencial para ayudarme bien, pregúntame (máximo 4 preguntas cortas) antes de continuar.
- Español, tono institucional y sobrio, sin relleno. Terminología fija: UIFCE (mayúsculas), Hackatón (con tilde), ET, máster, monitores.
- Respeta lo ya avanzado: no propongas rehacer lo que está marcado como hecho.

${ask}`;
}
