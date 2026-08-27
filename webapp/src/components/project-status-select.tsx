"use client";

import { useTransition } from "react";
import type { ProjectStatus } from "@prisma/client";

import { updateProjectStatus } from "@/lib/actions/projects";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS_LABEL } from "@/lib/utils";
import { useCanEdit } from "@/components/access-context";

const OPTIONS: ProjectStatus[] = ["POR_INICIAR", "EN_CURSO", "COMPLETADO"];

const BADGE_VARIANT: Record<ProjectStatus, "secondary" | "warning" | "success"> = {
  POR_INICIAR: "secondary",
  EN_CURSO: "warning",
  COMPLETADO: "success",
};

export function ProjectStatusSelect({ projectId, status }: { projectId: string; status: ProjectStatus }) {
  const canEdit = useCanEdit();
  const [isPending, startTransition] = useTransition();

  if (!canEdit) {
    return <Badge variant={BADGE_VARIANT[status]}>{PROJECT_STATUS_LABEL[status]}</Badge>;
  }

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
