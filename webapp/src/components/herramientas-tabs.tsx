"use client";

import { useState } from "react";
import type { Tool } from "@prisma/client";

import { ToolsTable } from "@/components/tools-table";
import { LabRoomPreview, type SeatData } from "@/components/lab-room-preview";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "uifce", label: "UIFCE" },
  { key: "sala1", label: "Sala 1" },
  { key: "sala2", label: "Sala 2" },
  { key: "sala3", label: "Sala 3" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function RoomPlaceholder({ room }: { room: string }) {
  return (
    <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
      Todavía no armamos la disposición de {room}. Cuéntame cuántos equipos tiene y la vemos como la de Sala 1.
    </p>
  );
}

export function HerramientasTabs({ tools, sala1Seats }: { tools: Tool[]; sala1Seats: Record<number, SeatData> }) {
  const [tab, setTab] = useState<TabKey>("uifce");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "press rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-primary text-primary-foreground shadow-card"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "uifce" && <ToolsTable tools={tools} />}

      {tab === "sala1" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Disponibilidad por equipo</h2>
            <Badge variant="outline">Disposición real · software de ejemplo</Badge>
          </div>
          <LabRoomPreview room="sala1" seatData={sala1Seats} />
        </div>
      )}

      {tab === "sala2" && <RoomPlaceholder room="Sala 2" />}
      {tab === "sala3" && <RoomPlaceholder room="Sala 3" />}
    </div>
  );
}
