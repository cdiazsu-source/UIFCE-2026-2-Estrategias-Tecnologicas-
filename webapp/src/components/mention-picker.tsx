"use client";

import { useState } from "react";
import { AtSign, X } from "lucide-react";

import { Select } from "@/components/ui/select";
import { personColor } from "@/lib/person-color";

export type MentionPerson = { id: string; name: string; color?: string | null };

/** Selector para etiquetar a personas del equipo en una nota o subtarea.
 *  Emite un <input hidden name={name}> por cada id seleccionado; el servidor
 *  lo lee con formData.getAll(name). */
export function MentionPicker({
  name,
  people,
  defaultValue = [],
}: {
  name: string;
  people: MentionPerson[];
  defaultValue?: string[];
}) {
  const known = new Set(people.map((p) => p.id));
  const [selected, setSelected] = useState<string[]>(defaultValue.filter((id) => known.has(id)));

  const byId = new Map(people.map((p) => [p.id, p]));
  const available = people.filter((p) => !selected.includes(p.id));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {selected.map((id) => {
        const p = byId.get(id);
        if (!p) return null;
        return (
          <span key={id}>
            <input type="hidden" name={name} value={id} />
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary px-2 py-0.5 text-xs">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: personColor(p) }}
                aria-hidden
              />
              {p.name}
              <button
                type="button"
                onClick={() => setSelected((s) => s.filter((x) => x !== id))}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Quitar etiqueta de ${p.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          </span>
        );
      })}

      {available.length > 0 && (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <AtSign className="h-3.5 w-3.5" />
          <Select
            value=""
            onChange={(e) => {
              const id = e.target.value;
              if (id) setSelected((s) => [...s, id]);
            }}
            className="h-7 w-40 text-xs"
            aria-label="Etiquetar a un miembro del equipo"
          >
            <option value="">Etiquetar a…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </span>
      )}
    </div>
  );
}

/** Chips de solo lectura para mostrar a quién se etiquetó. */
export function MentionTags({ people }: { people: MentionPerson[] }) {
  if (people.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <AtSign className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
      {people.map((p) => (
        <span key={p.id} className="inline-flex items-center gap-1">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: personColor(p) }}
            aria-hidden
          />
          <span style={{ color: personColor(p) }}>{p.name}</span>
        </span>
      ))}
    </span>
  );
}
