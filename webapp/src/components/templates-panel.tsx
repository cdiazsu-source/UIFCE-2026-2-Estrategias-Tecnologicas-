"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";

import { addTemplate, deleteTemplate, updateTemplate } from "@/lib/actions/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";

export type TemplateData = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  url: string | null;
  format: string | null;
  notes: string | null;
};

export const TEMPLATE_CATEGORIES = [
  "Redes sociales",
  "Televisores de la unidad",
  "Difusión por correo",
  "Disponibilidad de salas",
  "Cursos Libres ofertados",
  "Eventos",
  "Apoyos académicos",
  "Otras",
];

function categoryRank(c: string): number {
  const i = TEMPLATE_CATEGORIES.indexOf(c);
  return i === -1 ? TEMPLATE_CATEGORIES.length : i;
}

function Fields({ t }: { t?: TemplateData }) {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Input name="name" defaultValue={t?.name ?? ""} placeholder="Nombre de la plantilla" required className="min-w-[14rem] flex-1" />
        <Input
          name="category"
          defaultValue={t?.category ?? TEMPLATE_CATEGORIES[0]}
          placeholder="Categoría"
          list="template-categories"
          className="w-56"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Input name="format" defaultValue={t?.format ?? ""} placeholder="Formato o medida (ej. Reel 1080×1920)" className="min-w-[14rem] flex-1" />
        <Input name="url" defaultValue={t?.url ?? ""} placeholder="Enlace (Drive, Canva, Figma…)" className="min-w-[14rem] flex-1" />
      </div>
      <Textarea name="description" defaultValue={t?.description ?? ""} placeholder="Para qué sirve / cuándo se usa" className="min-h-[56px]" />
      <Textarea name="notes" defaultValue={t?.notes ?? ""} placeholder="Notas (aprobaciones, responsables, variantes…)" className="min-h-[56px]" />
    </>
  );
}

function TemplateCard({ template }: { template: TemplateData }) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <Card>
        <CardContent className="pt-4">
          <form
            action={async (formData) => {
              const u = await updateTemplate(template.id, formData);
              if (u) undo(u);
              setEditing(false);
            }}
            className="flex flex-col gap-2"
          >
            <Fields t={template} />
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
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <div className="flex flex-col gap-1">
          <span className="font-semibold leading-tight">{template.name}</span>
          {template.format && <span className="text-xs text-muted-foreground">{template.format}</span>}
        </div>
        {canEdit && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label="Editar plantilla"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm(`¿Eliminar la plantilla "${template.name}"?`)) return;
                startTransition(async () => {
                  const u = await deleteTemplate(template.id);
                  if (u) undo(u);
                });
              }}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              aria-label="Eliminar plantilla"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {template.description && <p className="whitespace-pre-line text-muted-foreground">{template.description}</p>}
        {template.url && (
          <a
            href={template.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1 text-primary hover:underline"
          >
            Abrir plantilla
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        {template.notes && (
          <p className="whitespace-pre-line rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">{template.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function TemplatesPanel({ templates }: { templates: TemplateData[] }) {
  const canEdit = useCanEdit();
  const [adding, setAdding] = useState(false);

  const groups = new Map<string, TemplateData[]>();
  for (const t of templates) {
    const arr = groups.get(t.category) ?? [];
    arr.push(t);
    groups.set(t.category, arr);
  }
  const sortedCategories = [...groups.keys()].sort(
    (a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b, "es"),
  );

  return (
    <div className="flex flex-col gap-6">
      <datalist id="template-categories">
        {TEMPLATE_CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {canEdit && (
        <div>
          {adding ? (
            <Card>
              <CardContent className="pt-4">
                <form
                  action={async (formData) => {
                    await addTemplate(formData);
                    setAdding(false);
                  }}
                  className="flex flex-col gap-2"
                >
                  <Fields />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">
                      Agregar plantilla
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5" />
              Nueva plantilla
            </Button>
          )}
        </div>
      )}

      {templates.length === 0 ? (
        <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
          Todavía no hay plantillas registradas.
        </p>
      ) : (
        sortedCategories.map((cat) => (
          <section key={cat} className="flex flex-col gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {cat}
              <span className="font-normal">({groups.get(cat)!.length})</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.get(cat)!.map((t) => (
                <TemplateCard key={t.id} template={t} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
