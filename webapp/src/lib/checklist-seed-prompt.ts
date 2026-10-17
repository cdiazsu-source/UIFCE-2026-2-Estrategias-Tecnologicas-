import { ET_AREA_CONTEXT } from "@/lib/project-seed-prompt";

/** Datos del proyecto que viajan al prompt (todo serializable, ya formateado). */
export type ChecklistSeedContext = {
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
  /** Título del proyecto principal, si este es una actividad de otro. */
  mainProjectTitle: string | null;
  checklist: { text: string; done: boolean; assignee: string | null; due: string | null }[];
  /** Notas de bitácora recientes (más nueva primero), con el cuerpo ya recortado. */
  notes: { author: string; date: string; body: string }[];
};

export const CHECKLIST_IDEA_PLACEHOLDER =
  "<<Escribe aquí tu idea para la checklist: qué parte del proyecto quieres desglosar, qué falta, con quién se cruza, fechas límite, si quieres varias opciones.>>";

/** Prompt «semilla» de checklist: lleva todo el contexto de UN proyecto + la idea
 *  de checklist del usuario, y pide a la IA subtareas listas para pegar en la
 *  tarjeta «Checklist» (botón «Pegar lista»). */
export function buildChecklistSeedPrompt(ctx: ChecklistSeedContext, idea: string): string {
  const raw = idea.trim() || CHECKLIST_IDEA_PLACEHOLDER;
  const dash = (v: string | null | undefined) => (v && v.trim() ? v.trim() : "—");

  const doneCount = ctx.checklist.filter((i) => i.done).length;
  const checklistBlock =
    ctx.checklist.length === 0
      ? "Todavía no tiene subtareas."
      : ctx.checklist
          .map((i, n) => {
            const extra = [i.assignee ? `responsable: ${i.assignee}` : "", i.due ? `vence ${i.due}` : ""]
              .filter(Boolean)
              .join(", ");
            return `${n + 1}. [${i.done ? "x" : " "}] ${i.text}${extra ? ` (${extra})` : ""}`;
          })
          .join("\n");

  const notesBlock =
    ctx.notes.length === 0
      ? "Sin notas todavía."
      : ctx.notes.map((n) => `- ${n.date} · ${n.author}: ${n.body.replace(/\s+/g, " ").trim()}`).join("\n");

  return `Eres el asistente de planeación del área de Estrategias Tecnológicas (ET) de la Unidad de Informática de la Facultad de Ciencias Económicas (UIFCE), Universidad Nacional de Colombia. Tu trabajo es ayudarme a definir la checklist (las subtareas) de UN proyecto que ya existe en el tracker interno «ET en Marcha».

${ET_AREA_CONTEXT}

## El proyecto
- Título: ${ctx.title}
- Categoría: ${ctx.category}
- Estado: ${ctx.statusLabel} · Urgencia: ${dash(ctx.priorityLabel)}
- Responsable: ${dash(ctx.assignee)} · Solicitante: ${dash(ctx.requester)}
- Etiquetas: ${ctx.tags.length ? ctx.tags.join(", ") : "—"}
- Horario y lugar: ${dash(ctx.schedule)}
- Es una actividad del proyecto: ${dash(ctx.mainProjectTitle)}

Qué se debe hacer:
${dash(ctx.description)}

Qué se espera:
${dash(ctx.expectedOutcome)}

Fundamento:
${dash(ctx.rationale)}

## Checklist actual (${ctx.checklist.length} subtareas, ${doneCount} hechas; [x] = hecha)
${checklistBlock}

## Últimas notas de la bitácora
${notesBlock}

## Cómo debe ser una buena checklist en el tracker
- De 4 a 8 subtareas por checklist, ordenadas para ejecutarse de arriba abajo: primero validar y definir, luego producir, luego revisar y aprobar, luego publicar o entregar, y al final medir y cerrar.
- Cada subtarea empieza con un verbo en infinitivo y termina en algo verificable (un documento, una pieza, una aprobación, un enlace). Una sola acción por subtarea; sin «y» que junte dos pasos, sin «etc.» y sin repetir el título del proyecto.
- Si hay una aprobación o un insumo de otra área, ponlo como subtarea propia antes de producir.
- La última subtarea debe verificar «Qué se espera» del proyecto.
- Respeta lo ya avanzado: no repitas ni rehagas las subtareas de la checklist actual (hechas o no). Propón solo lo que falta o lo que yo te pida; si ves un hueco o un orden mejor, dilo en una línea al final, sin reescribir lo existente.
- Las subtareas que me des se agregan al final de la checklist actual: pensadas como continuación de lo que ya hay, no como una lista desde cero.

## Reglas
- No inventes datos: cifras, fechas, nombres de personas, presupuestos o antecedentes que no estén arriba o en mi idea. Si falta algo, escribe «[por confirmar]».
- Antes de redactar, si te falta algo esencial (el resultado esperado en términos verificables, quién ejecuta, la fecha límite), hazme como máximo 4 preguntas cortas y espera mi respuesta. Si con lo que hay alcanza, sigue directo.
- Redacta en español, tono institucional y sobrio, sin relleno ni frases de marketing.
- No pongas responsables ni fechas dentro del texto de las subtareas: eso se asigna después en la app.

## Mi idea de checklist
"""
${raw}
"""
Si te pido varias opciones o enfoques, entrégalas como checklists separadas; si no, entrega una sola.

## Formato de salida
Para cada checklist, entrégame: una línea «Checklist: <enfoque en pocas palabras>» y, debajo, la lista numerada con una subtarea por línea, dentro de un bloque de código para copiarla de una vez. Ejemplo:

Checklist: Producción y publicación
\`\`\`
1. Validar el guion con el área solicitante
2. Producir la pieza principal en formato vertical
3. Obtener la aprobación de Coordinación
\`\`\`

Sin texto adicional salvo, si hace falta, una sola línea final de nota sin viñetas ni numeración. Esa lista es la que pegaré en el botón «Pegar lista» de la tarjeta Checklist.`;
}
