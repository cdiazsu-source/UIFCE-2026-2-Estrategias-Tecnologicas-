"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

import { SEARCH_GROUP_LABEL, SEARCH_MIN_CHARS, type SearchHit } from "@/lib/search";
import { cn } from "@/lib/utils";

/** Buscador de la barra superior: palabras clave entre módulos, proyectos, subtareas, bitácora y más (ver app/api/buscar). */
export function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const ready = q.trim().length >= SEARCH_MIN_CHARS;

  // Consulta con una pausa corta al escribir; una respuesta vieja nunca pisa a una más nueva.
  useEffect(() => {
    if (!ready) {
      setHits([]);
      setLoading(false);
      setFailed(false);
      return;
    }
    setLoading(true);
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/buscar?q=${encodeURIComponent(q.trim())}`, { signal: ctl.signal });
        if (!r.ok) throw new Error(String(r.status));
        const d = (await r.json()) as { hits: SearchHit[] };
        setHits(d.hits);
        setFailed(false);
        setActive(0);
        setLoading(false);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setHits([]);
        setFailed(true);
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [q, ready]);

  // «/» enfoca el buscador (salvo al escribir en un campo); clic fuera lo cierra.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  // Resultados agrupados, conservando el orden de la lista para el teclado.
  const groups = useMemo(() => {
    const out: { label: string; items: { hit: SearchHit; index: number }[] }[] = [];
    hits.forEach((hit, index) => {
      const label = SEARCH_GROUP_LABEL[hit.group];
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push({ hit, index });
      else out.push({ label, items: [{ hit, index }] });
    });
    return out;
  }, [hits]);

  const go = (hit: SearchHit) => {
    setOpen(false);
    setQ("");
    input.current?.blur();
    router.push(hit.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (q) setQ("");
      else input.current?.blur();
      setOpen(false);
    } else if (e.key === "ArrowDown" && hits.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % hits.length);
    } else if (e.key === "ArrowUp" && hits.length) {
      e.preventDefault();
      setActive((a) => (a - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      go(hits[active]);
    }
  };

  const showPanel = open && ready;

  return (
    <div ref={box} className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        ref={input}
        type="search"
        role="combobox"
        aria-label="Buscar en la app"
        aria-expanded={showPanel}
        aria-controls="resultados-busqueda"
        aria-autocomplete="list"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Buscar proyectos, módulos, notas…  ( / )"
        autoComplete="off"
        className="h-10 w-full rounded-full border border-border bg-background pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
      />
      {loading ? (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
      ) : q ? (
        <button
          type="button"
          onClick={() => {
            setQ("");
            input.current?.focus();
          }}
          aria-label="Borrar la búsqueda"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}

      {showPanel && (
        <div id="resultados-busqueda" role="listbox" className="absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-lg">
          {failed ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">No se pudo buscar ahora. Intenta de nuevo.</p>
          ) : !loading && hits.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Sin resultados para «{q.trim()}».</p>
          ) : (
            groups.map((g) => (
              <div key={g.label} className="py-1">
                <p className="px-3 pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</p>
                {g.items.map(({ hit, index }) => (
                  <button
                    key={hit.id}
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(hit)}
                    className={cn("flex w-full flex-col rounded-lg px-3 py-2 text-left outline-none", index === active ? "bg-muted" : "hover:bg-muted")}
                  >
                    <span className="line-clamp-2 break-words text-sm font-medium">{hit.title}</span>
                    {hit.detail && <span className="line-clamp-1 text-xs text-muted-foreground">{hit.detail}</span>}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
