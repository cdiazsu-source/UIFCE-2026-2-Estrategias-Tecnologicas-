"use client";

import { useSyncExternalStore } from "react";

export type PersonFilter = { id: string; name: string };

/** Filtro rápido «proyectos de esta persona». Vive en memoria del navegador y lo
 *  comparten el listado de integrantes (que lo activa) y la cuadrícula de
 *  proyectos (que lo aplica) sin pasar por la URL ni por el servidor. */
let current: PersonFilter | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setPersonFilter(next: PersonFilter | null) {
  current = next;
  emit();
}

/** Activa el filtro de esa persona; si ya estaba activo, lo quita. */
export function togglePersonFilter(person: PersonFilter) {
  setPersonFilter(current?.id === person.id ? null : person);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePersonFilter(): PersonFilter | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}
