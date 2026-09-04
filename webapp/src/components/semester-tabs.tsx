"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Plus, Trash2 } from "lucide-react";

import { createSemester, deleteSemester, setCurrentSemester } from "@/lib/actions/semesters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCanEdit } from "@/components/access-context";

export type SemesterTab = {
  id: string;
  label: string;
  isCurrent: boolean;
  projectCount: number;
};

export function SemesterTabs({
  semesters,
  selectedId,
}: {
  semesters: SemesterTab[];
  selectedId: string;
}) {
  const canEdit = useCanEdit();
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  const selected = semesters.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {semesters.map((s) => {
          const active = s.id === selectedId;
          return (
            <Link
              key={s.id}
              href={s.isCurrent ? "/" : `/?sem=${encodeURIComponent(s.label)}`}
              scroll={false}
              className={cn(
                "press inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {s.label}
              {s.isCurrent && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] font-semibold uppercase",
                    active ? "bg-primary-foreground/20" : "bg-primary/10 text-primary",
                  )}
                >
                  vigente
                </span>
              )}
              <span className={cn("text-xs", active ? "text-primary-foreground/70" : "text-muted-foreground/70")}>
                {s.projectCount}
              </span>
            </Link>
          );
        })}

        {canEdit &&
          (adding ? (
            <form
              action={async (formData) => {
                await createSemester(formData);
                setAdding(false);
              }}
              className="inline-flex items-center gap-1.5"
            >
              <Input name="label" placeholder="2027-1S" required className="h-8 w-28 text-sm" autoFocus />
              <Button type="submit" size="sm">
                Crear
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setAdding(false)}>
                Cancelar
              </Button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-input px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" />
              Nuevo semestre
            </button>
          ))}
      </div>

      {canEdit && selected && !selected.isCurrent && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Semestre {selected.label}:</span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => setCurrentSemester(selected.id))}
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 hover:bg-accent hover:text-accent-foreground disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
            Marcar como vigente
          </button>
          {selected.projectCount === 0 && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (!window.confirm(`¿Borrar el semestre ${selected.label}?`)) return;
                startTransition(() => deleteSemester(selected.id));
              }}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Borrar (vacío)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
