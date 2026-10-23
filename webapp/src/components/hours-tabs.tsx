"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type Tab = "horas" | "horario" | "puntualidad";

/** Pestañas de /horas: «Horas» (plan y contador por semana), «Horario de oficina» (de lunes a sábado) y «Puntualidad» (tiempo tarde
 *  acumulado). Los paneles se montan siempre y se oculta el que no está a la vista, para no perder lo que se estaba haciendo al cambiar. */
export function HoursTabs({ initial, hours, schedule, lateness }: { initial: Tab; hours: React.ReactNode; schedule: React.ReactNode; lateness: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>(initial);
  const tabs: { id: Tab; label: string }[] = [
    { id: "horas", label: "Horas" },
    { id: "horario", label: "Horario de oficina" },
    { id: "puntualidad", label: "Puntualidad" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Apartados de horas del equipo" className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="panel-horas" aria-labelledby="tab-horas" hidden={tab !== "horas"}>
        {hours}
      </div>
      <div role="tabpanel" id="panel-horario" aria-labelledby="tab-horario" hidden={tab !== "horario"}>
        {schedule}
      </div>
      <div role="tabpanel" id="panel-puntualidad" aria-labelledby="tab-puntualidad" hidden={tab !== "puntualidad"}>
        {lateness}
      </div>
    </div>
  );
}
