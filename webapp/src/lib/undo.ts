/** Descriptor serializable de "cómo deshacer" la última acción. Viaja del
 *  servidor al cliente (banner) y vuelve para revertirse. Guarda el estado
 *  previo, no un id de bitácora: el deshacer es efímero (dura lo que el banner).
 *  Al recrear filas se conserva su id original para que sea una restauración
 *  real (los vínculos que apuntan a esa fila siguen sirviendo). */
export type UndoAction =
  | {
      kind: "note.delete";
      data: {
        id: string;
        projectId: string;
        body: string;
        author: string;
        authorRole: string | null;
        authorId: string | null;
        checklistItemId: string | null;
        createdAt: string;
      };
    }
  | {
      kind: "note.update";
      id: string;
      projectId: string;
      before: { body: string; checklistItemId: string | null };
    }
  | {
      kind: "checklist.delete";
      data: {
        id: string;
        projectId: string;
        text: string;
        order: number;
        done: boolean;
        assignee: string | null;
        assigneeId: string | null;
        dueDate: string | null;
      };
    }
  | {
      kind: "checklist.update";
      id: string;
      projectId: string;
      before: { text: string; assignee: string | null; assigneeId: string | null; dueDate: string | null };
    }
  | { kind: "checklist.toggle"; id: string; projectId: string; before: boolean }
  | {
      kind: "project.content";
      id: string;
      before: {
        title: string;
        category: string;
        priorityTag: string | null;
        description: string;
        expectedOutcome: string;
        rationale: string;
        editedInApp: boolean;
      };
    }
  | { kind: "project.tags"; id: string; before: string[] }
  | {
      kind: "social.update";
      id: string;
      before: {
        handle: string | null;
        url: string | null;
        status: string;
        official: boolean;
        followers: number | null;
        cadence: string | null;
        lastPostAt: string | null;
        lastPostNote: string | null;
        nextAction: string | null;
        notes: string | null;
        responsibleId: string | null;
      };
    }
  | {
      kind: "social.delete";
      data: {
        id: string;
        platform: string;
        handle: string | null;
        url: string | null;
        status: string;
        official: boolean;
        followers: number | null;
        cadence: string | null;
        lastPostAt: string | null;
        lastPostNote: string | null;
        nextAction: string | null;
        notes: string | null;
        responsibleId: string | null;
        projectId: string | null;
        order: number;
      };
    };

/** Etiqueta corta para el banner "Deshacer". */
export function undoLabel(kind: UndoAction["kind"]): string {
  const map: Record<UndoAction["kind"], string> = {
    "note.delete": "Nota eliminada",
    "note.update": "Nota editada",
    "checklist.delete": "Subtarea eliminada",
    "checklist.update": "Subtarea editada",
    "checklist.toggle": "Subtarea marcada",
    "project.content": "Proyecto editado",
    "project.tags": "Etiquetas cambiadas",
    "social.update": "Cuenta editada",
    "social.delete": "Cuenta eliminada",
  };
  return map[kind];
}
