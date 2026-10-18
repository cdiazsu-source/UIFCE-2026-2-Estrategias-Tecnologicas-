"use client";

import { useEffect, useState } from "react";

/** «Novedades» de un proyecto: la última vez que una persona abrió cada proyecto se guarda en este
 *  navegador (localStorage, por perfil: la clave del Junior, «master» o la identidad nominal). Si la
 *  bitácora tiene una nota de otra persona más reciente que esa visita, el proyecto se marca con
 *  novedades (chip «Con novedades» en el panel y aviso en la campana). No requiere base de datos;
 *  si el navegador no deja guardar, simplemente no se marca. */
const PREFIX = "et:novedades:";
/** Evento interno: avisa a las tarjetas y a la campana que cambió lo «visto». */
const SEEN_EVENT = "et:seen";

function read(profile: string): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(PREFIX + profile);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/** Anota que el perfil acaba de abrir el proyecto. */
export function markProjectSeen(profile: string, projectId: string) {
  markProjectsSeen(profile, [projectId]);
}

/** Anota la visita de varios proyectos a la vez («Marcar todo como visto»). */
export function markProjectsSeen(profile: string, projectIds: string[]) {
  try {
    const map = read(profile);
    const now = Date.now();
    for (const id of projectIds) map[id] = now;
    window.localStorage.setItem(PREFIX + profile, JSON.stringify(map));
  } catch {
    // Sin almacenamiento: no pasa nada, solo no se recuerda la visita.
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

/** Lo «visto» del perfil (proyecto → última visita en ms), que se refresca al abrir un proyecto.
 *  null mientras no se ha leído (primer render) o si no hay perfil. */
export function useSeenMap(profile: string | null): Record<string, number> | null {
  const [map, setMap] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (!profile) {
      setMap(null);
      return;
    }
    const refresh = () => setMap(read(profile));
    refresh();
    window.addEventListener(SEEN_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(SEEN_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [profile]);
  return map;
}

/** true si el proyecto tiene una novedad posterior a la última visita del perfil.
 *  `profile` null = sin perfil identificado (no se marca nada). */
export function useUnseenUpdate(profile: string | null, projectId: string, lastUpdateAt: string | null): boolean {
  const map = useSeenMap(lastUpdateAt ? profile : null);
  return !!map && !!lastUpdateAt && new Date(lastUpdateAt).getTime() > (map[projectId] ?? 0);
}
