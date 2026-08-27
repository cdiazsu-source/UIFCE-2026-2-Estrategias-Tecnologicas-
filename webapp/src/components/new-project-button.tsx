"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { createProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function NewProjectButton() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Plus className="h-3.5 w-3.5" />
        Nuevo proyecto
      </Button>
    );
  }

  return (
    <form
      action={createProject}
      className="flex w-full flex-col gap-2 rounded-md border border-dashed border-input bg-card p-4"
    >
      <div className="flex flex-wrap gap-2">
        <Input name="title" placeholder="Título del proyecto" required className="min-w-[16rem] flex-1" />
        <Input name="category" placeholder="Categoría (ej. Producción de contenido)" required className="min-w-[14rem] flex-1" />
        <Select name="priorityTag" defaultValue="" className="w-40">
          <option value="">Sin etiqueta</option>
          <option value="CRÍTICO">Crítico</option>
          <option value="PRIORITARIO">Prioritario</option>
          <option value="NUEVO">Nuevo</option>
        </Select>
      </div>
      <Textarea name="description" placeholder="Qué se debe hacer (opcional)" className="min-h-[60px]" />
      <Textarea name="expectedOutcome" placeholder="Qué se espera (opcional)" className="min-h-[60px]" />
      <Textarea name="rationale" placeholder="Fundamento (opcional)" className="min-h-[60px]" />
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Crear proyecto
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Se crea como proyecto propio de la app (no viene del CSV de planeación) y no se ve afectado por las
        resincronizaciones.
      </p>
    </form>
  );
}
