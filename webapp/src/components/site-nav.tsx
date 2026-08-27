"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { logout } from "@/lib/actions/auth";

const LINKS = [
  { href: "/", label: "Panel principal" },
  { href: "/proyectos-de-estudio", label: "Proyectos de estudio" },
  { href: "/linea-grafica", label: "Línea gráfica" },
  { href: "/herramientas", label: "Herramientas y licencias" },
  { href: "/contactos", label: "Contactos" },
  { href: "/equipo", label: "Equipo" },
];

export function SiteNav() {
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
        <form action={logout} className="ml-auto">
          <button
            type="submit"
            className="press inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-[color,background-color] duration-150 ease-out-strong hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Salir
          </button>
        </form>
      </div>
    </header>
  );
}
