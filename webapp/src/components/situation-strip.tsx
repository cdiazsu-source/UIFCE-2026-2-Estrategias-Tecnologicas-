"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import type { SituationStat } from "@prisma/client";

import { updateSituationStat } from "@/lib/actions/stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function StatCard({ stat }: { stat: SituationStat }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Card className="p-4">
        <form
          action={async (formData) => {
            await updateSituationStat(stat.id, formData);
            setEditing(false);
          }}
          className="flex flex-col gap-2"
        >
          <Input name="label" defaultValue={stat.label} placeholder="Etiqueta" className="text-xs" />
          <Input name="value" defaultValue={stat.value} placeholder="Valor" />
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              Guardar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="group relative p-4">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
        aria-label={`Editar ${stat.label}`}
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
      <p className="mt-1 text-sm font-semibold leading-snug">{stat.value}</p>
    </Card>
  );
}

export function SituationStrip({ stats }: { stats: SituationStat[] }) {
  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.id} stat={stat} />
      ))}
    </div>
  );
}
