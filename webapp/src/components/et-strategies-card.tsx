"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { updateSemesterEtStrategies } from "@/lib/actions/semesters";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { useCanEdit } from "@/components/access-context";

export function EtStrategiesCard({
  semester,
}: {
  semester: { id: string; label: string; etStrategies: string[] } | null;
}) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);

  if (!semester) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Difusión y visibilidad — {semester.label}
            <InfoHint text="Los frentes concretos de Estrategias Tecnológicas para este semestre: qué canales y qué formatos se usan, sin entrar en el detalle operativo de cada proyecto (eso vive en la sección Proyectos). Cómo se usa: con perfil completo, el lápiz → un frente por línea → Guardar. Ejemplo: «Instagram (@ui_fce): contenido corto — hacks informáticos y reels»." />
          </p>
          <CardTitle className="text-lg">ET</CardTitle>
        </div>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded p-1 text-muted-foreground hover:bg-accent"
            aria-label="Editar frentes de Difusión y visibilidad"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <form
            action={async (formData) => {
              await updateSemesterEtStrategies(semester.id, String(formData.get("etStrategies") ?? ""));
              setEditing(false);
            }}
            className="flex flex-col gap-2"
          >
            <Textarea
              name="etStrategies"
              defaultValue={semester.etStrategies.join("\n")}
              placeholder="Un frente por línea"
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
        ) : semester.etStrategies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin frentes definidos para este semestre.</p>
        ) : (
          <ol className="flex flex-col gap-2 text-sm leading-snug">
            {semester.etStrategies.map((item, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
