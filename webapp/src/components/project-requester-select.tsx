"use client";

import { useState, useTransition } from "react";

import { updateProjectRequester } from "@/lib/actions/projects";
import { REQUESTER_OPTIONS, requesterLabel } from "@/lib/requester";
import { Select } from "@/components/ui/select";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";

/** Solicitante del proyecto: el área o instancia (AA, GC, DS, VA, CL, Coordinación,
 *  Dirección) que pidió el servicio. No se muestran nombres de personas. */
export function ProjectRequesterSelect({
  projectId,
  requesterArea,
}: {
  projectId: string;
  requesterArea: string | null;
}) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [value, setValue] = useState(requesterArea ?? "");
  const [isPending, startTransition] = useTransition();

  if (!canEdit) {
    const label = requesterLabel(requesterArea);
    return <span className={label ? "text-sm" : "text-sm text-muted-foreground"}>{label ?? "Sin solicitante"}</span>;
  }

  return (
    <Select
      value={value}
      disabled={isPending}
      className="w-auto"
      aria-label="Solicitante del proyecto"
      onChange={(e) => {
        const next = e.target.value;
        setValue(next);
        startTransition(async () => {
          const u = await updateProjectRequester(projectId, next);
          if (u) undo(u);
        });
      }}
    >
      <option value="">Sin solicitante</option>
      {REQUESTER_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}
