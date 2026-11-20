"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/** Bloque plegable simple para «Aliados académicos»: título y una pista a la derecha; el contenido solo se pinta abierto. */
export function Fold({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: React.ReactNode;
  hint?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="press flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold"
      >
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150", !open && "-rotate-90")} aria-hidden />
        <span>{title}</span>
        {hint && <span className="ml-auto text-xs font-normal text-muted-foreground">{hint}</span>}
      </button>
      {open && <div className="border-t border-border p-3">{children}</div>}
    </div>
  );
}
