"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";

import { applyUndo } from "@/lib/actions/undo";
import { undoLabel, type UndoAction } from "@/lib/undo";

type Pending = { action: UndoAction; message: string; id: number };

const UndoContext = createContext<(action: UndoAction, message?: string) => void>(() => {});

/** Muestra un banner efímero "Deshacer" tras cada modificación o eliminación.
 *  El descriptor de cómo revertir lo trae la propia acción de servidor. */
export function useUndo() {
  return useContext(UndoContext);
}

const VISIBLE_MS = 8000;

export function UndoProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const push = useCallback((action: UndoAction, message?: string) => {
    const id = ++seq.current;
    setPending({ action, message: message ?? undoLabel(action.kind), id });
  }, []);

  useEffect(() => {
    if (!pending) return;
    clearTimer();
    timer.current = setTimeout(() => setPending((p) => (p && p.id === pending.id ? null : p)), VISIBLE_MS);
    return clearTimer;
  }, [pending]);

  const dismiss = () => {
    clearTimer();
    setPending(null);
  };

  const doUndo = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await applyUndo(pending.action);
    } finally {
      setBusy(false);
      dismiss();
    }
  };

  return (
    <UndoContext.Provider value={push}>
      {children}
      {pending && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-sm shadow-card-hover">
            <span className="text-foreground">{pending.message}</span>
            <button
              type="button"
              onClick={doUndo}
              disabled={busy}
              className="press inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {busy ? "Deshaciendo…" : "Deshacer"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded p-1 text-muted-foreground hover:bg-accent"
              aria-label="Cerrar aviso"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </UndoContext.Provider>
  );
}
