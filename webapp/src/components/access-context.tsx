"use client";

import { createContext, useContext } from "react";

/** true = perfil completo (edita todo). false = perfil junior (solo lectura +
 *  agregar notas de bitácora). */
const CanEditContext = createContext(false);

export function AccessProvider({ canEdit, children }: { canEdit: boolean; children: React.ReactNode }) {
  return <CanEditContext.Provider value={canEdit}>{children}</CanEditContext.Provider>;
}

export function useCanEdit() {
  return useContext(CanEditContext);
}
