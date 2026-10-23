"use client";

import { PanelTop } from "lucide-react";

import { PREVIEW_WELCOME_EVENT } from "@/components/welcome-layer";

/** Botón de «Ver como»: abre la pantalla de bienvenida tal como la verá el perfil que se está viendo al abrir la app. */
export function PreviewWelcomeButton({ className, iconClassName, onDone, children }: { className?: string; iconClassName?: string; onDone?: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.dispatchEvent(new Event(PREVIEW_WELCOME_EVENT));
        onDone?.();
      }}
    >
      <PanelTop className={iconClassName} aria-hidden />
      {children}
    </button>
  );
}
