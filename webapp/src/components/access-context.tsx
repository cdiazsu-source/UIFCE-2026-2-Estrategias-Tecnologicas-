"use client";

import { createContext, useContext } from "react";

/** true = perfil completo (edita todo). false = perfil junior (solo lectura +
 *  agregar notas de bitácora). */
const CanEditContext = createContext(false);

/** true = la sesión puede registrar mediciones de KPIs de redes. Lo cumplen
 *  tanto el perfil completo como el junior (ver src/lib/session.ts). */
const CanRecordMetricsContext = createContext(false);

export function AccessProvider({
  canEdit,
  canRecordMetrics = false,
  children,
}: {
  canEdit: boolean;
  canRecordMetrics?: boolean;
  children: React.ReactNode;
}) {
  return (
    <CanEditContext.Provider value={canEdit}>
      <CanRecordMetricsContext.Provider value={canRecordMetrics}>
        {children}
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
