"use client";

import { useEffect, useState } from "react";

/** «Novedades» de un proyecto para un perfil Junior: la última vez que abrió cada proyecto se
 *  guarda en este navegador (localStorage, por perfil). Si la bitácora tiene una nota de otra
 *  persona más reciente que esa visita, el proyecto se marca con novedades (titila en el panel).
 *  No requiere base de datos; si el navegador no deja guardar, simplemente no se marca. */
const PREFIX = "et:novedades:";

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
  try {
    const map = read(profile);
    map[projectId] = Date.now();
    window.localStorage.setItem(PREFIX + profile, JSON.stringify(map));
  } catch {
    // Sin almacenamiento: no pasa nada, solo no se recuerda la visita.
  }
}

/** true si el proyecto tiene una novedad posterior a la última visita del perfil.
 *  `profile` null = no aplica (no es la vista de un Junior). */
export function useUnseenUpdate(profile: string | null, projectId: string, lastUpdateAt: string | null): boolean {
  const [unseen, setUnseen] = useState(false);
  useEffect(() => {
    if (!profile || !lastUpdateAt) {
      setUnseen(false);
      return;
    }
    setUnseen(new Date(lastUpdateAt).getTime() > (read(profile)[projectId] ?? 0));
  }, [profile, projectId, lastUpdateAt]);
  return unseen;
}
