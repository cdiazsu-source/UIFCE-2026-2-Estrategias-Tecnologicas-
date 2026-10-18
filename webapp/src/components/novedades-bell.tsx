"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BellRing, Check } from "lucide-react";

import { markProjectsSeen, useSeenMap } from "@/lib/seen-updates";
import { cn, timeAgo } from "@/lib/utils";

export type NovedadItem = { id: string; title: string; at: string; author: string | null };

/** Campana de novedades: avisa cuando hay notas nuevas de otras personas en la bitácora de los
 *  proyectos asignados a quien está en sesión (máster, Junior, etc.). El número es la cantidad de
 *  proyectos con novedades que aún no ha abierto; el panel lista cuáles y lleva a cada uno. Abrir el
 *  proyecto (o «Marcar todo como visto») apaga el aviso hasta que haya una nota nueva. */
export function NovedadesBell({ profile, items }: { profile: string; items: NovedadItem[] }) {
  const seen = useSeenMap(profile);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const unseen = seen
    ? items.filter((i) => new Date(i.at).getTime() > (seen[i.id] ?? 0)).sort((a, b) => b.at.localeCompare(a.at))
    : [];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const n = unseen.length;
  const label =
    n > 0
      ? `Novedades: ${n} ${n === 1 ? "proyecto tiene" : "proyectos tienen"} notas nuevas en la bitácora`
      : "Novedades: estás al día";
  const Icon = n > 0 ? BellRing : Bell;

  return (
    <div ref={boxRef} className="fixed right-3 top-2 z-40 print:hidden lg:top-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        title={label}
        className={cn(
          "press relative flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-primary shadow-card outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
          n > 0 && "border-primary/40",
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
        {n > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent px-1 text-[11px] font-bold leading-none text-brand-accent-foreground ring-2 ring-card">
            {n}
          </span>
        )}
      </button>

      {open && (
        <div
          role="region"
          aria-label="Novedades en tus proyectos"
          className="absolute right-0 top-12 w-[min(22rem,calc(100vw-1.5rem))] rounded-lg border border-border bg-card p-3 shadow-card-hover"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Novedades en tus proyectos</p>
          {n === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Estás al día: no hay notas nuevas de otras personas en la bitácora de tus proyectos asignados.
            </p>
          ) : (
            <>
              <ul className="mt-2 flex max-h-72 flex-col gap-1 overflow-y-auto">
                {unseen.map((i) => (
                  <li key={i.id}>
                    <Link
                      href={`/proyectos/${i.id}`}
                      className="block rounded-md px-2 py-1.5 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="block text-sm font-medium leading-snug">{i.title}</span>
                      <span className="block text-xs text-muted-foreground">
                        Nota de {i.author ?? "alguien del equipo"} · {timeAgo(i.at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => markProjectsSeen(profile, unseen.map((i) => i.id))}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-link outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Check className="h-3.5 w-3.5" aria-hidden />
                Marcar todo como visto
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
