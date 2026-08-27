"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Tool, ToolStatus } from "@prisma/client";

import { addTool, deleteTool, updateTool } from "@/lib/actions/tools";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, TOOL_STATUS_LABEL } from "@/lib/utils";
import { useCanEdit } from "@/components/access-context";

const STATUS_OPTIONS: ToolStatus[] = ["ACTIVA", "VENCIDA", "SIN_LICENCIA", "GRATUITA"];

const STATUS_BADGE_VARIANT: Record<ToolStatus, "success" | "destructive" | "secondary" | "outline"> = {
  ACTIVA: "success",
  VENCIDA: "destructive",
  SIN_LICENCIA: "secondary",
  GRATUITA: "outline",
};

function ToolRow({ tool }: { tool: Tool }) {
  const canEdit = useCanEdit();
  const [editing, setEditing] = useState(false);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <TableRow>
        <TableCell colSpan={5}>
          <form
            action={async (formData) => {
              await updateTool(tool.id, formData);
              setEditing(false);
            }}
            className="flex flex-wrap items-end gap-2"
          >
            <Input name="name" defaultValue={tool.name} className="w-40" />
            <Select name="status" defaultValue={tool.status} className="w-40">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {TOOL_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
            <Input name="location" defaultValue={tool.location ?? ""} placeholder="Dónde está / quién la tiene" className="w-56" />
            <Input
              type="date"
              name="lastVerifiedAt"
              defaultValue={tool.lastVerifiedAt ? tool.lastVerifiedAt.toISOString().slice(0, 10) : ""}
              className="w-40"
            />
            <Button type="submit" size="sm">
              Guardar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </form>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{tool.name}</TableCell>
      <TableCell>
        <Badge variant={STATUS_BADGE_VARIANT[tool.status]}>{TOOL_STATUS_LABEL[tool.status]}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{tool.location ?? "—"}</TableCell>
      <TableCell className="text-muted-foreground">
        {tool.lastVerifiedAt ? formatDate(tool.lastVerifiedAt) : "—"}
      </TableCell>
      <TableCell>
        {canEdit && (
          <div className="flex justify-end gap-1">
            <button type="button" onClick={() => setEditing(true)} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Editar herramienta">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => startTransition(() => deleteTool(tool.id))}
              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label="Eliminar herramienta"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export function ToolsTable({ tools }: { tools: Tool[] }) {
  const canEdit = useCanEdit();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={() => setShowForm((s) => !s)}>
            <Plus className="h-3.5 w-3.5" />
            Agregar herramienta
          </Button>
        </div>
      )}

      {canEdit && showForm && (
        <form
          action={async (formData) => {
            await addTool(formData);
            (document.getElementById("tool-add-form") as HTMLFormElement | null)?.reset();
          }}
          id="tool-add-form"
          className="flex flex-wrap items-end gap-2 rounded-md border border-dashed border-input p-3"
        >
          <Input name="name" placeholder="Nombre de la herramienta" required className="w-40" />
          <Select name="status" defaultValue="SIN_LICENCIA" className="w-40">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {TOOL_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
          <Input name="location" placeholder="Dónde está / quién la tiene" className="w-56" />
          <Input type="date" name="lastVerifiedAt" className="w-40" />
          <Button type="submit" size="sm">
            Agregar
          </Button>
        </form>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Herramienta</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Dónde está / quién la tiene</TableHead>
            <TableHead>Última verificación</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tools.map((tool) => (
            <ToolRow key={tool.id} tool={tool} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
