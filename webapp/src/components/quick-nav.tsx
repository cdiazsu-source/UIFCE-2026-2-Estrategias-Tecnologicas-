"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CalendarRange,
  FileSignature,
  FileText,
  FolderKanban,
  Gauge,
  GraduationCap,
  ListChecks,
  type LucideIcon,
  MessagesSquare,
  NotebookPen,
  Target,
  Users,
  Wallet,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { expandScope } from "@/components/collapsible";

type NavItem = {
  /** id del elemento al que se salta; el botón solo aparece si existe en la página. */
  id: string;
  label: string;
  icon: LucideIcon;
  /** Sección contraíble que se abre al saltar a ella (ver collapsible.tsx). */
  scope?: string;
};

/** Apartados del Panel principal, en el orden en que aparecen. */
const HOME_ITEMS: NavItem[] = [
  { id: "situacion", label: "Situación actual", icon: Gauge },
  { id: "semestre", label: "Semestre y objetivos", icon: Target },
  { id: "integrantes", label: "Integrantes", icon: Users },
  { id: "proyectos", label: "Proyectos", icon: FolderKanban, scope: "home:proyectos" },
  { id: "estudio", label: "Proyectos de estudio", icon: GraduationCap, scope: "home:estudio" },
  { id: "comentarios-estudio", label: "Comentarios de proyectos de estudio", icon: MessagesSquare },
  { id: "actividad", label: "Actividad reciente", icon: Activity, scope: "home:actividad" },
];

/** Apartados del detalle de un proyecto. */
const PROJECT_ITEMS: NavItem[] = [
  { id: "p-descripcion", label: "Qué se debe hacer", icon: FileText, scope: "project:descripcion" },
  { id: "p-actividades", label: "Actividades del proyecto", icon: CalendarRange, scope: "project:actividades" },
  { id: "p-consentimientos", label: "Consentimientos", icon: FileSignature, scope: "project:consentimientos" },
  { id: "p-gastos", label: "Seguimiento de gastos", icon: Wallet, scope: "project:gastos" },
  { id: "p-checklist", label: "Checklist", icon: ListChecks, scope: "project:checklist" },
  { id: "p-bitacora", label: "Bitácora", icon: NotebookPen, scope: "project:bitacora" },
];

function itemsFor(pathname: string): NavItem[] {
  if (pathname === "/") return HOME_ITEMS;
  if (/^\/proyectos\/[^/]+$/.test(pathname)) return PROJECT_ITEMS;
  return [];
}

/** Distancia (px) desde el borde superior a partir de la cual una sección cuenta
 *  como «la actual»: deja pasar la barra superior fija. */
const ACTIVE_OFFSET = 120;

/** Menú rápido lateral: un botón con ícono por apartado importante de la página,
 *  para saltar a él de un clic sin hacer scroll. Siempre incluye «Ir arriba» e «Ir
 *  abajo»; los apartados solo aparecen si existen en la página actual. Resalta el
 *  apartado en el que se está. Solo en pantallas anchas (lg+), para no tapar contenido. */
export function QuickNav() {
  const pathname = usePathname();
  const [present, setPresent] = useState<NavItem[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    const all = itemsFor(pathname);
    const find = () => setPresent(all.filter((i) => document.getElementById(i.id)));
    find();
    // Segunda pasada por si algún bloque del cliente se pinta un instante después.
    const t = setTimeout(find, 400);
    return () => clearTimeout(t);
  }, [pathname]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function update() {
      timer = undefined;
      let current = "";
      for (const i of present) {
        const el = document.getElementById(i.id);
        if (el && el.getBoundingClientRect().top <= ACTIVE_OFFSET) current = i.id;
      }
      setActive(current);
    }
    // Se agrupan los eventos de scroll en una sola actualización cada ~80 ms.
    function onScroll() {
      if (timer === undefined) timer = setTimeout(update, 80);
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [present]);

  if (pathname === "/login") return null;

  /** Scroll suave, salvo que la persona haya pedido reducir el movimiento. */
  function behavior(): ScrollBehavior {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  }

  function goTo(item: NavItem) {
    if (item.scope) expandScope(item.scope);
    // Espera un instante: si la sección estaba contraída, su contenido se abre antes de medir.
    setTimeout(() => {
      document.getElementById(item.id)?.scrollIntoView({ behavior: behavior(), block: "start" });
    }, item.scope ? 60 : 0);
  }

  const btn =
    "press group relative flex h-9 w-9 items-center justify-center rounded-full transition-colors";

  return (
    <nav
      aria-label="Menú rápido"
      className="fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-1 rounded-full border border-border bg-card/95 p-1 shadow-card backdrop-blur print:hidden lg:flex"
    >
      <Tip label="Ir arriba">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: behavior() })}
          aria-label="Ir arriba"
          className={cn(btn, "text-muted-foreground hover:bg-accent hover:text-foreground")}
        >
          <ArrowUp className="h-[18px] w-[18px]" aria-hidden />
        </button>
      </Tip>

      {present.length > 0 && <span className="mx-2 my-0.5 h-px bg-border" aria-hidden />}

      {present.map((item) => {
        const Icon = item.icon;
        const on = active === item.id;
        return (
          <Tip key={item.id} label={item.label}>
            <button
              type="button"
              onClick={() => goTo(item)}
              aria-label={item.label}
              aria-current={on ? "true" : undefined}
              className={cn(
                btn,
                on
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </Tip>
        );
      })}

      {present.length > 0 && <span className="mx-2 my-0.5 h-px bg-border" aria-hidden />}

      <Tip label="Ir abajo">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: behavior() })}
          aria-label="Ir abajo"
          className={cn(btn, "text-muted-foreground hover:bg-accent hover:text-foreground")}
        >
          <ArrowDown className="h-[18px] w-[18px]" aria-hidden />
        </button>
      </Tip>
    </nav>
  );
}

/** Rótulo que aparece a la izquierda del botón al pasar el cursor o enfocarlo. */
function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-card transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {label}
      </span>
    </div>
  );
}
