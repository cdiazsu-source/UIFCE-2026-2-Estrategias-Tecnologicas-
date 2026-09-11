"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eye, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";
import { setJuniorView } from "@/lib/actions/view";

const LINKS = [
  { href: "/", label: "Panel principal" },
  { href: "/horario", label: "Horario" },
  { href: "/redes", label: "Redes sociales" },
  { href: "/plantillas", label: "Plantillas" },
  { href: "/linea-grafica", label: "Línea gráfica" },
  { href: "/herramientas", label: "Herramientas y licencias" },
  { href: "/contactos", label: "Contactos" },
  { href: "/equipo", label: "Equipo" },
];

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
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "press rounded-md px-3 py-1.5 text-sm font-medium transition-[color,background-color] duration-150 ease-out-strong",
                  active
                    ? "bg-primary text-primary-foreground shadow-card"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {link.label}
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
