"use client";

import { createContext, useContext } from "react";

/** true = perfil completo (edita todo). false = perfil junior (solo lectura +
 *  agregar notas de bitácora). */
const CanEditContext = createContext(false);

/** true = la sesión puede registrar mediciones de KPIs de redes. Lo cumplen
 *  tanto el perfil completo como el junior (ver src/lib/session.ts). */
const CanRecordMetricsContext = createContext(false);

/** true = la sesión puede gestionar el checklist (crear / editar / reordenar /
 *  marcar subtareas). Perfil completo y junior; el junior con restricciones
 *  (solo asigna a monitores Junior, no borra). */
const CanManageChecklistContext = createContext(false);

export function AccessProvider({
  canEdit,
  canRecordMetrics = false,
  canManageChecklist = false,
  children,
}: {
  canEdit: boolean;
  canRecordMetrics?: boolean;
  canManageChecklist?: boolean;
  children: React.ReactNode;
}) {
  return (
    <CanEditContext.Provider value={canEdit}>
      <CanRecordMetricsContext.Provider value={canRecordMetrics}>
        <CanManageChecklistContext.Provider value={canManageChecklist}>
          {children}
        </CanManageChecklistContext.Provider>
      </CanRecordMetricsContext.Provider>
    </CanEditContext.Provider>
  );
}

export function useCanEdit() {
  return useContext(CanEditContext);
}

export function useCanRecordMetrics() {
  return useContext(CanRecordMetricsContext);
}

export function useCanManageChecklist() {
  return useContext(CanManageChecklistContext);
}
