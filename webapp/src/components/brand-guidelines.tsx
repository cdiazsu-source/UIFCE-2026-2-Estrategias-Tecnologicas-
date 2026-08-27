"use client";

import { useMemo, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { BrandGuideline } from "@prisma/client";

import { addGuideline, deleteGuideline, updateGuideline } from "@/lib/actions/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useCanEdit } from "@/components/access-context";

/** Orden preferido de secciones; cualquier otra sección va después, alfabética. */
const SECTION_ORDER = ["Lineamientos", "Colores", "Franjas", "Formatos", "Aprobación"];
const SECTION_SUGGESTIONS = [...SECTION_ORDER, "Tipografía", "Logos y escudo"];

function GuidelineFields({ guideline }: { guideline?: BrandGuideline }) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Input
          name="section"
          list="brand-sections"
          defaultValue={guideline?.section ?? ""}
          placeholder="Sección (ej. Colores)"
          required
          className="w-44"
        />
        <Input
          name="title"
          defaultValue={guideline?.title ?? ""}
          placeholder="Título de la indicación"
          required
          className="min-w-[16rem] flex-1"
        />
        <Input
          name="colorHex"
          defaultValue={guideline?.colorHex ?? ""}
          placeholder="#RRGGBB (opcional)"
          className="w-40"
        />
      </div>
      <Textarea
        name="body"
        defaultValue={guideline?.body ?? ""}
        placeholder="Indicación: qué hacer, cuándo aplica, medidas, referencias…"
        required
        className="min-h-[90px]"
      />
    </>
  );
}

function GuidelineCard({ guideline }: { guideline: BrandGuideline }) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <form
            action={async (formData) => {
              await updateGuideline(guideline.id, formData);
              setEditing(false);
            }}
            className="flex flex-col gap-2"
          >
            <GuidelineFields guideline={guideline} />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Guardar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group">
      <CardContent className="flex gap-3 pt-6">
        {guideline.colorHex && (
          <span
            className="mt-0.5 h-10 w-10 shrink-0 rounded-md border border-border"
            style={{ backgroundColor: guideline.colorHex }}
            aria-hidden
          />
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-snug">{guideline.title}</h3>
            {canEdit && (
              <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded p-1 text-muted-foreground hover:bg-accent"
                  aria-label="Editar indicación"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => startTransition(() => deleteGuideline(guideline.id))}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Eliminar indicación"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          {guideline.colorHex && (
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{guideline.colorHex}</p>
          )}
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{guideline.body}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function BrandGuidelines({ guidelines }: { guidelines: BrandGuideline[] }) {
  const canEdit = useCanEdit();
  const [showForm, setShowForm] = useState(false);

  const sections = useMemo(() => {
    const bySection = new Map<string, BrandGuideline[]>();
    for (const g of guidelines) {
      const list = bySection.get(g.section) ?? [];
      list.push(g);
      bySection.set(g.section, list);
    }
    return [...bySection.entries()].sort(([a], [b]) => {
      const ia = SECTION_ORDER.indexOf(a);
      const ib = SECTION_ORDER.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      return a.localeCompare(b, "es");
    });
  }, [guidelines]);

  return (
    <div className="flex flex-col gap-6">
      <datalist id="brand-sections">
        {SECTION_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-3.5 w-3.5" />
            Agregar indicación
          </Button>
        </div>
      )}

      {canEdit && showForm && (
        <form
          action={async (formData) => {
            await addGuideline(formData);
            (document.getElementById("brand-add-form") as HTMLFormElement | null)?.reset();
            setShowForm(false);
          }}
          id="brand-add-form"
          className="flex flex-col gap-2 rounded-md border border-dashed border-input p-4"
        >
          <GuidelineFields />
          <div>
            <Button type="submit" size="sm">
              Agregar
            </Button>
          </div>
        </form>
      )}

      {guidelines.length === 0 ? (
        <p className="rounded-md border border-dashed border-input p-4 text-sm text-muted-foreground">
          Todavía no hay indicaciones de línea gráfica. Agrega la primera con el botón de arriba.
        </p>
      ) : (
        sections.map(([section, items]) => (
          <section key={section} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{section}</h2>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {items
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((g) => (
                  <GuidelineCard key={g.id} guideline={g} />
                ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
