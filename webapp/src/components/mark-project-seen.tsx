"use client";

import { useEffect } from "react";

import { markProjectSeen } from "@/lib/seen-updates";

/** No pinta nada: al abrir un proyecto, anota la visita del perfil Junior para que el panel
 *  deje de señalarlo como «con novedades» hasta que haya una nota nueva. */
export function MarkProjectSeen({ profile, projectId }: { profile: string; projectId: string }) {
  useEffect(() => {
    markProjectSeen(profile, projectId);
  }, [profile, projectId]);
  return null;
}
