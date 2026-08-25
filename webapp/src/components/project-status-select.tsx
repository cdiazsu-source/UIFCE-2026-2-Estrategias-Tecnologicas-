"use client";

import { useTransition } from "react";
import type { ProjectStatus } from "@prisma/client";

import { updateProjectStatus } from "@/lib/actions/projects";
import { Select } from "@/components/ui/select";
import { PROJECT_STATUS_LABEL } from "@/lib/utils";

const OPTIONS: ProjectStatus[] = ["POR_INICIAR", "EN_CURSO", "COMPLETADO"];

export function ProjectStatusSelect({ projectId, status }: { projectId: string; status: ProjectStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={status}
      disabled={isPending}
      className="w-auto"
      onChange={(e) => {
        const next = e.target.value as ProjectStatus;
        startTransition(() => {
          updateProjectStatus(projectId, next);
        });
      }}
    >
      {OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {PROJECT_STATUS_LABEL[opt]}
        </option>
      ))}
    </Select>
  );
}
