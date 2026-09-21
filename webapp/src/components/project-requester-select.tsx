"use client";

import { useState, useTransition } from "react";

import { updateProjectRequester } from "@/lib/actions/projects";
import { Select } from "@/components/ui/select";
import { useCanEdit } from "@/components/access-context";
import { useUndo } from "@/components/undo-banner";
import { personColor } from "@/lib/person-color";
import type { AssigneePerson } from "@/components/project-assignee-select";

function Dot({ person }: { person: AssigneePerson }) {
  return (
    <span
      className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
      style={{ backgroundColor: personColor(person) }}
      aria-hidden
    />
  );
}

export function ProjectRequesterSelect({
  projectId,
  requester,
  people,
}: {
  projectId: string;
  requester: AssigneePerson | null;
  people: AssigneePerson[];
}) {
  const canEdit = useCanEdit();
  const undo = useUndo();
  const [value, setValue] = useState(requester?.id ?? "");
  const [isPending, startTransition] = useTransition();

  if (!canEdit) {
    if (!requester) return <span className="text-sm text-muted-foreground">Sin solicitante</span>;
    return (
      <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: personColor(requester) }}>
        <Dot person={requester} />
        {requester.name}
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
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
    </span>
  );
}
