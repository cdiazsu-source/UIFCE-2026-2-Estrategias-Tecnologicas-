"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { updateAreaProfile } from "@/lib/actions/area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoHint } from "@/components/info-hint";
import { useCanEdit } from "@/components/access-context";

export type AreaProfileData = { description: string; objectives: string[] };

export function AreaOverview({ profile }: { profile: AreaProfileData | null }) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);

  const description = profile?.description ?? "";
  const objectives = profile?.objectives ?? [];

  return (
    <section>
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              El área
              <InfoHint text="Ficha institucional del área: descripción corporativa y objetivos generales (permanentes). Cómo se usa: con perfil completo, el lápiz edita la descripción y los objetivos (uno por línea). Los objetivos de un semestre concreto están en la sección de Proyectos, en su pestaña. Ejemplo de objetivo general: «Preservar la memoria del área: documentar procesos y aprendizajes»." />
            </p>
            <CardTitle className="text-lg">Estrategias Tecnológicas — Unidad de Informática (UIFCE)</CardTitle>
          </div>
          {canEdit && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label="Editar ficha del área"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </CardHeader>
        <CardContent>
          {editing ? (
            <form
              action={async (formData) => {
                await updateAreaProfile(formData);
                setEditing(false);
              }}
              className="flex flex-col gap-3"
            >
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Descripción corporativa
              </label>
              <Textarea name="description" defaultValue={description} className="min-h-[140px] text-sm" />
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Objetivos generales (uno por línea)
              </label>
              <Textarea name="objectives" defaultValue={objectives.join("\n")} className="min-h-[140px] text-sm" />
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Guardar
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-6 md:grid-cols-[1.25fr_1fr]">
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {description || "Sin descripción."}
              </p>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Objetivos generales
                </p>
                {objectives.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin objetivos generales definidos.</p>
                ) : (
                  <ol className="flex flex-col gap-2 text-sm leading-snug">
                    {objectives.map((objetivo, i) => (
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
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
