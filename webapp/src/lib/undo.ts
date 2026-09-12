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
        mentionIds: string[];
        createdAt: string;
      };
    }
  | {
      kind: "note.update";
      id: string;
      projectId: string;
      before: { body: string; checklistItemId: string | null; mentionIds: string[] };
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
        mentionIds: string[];
      };
    }
  | {
      kind: "checklist.update";
      id: string;
      projectId: string;
      before: {
        text: string;
        assignee: string | null;
        assigneeId: string | null;
        dueDate: string | null;
        mentionIds: string[];
      };
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
  | { kind: "project.priority"; id: string; before: string | null }
  | { kind: "project.assignee"; id: string; before: string | null }
  | { kind: "project.title"; id: string; before: { title: string; editedInApp: boolean } }
  | {
      kind: "project.schedule";
      id: string;
      before: { startAt: string | null; endAt: string | null; location: string | null };
    }
  | { kind: "project.mainProject"; id: string; before: string | null }
  | {
      kind: "social.update";
      id: string;
      before: {
        handle: string | null;
        url: string | null;
        status: string;
        officialStatus: string;
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
        officialStatus: string;
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
    }
  | {
      kind: "socialinteraction.update";
      id: string;
      before: {
        at: string;
        title: string;
        detail: string | null;
        followers: number | null;
        reach: number | null;
        interactions: number | null;
        url: string | null;
      };
    }
  | {
      kind: "socialinteraction.delete";
      data: {
        id: string;
        channelId: string;
        at: string;
        title: string;
        detail: string | null;
        followers: number | null;
        reach: number | null;
        interactions: number | null;
        url: string | null;
      };
    }
  | {
      kind: "socialmetric.update";
      id: string;
      before: {
        at: string;
        note: string | null;
        values: Record<string, number | null>;
      };
    }
  | {
      kind: "socialmetric.delete";
      data: {
        id: string;
        channelId: string;
        platform: string;
        at: string;
        recordedById: string | null;
        recordedByName: string | null;
        note: string | null;
        values: Record<string, number | null>;
      };
    }
  | {
      kind: "linkedinsnapshot.update";
      id: string;
      before: { month: string; note: string | null; values: Record<string, number | boolean | null> };
    }
  | {
      kind: "linkedinsnapshot.delete";
      data: {
        id: string;
        trackeeId: string;
        month: string;
        note: string | null;
        recordedById: string | null;
        recordedByName: string | null;
        values: Record<string, number | boolean | null>;
      };
    }
  | {
      kind: "template.update";
      id: string;
      before: {
        name: string;
        category: string;
        description: string | null;
        url: string | null;
        format: string | null;
        notes: string | null;
        screenshot: string | null;
      };
    }
  | {
      kind: "template.delete";
      data: {
        id: string;
        name: string;
        category: string;
        description: string | null;
        url: string | null;
        format: string | null;
        notes: string | null;
        screenshot: string | null;
        order: number;
      };
    }
  | {
      kind: "studycomment.delete";
      data: {
        id: string;
        studyProjectId: string;
        body: string;
        author: string;
        authorRole: string | null;
        authorId: string | null;
        parentId: string | null;
        createdAt: string;
      };
    }
  | {
      kind: "teamcomment.delete";
      data: {
        id: string;
        body: string;
        author: string;
        authorRole: string | null;
        authorId: string | null;
        reviewed: boolean;
        parentId: string | null;
        createdAt: string;
      };
    }
  | { kind: "teamcomment.reviewed"; id: string; before: boolean };

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
    "project.priority": "Urgencia cambiada",
    "project.assignee": "Responsable cambiado",
    "project.title": "Nombre del proyecto editado",
    "project.schedule": "Horario del proyecto editado",
    "project.mainProject": "Proyecto principal cambiado",
    "social.update": "Cuenta editada",
    "social.delete": "Cuenta eliminada",
    "socialinteraction.update": "Interacción editada",
    "socialinteraction.delete": "Interacción eliminada",
    "socialmetric.update": "Medición editada",
    "socialmetric.delete": "Medición eliminada",
    "linkedinsnapshot.update": "Medición de LinkedIn editada",
    "linkedinsnapshot.delete": "Medición de LinkedIn eliminada",
    "template.update": "Plantilla editada",
    "template.delete": "Plantilla eliminada",
    "studycomment.delete": "Actualización de PE eliminada",
    "teamcomment.delete": "Comentario eliminado",
    "teamcomment.reviewed": "Comentario actualizado",
  };
  return map[kind];
}
