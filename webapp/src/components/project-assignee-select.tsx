"use client";

import { useState, useTransition } from "react";

import { updateProjectAssignee } from "@/lib/actions/projects";
import { Select } from "@/components/ui/select";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";
import { personColor } from "@/lib/person-color";

export type AssigneePerson = { id: string; name: string; color?: string | null };

function Dot({ person }: { person: AssigneePerson }) {
  return (
    <span
      className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
      style={{ backgroundColor: personColor(person) }}
      aria-hidden
    />
  );
}

export function ProjectAssigneeSelect({
  projectId,
  assignee,
  people,
}: {
  projectId: string;
  assignee: AssigneePerson | null;
  people: AssigneePerson[];
}) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [value, setValue] = useState(assignee?.id ?? "");
  const [isPending, startTransition] = useTransition();

  if (!canEdit) {
    if (!assignee) return <span className="text-sm text-muted-foreground">Sin responsable</span>;
    return (
      <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: personColor(assignee) }}>
        <Dot person={assignee} />
        {assignee.name}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      {value && <Dot person={people.find((p) => p.id === value) ?? { id: value, name: "" }} />}
      <Select
        value={value}
        disabled={isPending}
        className="w-auto"
        aria-label="Responsable del proyecto"
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          startTransition(async () => {
            const u = await updateProjectAssignee(projectId, next);
            if (u) undo(u);
          });
        }}
      >
        <option value="">Sin responsable</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
    </span>
  );
}
