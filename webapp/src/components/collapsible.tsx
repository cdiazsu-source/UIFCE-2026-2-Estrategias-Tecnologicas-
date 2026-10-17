"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronsDownUp, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Evento global para contraer / expandir varias secciones a la vez. `scope` es
 *  un prefijo: una sección con scope «project:checklist» responde a un evento
 *  con scope «project» (y también al exacto). */
const COLLAPSE_EVENT = "et:collapse";

type CollapseDetail = { scope: string; open: boolean };

/** Estado abierto/cerrado de una sección, con respuesta a «Contraer todo» /
 *  «Expandir todo». Por defecto arranca abierta; no se persiste (es solo para
 *  moverse mejor por una página larga). */
export function useCollapse(scope: string, defaultOpen = true) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    function onCollapse(e: Event) {
      const d = (e as CustomEvent<CollapseDetail>).detail;
      if (d && (scope === d.scope || scope.startsWith(`${d.scope}:`))) setOpen(d.open);
    }
    window.addEventListener(COLLAPSE_EVENT, onCollapse);
    return () => window.removeEventListener(COLLAPSE_EVENT, onCollapse);
  }, [scope]);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  return { open, setOpen, toggle };
}

/** Ícono de ocultar / expandir de una sección. */
export function CollapseToggle({
  open,
  onToggle,
  label,
  className,
}: {
  open: boolean;
  onToggle: () => void;
  /** Nombre de la sección, para el tooltip y el lector de pantalla. */
  label: string;
  className?: string;
}) {
  const text = open ? `Ocultar ${label}` : `Expandir ${label}`;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={text}
      title={text}
      className={cn(
        "press inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      <ChevronDown className={cn("h-4 w-4 transition-transform duration-150", !open && "-rotate-90")} aria-hidden />
    </button>
  );
}

/** Botones «Contraer todo» / «Expandir todo» para un scope. */
export function CollapseAllControls({ scope, className }: { scope: string; className?: string }) {
  function fire(open: boolean) {
    window.dispatchEvent(new CustomEvent<CollapseDetail>(COLLAPSE_EVENT, { detail: { scope, open } }));
  }
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button type="button" size="sm" variant="outline" onClick={() => fire(false)} title="Ocultar el contenido de todas las secciones">
        <ChevronsDownUp className="h-3.5 w-3.5" />
        Contraer todo
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => fire(true)} title="Mostrar el contenido de todas las secciones">
        <ChevronsUpDown className="h-3.5 w-3.5" />
        Expandir todo
      </Button>
    </div>
  );
}

/** Tarjeta con encabezado y contenido que se oculta con el ícono. Para secciones
 *  que se renderizan en el servidor (los hijos pueden ser server components). */
export function CollapsibleCard({
  scope,
  label,
  title,
  children,
  defaultOpen = true,
  className,
}: {
  scope: string;
  /** Nombre corto para el tooltip («Ocultar …»). */
  label: string;
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const { open, toggle } = useCollapse(scope, defaultOpen);
  return (
    <Card className={className}>
      <CardHeader className={cn("flex-row items-center gap-1.5 space-y-0", open ? "" : "py-3")}>
        <CollapseToggle open={open} onToggle={toggle} label={label} />
        <CardTitle className="flex items-center gap-1.5">{title}</CardTitle>
      </CardHeader>
      {open && <CardContent className="flex flex-col gap-4 text-sm leading-relaxed">{children}</CardContent>}
    </Card>
  );
}

/** Bloque de página con título (h2), acciones al lado y contenido que se oculta con
 *  el ícono. Para los bloques grandes del panel principal. */
export function CollapsibleBlock({
  scope,
  label,
  title,
  actions,
  children,
  id,
  defaultOpen = true,
  wrapperClassName,
  headerClassName,
  titleClassName,
}: {
  scope: string;
  label: string;
  /** Contenido del h2 (texto + InfoHint). El ícono va antes. */
  title: React.ReactNode;
  /** Botones y controles a la derecha del título. */
  actions?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
  defaultOpen?: boolean;
  wrapperClassName?: string;
  headerClassName?: string;
  titleClassName?: string;
}) {
  const { open, toggle } = useCollapse(scope, defaultOpen);
  return (
    <div className={wrapperClassName}>
      <div id={id} className={headerClassName}>
        <h2 className={titleClassName}>
          <CollapseToggle open={open} onToggle={toggle} label={label} />
          {title}
        </h2>
        {actions}
      </div>
      {open && children}
    </div>
  );
}
