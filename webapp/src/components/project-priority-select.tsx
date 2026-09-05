"use client";

import { useState, useTransition } from "react";
import { AlertTriangle } from "lucide-react";

import { updateProjectPriority } from "@/lib/actions/projects";
import { Select } from "@/components/ui/select";
import { PriorityTag } from "@/components/priority-tag";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";
import { PRIORITY_TAGS, PRIORITY_TAG_LABEL } from "@/lib/utils";

export function ProjectPrioritySelect({
  projectId,
  priorityTag,
  wipBlocked,
}: {
  projectId: string;
  priorityTag: string | null;
  /** true = alguna persona asignada ya está en el límite de «Atención Inmediata». */
  wipBlocked: boolean;
}) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [value, setValue] = useState(priorityTag ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canEdit) return <PriorityTag tag={priorityTag} />;

  const alreadyUrgent = priorityTag === "ATENCION_INMEDIATA";

  return (
    <div className="flex flex-col gap-1">
      <Select
        value={value}
        disabled={isPending}
        className="w-auto"
        aria-label="Urgencia"
        onChange={(e) => {
          const next = e.target.value;
          setError(null);
          setValue(next);
          startTransition(async () => {
            const r = await updateProjectPriority(projectId, next);
            if (r && "error" in r) {
              setError(r.error);
              setValue(priorityTag ?? "");
            } else if (r) {
              undo(r);
            }
          });
        }}
      >
        <option value="">Sin etiqueta</option>
        {PRIORITY_TAGS.map((t) => (
          <option
            key={t}
            value={t}
            disabled={t === "ATENCION_INMEDIATA" && wipBlocked && !alreadyUrgent}
          >
            {PRIORITY_TAG_LABEL[t]}
          </option>
        ))}
      </Select>

      {wipBlocked && !alreadyUrgent && !error && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          Una persona asignada ya tiene 3 en «❗ Atención Inmediata».
        </p>
      )}
      {error && (
        <p className="flex items-start gap-1 text-xs font-medium text-destructive" role="alert">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
