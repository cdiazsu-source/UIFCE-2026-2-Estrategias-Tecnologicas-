"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ClipboardList, X } from "lucide-react";

import { saveProfileAnswer } from "@/lib/actions/linkedin-profile";
import { PROFILE_QUESTIONS } from "@/lib/linkedin-profile-questions";
import { InfoHint } from "@/components/info-hint";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCanRecordMetrics } from "@/components/access-context";

const TOTAL = PROFILE_QUESTIONS.length;
/** Cuánto esperar sin teclear antes de guardar solo, en ms. Corto para que
 *  nunca se sienta que hay que acordarse de guardar. */
const AUTOSAVE_DELAY = 700;

/** Una pregunta por pantalla, respuestas cortas, autoguardado sin botón de
 *  enviar, se puede saltar de cualquier pregunta a cualquier otra con los
 *  puntos de arriba y salir en cualquier momento sin perder nada: pensado
 *  para que empezarla y dejarla a medias no cueste nada. */
export function LinkedInProfileTemplate({
  trackeeId,
  trackeeName,
  answers,
}: {
  trackeeId: string;
  trackeeName: string;
  answers: Record<string, string>;
}) {
  const canRecord = useCanRecordMetrics();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [savedFlash, setSavedFlash] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<Record<string, string>>({});
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const answeredCount = PROFILE_QUESTIONS.filter((q) => (answers[q.key] ?? "").trim().length > 0).length;

  useEffect(() => {
    if (!open) return;
    setValues({ ...answers });
    lastSavedRef.current = { ...answers };
    setIndex(0);
    // Solo al abrir: no queremos que una revalidación del servidor mientras
    // se escribe le pise el texto a medio terminar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!canRecord) return null;

  const question = PROFILE_QUESTIONS[index];

  function flush(key: string, value: string) {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const trimmed = value.trim();
    if ((lastSavedRef.current[key] ?? "") === trimmed) return;
    lastSavedRef.current[key] = trimmed;
    void saveProfileAnswer(trackeeId, key, value);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setSavedFlash(true);
    flashTimer.current = setTimeout(() => setSavedFlash(false), 1200);
  }

  function scheduleSave(key: string, value: string) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => flush(key, value), AUTOSAVE_DELAY);
  }

  function close() {
    flush(question.key, values[question.key] ?? "");
    setOpen(false);
  }

  function goTo(newIndex: number) {
    flush(question.key, values[question.key] ?? "");
    setIndex(newIndex);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-primary/40 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5"
      >
        <ClipboardList className="h-3.5 w-3.5" />
        Plantilla de perfil
        <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold">
          {answeredCount}/{TOTAL}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Plantilla de perfil de LinkedIn de ${trackeeName}`}
          className="fixed inset-0 z-50 flex flex-col bg-background"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{trackeeName}</p>
              <p className="text-xs text-muted-foreground">Plantilla de perfil de LinkedIn</p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="press inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>

          <div className="flex shrink-0 flex-wrap justify-center gap-2 border-b border-border bg-card px-4 py-3">
            {PROFILE_QUESTIONS.map((q, i) => {
              const done = (values[q.key] ?? "").trim().length > 0;
              const current = i === index;
              return (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Ir a la pregunta ${i + 1}${done ? " (ya respondida)" : ""}`}
                  aria-current={current}
                  className={`h-6 w-6 shrink-0 rounded-full text-[10px] font-semibold transition-colors ${
                    current
                      ? "bg-primary text-primary-foreground"
                      : done
                        ? "bg-primary/15 text-primary hover:bg-primary/25"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="flex flex-1 items-start justify-center overflow-y-auto px-4 py-8 sm:items-center sm:px-6">
            <div className="flex w-full max-w-lg flex-col gap-3">
              <p className="text-xs font-medium text-muted-foreground">
                Pregunta {index + 1} de {TOTAL}
              </p>
              <h2 className="flex items-start gap-1.5 text-xl font-bold leading-snug sm:text-2xl">
                <span>{question.prompt}</span>
                <InfoHint text={question.hint} />
              </h2>
              <Textarea
                key={question.key}
                autoFocus
                value={values[question.key] ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  setValues((prev) => ({ ...prev, [question.key]: v }));
                  scheduleSave(question.key, v);
                }}
                placeholder={question.placeholder}
                rows={5}
                className="min-h-[9rem] text-base"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValues((prev) => ({ ...prev, [question.key]: "" }));
                    flush(question.key, "");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Sin idea por ahora, seguir
                </button>
                {savedFlash && (
                  <p className="flex items-center gap-1 text-xs text-success" role="status">
                    <Check className="h-3.5 w-3.5" />
                    Guardado
                  </p>
                )}
              </div>
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-4 py-3 sm:px-6">
            <Button type="button" variant="ghost" size="sm" disabled={index === 0} onClick={() => goTo(index - 1)}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            {index < TOTAL - 1 ? (
              <Button type="button" size="sm" onClick={() => goTo(index + 1)}>
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" size="sm" onClick={close}>
                <Check className="h-4 w-4" />
                Listo por ahora
              </Button>
            )}
          </footer>
        </div>
      )}
    </>
  );
}
