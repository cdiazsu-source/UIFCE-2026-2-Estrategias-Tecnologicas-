"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Ev = { k: "MODULE" | "PROJECT" | "CLICK" | "CHANGE"; p: string; l?: string };

const FLUSH_MS = 8000;
const FLUSH_AT = 30;
/** Un guardado cuenta con el botón que se tocó hasta 2 s antes. */
const CLICK_LINK_MS = 2000;

/** Huella digital de un monitor Junior (solo se monta para ellos; ver `getTrackedWho` en lib/activity.ts): anota a qué pantalla o
 *  proyecto entra, el nombre del botón o enlace que toca y cada acción de guardado que ejecuta (una llamada de server action de
 *  Next lleva la cabecera `Next-Action`). Nunca lee lo escrito en los campos. Manda lotes a /api/actividad cada pocos segundos y al
 *  cerrar o ocultar la pestaña. */
export function ActivityTracker() {
  const pathname = usePathname();
  const queue = useRef<Ev[]>([]);
  const lastClick = useRef<{ label: string; at: number } | null>(null);

  useEffect(() => {
    const flush = () => {
      if (queue.current.length === 0) return;
      const events = queue.current.splice(0, queue.current.length);
      try {
        fetch("/api/actividad", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ events }), keepalive: true }).catch(() => {});
      } catch {
        // Sin red: se pierde ese lote, no se rompe nada.
      }
    };
    const push = (ev: Ev) => {
      queue.current.push(ev);
      if (queue.current.length >= FLUSH_AT) flush();
    };

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('button, a[href], summary, [role="button"], [role="tab"]');
      if (!el) return;
      const raw = el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "";
      const label = raw.replace(/\s+/g, " ").trim().slice(0, 60);
      if (!label) return;
      lastClick.current = { label, at: Date.now() };
      push({ k: "CLICK", p: location.pathname, l: label });
    };
    document.addEventListener("click", onClick, true);

    // Las llamadas de server action (cualquier guardado) pasan por fetch con la cabecera Next-Action.
    const originalFetch = window.fetch;
    window.fetch = function patchedFetch(this: unknown, input: RequestInfo | URL, init?: RequestInit) {
      try {
        const headers = new Headers(init?.headers ?? (typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined));
        if (headers.has("Next-Action")) {
          const c = lastClick.current;
          push({ k: "CHANGE", p: location.pathname, l: c && Date.now() - c.at < CLICK_LINK_MS ? c.label : undefined });
        }
      } catch {
        // Lo que no se pueda leer no se anota.
      }
      return originalFetch.call(this, input, init);
    } as typeof window.fetch;

    const timer = setInterval(flush, FLUSH_MS);
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      window.fetch = originalFetch;
      clearInterval(timer);
      flush();
    };
  }, []);

  // Entrar a una pantalla o a un proyecto.
  useEffect(() => {
    if (!pathname) return;
    queue.current.push({ k: /^\/proyectos\/[^/]+/.test(pathname) ? "PROJECT" : "MODULE", p: pathname });
  }, [pathname]);

  return null;
}
