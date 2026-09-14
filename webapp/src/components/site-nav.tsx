"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Eye, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";
import { setJuniorView } from "@/lib/actions/view";

type NavLink = { href: string; label: string };
type NavGroup = { label: string; children: NavLink[] };
type NavEntry = NavLink | NavGroup;

function isGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

const LINKS: NavEntry[] = [
  { href: "/", label: "Panel principal" },
  { href: "/calendario", label: "Calendario" },
  {
    label: "Difusión y visibilidad",
    children: [
      { href: "/difusion/digital", label: "Difusión digital" },
      { href: "/difusion/fisica", label: "Difusión física" },
    ],
  },
  { href: "/plantillas", label: "Plantillas" },
  { href: "/linea-grafica", label: "Línea gráfica" },
  { href: "/herramientas", label: "Herramientas y licencias" },
  { href: "/aliados", label: "Aliados" },
  { href: "/equipo", label: "Equipo" },
];

const linkClass = (active: boolean) =>
  cn(
    "press rounded-md px-3 py-1.5 text-sm font-medium transition-[color,background-color] duration-150 ease-out-strong",
    active
      ? "bg-primary text-primary-foreground shadow-card"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
  );

/** Sub-menú desplegable para un grupo de enlaces relacionados (ej. "Difusión y
 *  visibilidad" → digital/física). Se resalta como activo si la ruta actual
 *  coincide con cualquiera de sus hijos; se cierra al hacer click afuera, con
 *  Escape, o al navegar. */
function NavGroupMenu({ group, pathname }: { group: NavGroup; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = group.children.some((c) => pathname.startsWith(c.href));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(linkClass(active), "inline-flex items-center gap-1")}
      >
        {group.label}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 flex min-w-[12rem] flex-col gap-0.5 rounded-md border border-border bg-card p-1 shadow-card">
          {group.children.map((c) => {
            const childActive = pathname.startsWith(c.href);
            return (
              <Link
                key={c.href}
                href={c.href}
                className={cn(
                  "press rounded px-2.5 py-1.5 text-sm font-medium transition-colors",
                  childActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                )}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SiteNav({
  canEdit = true,
  viewingAsJunior = false,
  canUseJuniorView = false,
}: {
  canEdit?: boolean;
  viewingAsJunior?: boolean;
  canUseJuniorView?: boolean;
}) {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <header className="site-nav sticky top-0 z-40 border-b border-border/60 bg-card/95 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-card/70">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3.5">
        <Link href="/" className="text-lg font-bold tracking-tight text-primary">
          ET en Marcha
        </Link>
        <nav className="flex flex-wrap gap-1">
          {LINKS.map((entry) => {
            if (isGroup(entry)) {
              return <NavGroupMenu key={entry.label} group={entry} pathname={pathname} />;
            }
            const active = entry.href === "/" ? pathname === "/" : pathname.startsWith(entry.href);
            return (
              <Link key={entry.href} href={entry.href} className={linkClass(active)}>
                {entry.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {viewingAsJunior ? (
            <form action={setJuniorView.bind(null, false)}>
              <button
                type="submit"
                className="press inline-flex items-center gap-1.5 rounded-full border border-warning/50 bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning hover:bg-warning/25"
              >
                <Eye className="h-3.5 w-3.5" />
                Vista Junior · salir
              </button>
            </form>
          ) : canUseJuniorView ? (
            <form action={setJuniorView.bind(null, true)}>
              <button
                type="submit"
                className="press inline-flex items-center gap-1.5 rounded-full border border-input px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                title="Ver la app como la ve un monitor Junior"
              >
                <Eye className="h-3.5 w-3.5" />
                Vista Junior
              </button>
            </form>
          ) : !canEdit ? (
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              Modo lectura
            </span>
          ) : null}
          <form action={logout}>
            <button
              type="submit"
              className="press inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-[color,background-color] duration-150 ease-out-strong hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
