"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { updateSemesterObjectives } from "@/lib/actions/semesters";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { InfoHint } from "@/components/info-hint";
import { useCanEdit } from "@/components/access-context";

export function SemesterObjectives({
  semester,
}: {
  semester: { id: string; label: string; objectives: string[] } | null;
}) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);

  if (!semester) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay un semestre seleccionado.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Objetivos {semester.label}
          <InfoHint text="Los objetivos del área para el semestre seleccionado en las pestañas de arriba (distintos de los objetivos generales de «El área»). Cómo se usa: con perfil completo, el lápiz → un objetivo por línea → Guardar. Ejemplo: «Ejecutar la primera edición de la Semana UIFCE: Hackatón, microtaller y conferencia»." />
        </p>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded p-1 text-muted-foreground hover:bg-accent"
            aria-label="Editar objetivos del semestre"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {editing ? (
        <form
          action={async (formData) => {
            await updateSemesterObjectives(semester.id, String(formData.get("objectives") ?? ""));
            setEditing(false);
          }}
          className="flex flex-col gap-2"
        >
          <Textarea
            name="objectives"
            defaultValue={semester.objectives.join("\n")}
            placeholder="Un objetivo por línea"
            className="min-h-[160px] text-sm"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Guardar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : semester.objectives.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin objetivos definidos para este semestre.</p>
      ) : (
        <ol className="flex flex-col gap-2 text-sm leading-snug">
          {semester.objectives.map((objetivo, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span>{objetivo}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
